import jwt from 'jsonwebtoken';
import * as entriesService from '../services/entries.service.js';

export default function registerMilkSocket(io) {
  // Middleware to authenticate socket connections before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error. Token is required.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      return next(new Error('Authentication error. Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    
    // Join rooms based on credentials
    if (role === 'owner') {
      socket.join('admin');
      console.log(`[Socket] Admin joined room 'admin': ${socket.id}`);
    } else {
      socket.join(`customer:${id}`);
      console.log(`[Socket] Customer joined room 'customer:${id}': ${socket.id}`);
    }

    // Handle real-time delivery recording
    socket.on('milk:add', async (data, ack) => {
      try {
        if (role !== 'owner') {
          return ack?.({ success: false, error: 'Unauthorized. Only admins can record deliveries.' });
        }

        const { customerId, ml, date } = data;
        if (!customerId || ml === undefined) {
          return ack?.({ success: false, error: 'Missing customerId or quantity.' });
        }

        const resolvedDate = date || new Date().toLocaleDateString('en-CA');
        const entry = await entriesService.addMilk(customerId, ml, resolvedDate);

        const socketPayload = {
          customerId,
          date: resolvedDate,
          ml,
          monthTotals: {
            totalMl: entry.totalMl,
            totalAmount: entry.totalAmount,
          },
        };

        // Broadcast to other admins and the customer room
        socket.to('admin').emit('milk:added', socketPayload);
        
        io.to(`customer:${customerId}`).emit('milk:added', {
          date: resolvedDate,
          ml,
          monthTotals: {
            totalMl: entry.totalMl,
            totalAmount: entry.totalAmount,
          },
        });

        // Acknowledge back to sender
        ack?.({ success: true, data: entry });
      } catch (err) {
        console.error('[Socket] milk:add error:', err.message);
        ack?.({ success: false, error: err.message || 'Failed to record entry.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
