import express from 'express';
import { getOverview } from '../controllers/dashboard.controller.js';
import authAdmin from '../middlewares/authAdmin.js';

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', authAdmin, getOverview);

export default router;
