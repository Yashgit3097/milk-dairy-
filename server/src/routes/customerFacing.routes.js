import express from 'express';
import { activateCustomer, getMeOverview } from '../controllers/customer.controller.js';
import * as pushController from '../controllers/push.controller.js';
import authCustomer from '../middlewares/authCustomer.js';
import validate from '../middlewares/validate.js';
import rateLimiter from '../middlewares/rateLimiter.js';
import { activationSchema } from '../validators/schemas.validator.js';

const router = express.Router();

// POST /api/customer/activate with rate limiting and verification checks
router.post(
  '/activate',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  validate({ body: activationSchema }),
  activateCustomer
);

// GET /api/customer/me/overview
router.get('/me/overview', authCustomer, getMeOverview);

// Push Notifications subscription
router.post('/push/subscribe', authCustomer, pushController.subscribe);
router.post('/push/unsubscribe', authCustomer, pushController.unsubscribe);

export default router;
