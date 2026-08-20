import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Customer from './models/Customer.js';
import bcrypt from 'bcryptjs';
import registerMilkSocket from './sockets/milk.socket.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register Socket.IO handlers
registerMilkSocket(io);

// Connect to Database and Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.set('io', io);

    // Assign customerNo to existing customers who don't have one
    const customersWithoutNo = await Customer.find({ customerNo: { $exists: false } }).sort({ createdAt: 1 });
    if (customersWithoutNo.length > 0) {
      console.log(`Found ${customersWithoutNo.length} customers without customerNo. Assigning numbers...`);
      // Find the current max customerNo
      const lastCustomer = await Customer.findOne({ customerNo: { $exists: true } }).sort({ customerNo: -1 });
      let currentNo = lastCustomer && lastCustomer.customerNo ? lastCustomer.customerNo : 0;
      
      for (const customer of customersWithoutNo) {
        currentNo += 1;
        customer.customerNo = currentNo;
        await customer.save();
      }
      console.log(`Successfully assigned customer numbers up to ${currentNo}`);
    }

    // Seed default admin account if none exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('No admin users found. Seeding default owner account...');
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@milkdiary.com';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'AdminSecure@2026';
      const defaultName = process.env.ADMIN_NAME || 'Owner Admin';
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      
      await Admin.create({
        name: defaultName,
        email: defaultEmail.toLowerCase(),
        passwordHash,
        role: 'owner',
      });
      console.log(`Default admin account seeded: ${defaultEmail}`);
    }

    server.listen(PORT, () => {
      console.log(`Server running in development mode on port ${PORT}`);
    });
  } catch (error) {
    console.warn(`[Warning] Unable to connect to MongoDB: ${error.message}`);
    console.log('Starting server anyway to allow health-check calls...');
    server.listen(PORT, () => {
      console.log(`Server running (DB offline) on port ${PORT}`);
    });
  }
};

startServer();
export { io };
