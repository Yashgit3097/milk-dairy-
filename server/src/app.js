import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import errorHandler from './middlewares/errorHandler.js';
import mongoose from 'mongoose';

// Route imports
import adminRoutes from './routes/admin.routes.js';
import customerRoutes from './routes/customer.routes.js';
import entriesRoutes from './routes/entries.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import customerFacingRoutes from './routes/customerFacing.routes.js';

const app = express();

// Apply security headers
app.use(helmet());

// Apply CORS options
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true,
}));

// Body parser
app.use(express.json());

// Register API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customers', entriesRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/customer', customerFacingRoutes);

// Base health check route
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({
    success: true,
    data: {
      status: 'Server is healthy',
      database: dbStatus,
      timestamp: new Date().toISOString()
    },
    error: null
  });
});

// Fallback for unhandled routes
app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

// Global error handler
app.use(errorHandler);

export default app;
