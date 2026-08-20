import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export default async function authAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Access denied. Authorization token is required.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure it contains the admin ID
    if (!decoded.id || decoded.role !== 'owner') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden. Invalid access role.',
      });
    }

    const admin = await Admin.findById(decoded.id).select('-passwordHash');
    if (!admin) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Unauthorized. Admin user no longer exists.',
      });
    }

    // Attach admin context to the request
    req.admin = admin;
    next();
  } catch (error) {
    console.error(`[AuthAdmin Middlewar] Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Session expired or invalid token. Please log in again.',
    });
  }
}
