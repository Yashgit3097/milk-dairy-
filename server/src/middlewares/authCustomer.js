import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

export default async function authCustomer(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Access denied. Customer authorization token is required.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify role is customer
    if (!decoded.id || decoded.role !== 'customer') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. Invalid access role.',
      });
    }

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Unauthorized. Customer profile does not exist.',
      });
    }

    if (customer.status !== 'active') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. Customer account is currently inactive.',
      });
    }

    if (!customer.isActivated) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. Account must be activated first.',
      });
    }

    // Attach customer context to the request
    req.customer = customer;
    next();
  } catch (error) {
    console.error(`[AuthCustomer Middleware] Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Session expired or invalid customer token. Please log in again.',
    });
  }
}
