import express from 'express';
import { login } from '../controllers/admin.controller.js';
import { listPriceConfigs, createPriceConfig } from '../controllers/pricing.controller.js';
import authAdmin from '../middlewares/authAdmin.js';
import validate from '../middlewares/validate.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import { loginSchema, pricingSchema } from '../validators/schemas.validator.js';

const router = express.Router();

// Public login route with rate limiting and input validation
router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }),
  validate({ body: loginSchema }),
  login
);

// Protected pricing routes
router.get('/pricing', authAdmin, listPriceConfigs);
router.post('/pricing', authAdmin, validate({ body: pricingSchema }), createPriceConfig);

export default router;
