import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import authAdmin from '../middlewares/authAdmin.js';
import validate from '../middlewares/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerByIdSchema,
} from '../validators/customer.validator.js';

const router = express.Router();

// Apply admin authentication middleware to all customer endpoints
router.use(authAdmin);

// POST /api/customers - Create customer
router.post('/', validate(createCustomerSchema), customerController.create);

// GET /api/customers - List customers
router.get('/', customerController.list);

// GET /api/customers/:id - Retrieve customer profile
router.get('/:id', validate(getCustomerByIdSchema), customerController.getById);

// PUT /api/customers/:id - Update customer profile
router.put('/:id', validate(updateCustomerSchema), customerController.update);

// DELETE /api/customers/:id - Soft-delete customer (status = inactive)
router.delete('/:id', validate(getCustomerByIdSchema), customerController.remove);

export default router;
