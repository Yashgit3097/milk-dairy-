import express from 'express';
import * as entriesController from '../controllers/entries.controller.js';
import authAdmin from '../middlewares/authAdmin.js';
import validate from '../middlewares/validate.js';
import { quickAddSchema } from '../validators/schemas.validator.js';

const router = express.Router();

// Apply authAdmin middleware to restrict to authenticated admins in Phase 2/3
router.get('/:id/entries', authAdmin, entriesController.getMonthlyCards);
router.get('/:id/entries/:month', authAdmin, entriesController.getCardByMonth);

// Quick Add write operations
router.post('/quick-add', authAdmin, validate({ body: quickAddSchema }), entriesController.quickAdd);
router.delete('/:customerId/undo', authAdmin, entriesController.undo);
router.get('/month/:month', authAdmin, entriesController.getCardsByMonthForAll);

export default router;
