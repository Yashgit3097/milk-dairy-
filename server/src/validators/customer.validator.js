import { z } from 'zod';

const mobileRegex = /^[6-9]\d{9}$/;

export const createCustomerSchema = {
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    mobile: z.string({
      required_error: 'Mobile number is required',
    }).regex(mobileRegex, 'Mobile must be a valid 10-digit Indian number starting with 6-9'),
    area: z.string({
      required_error: 'Area name is required',
    }).min(2, 'Area name must be at least 2 characters').max(50, 'Area name cannot exceed 50 characters'),
    pricePerLiter: z.number().positive('Price must be a positive number').nullable().optional(),
  }),
};

export const updateCustomerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').optional(),
    mobile: z.string().regex(mobileRegex, 'Mobile must be a valid 10-digit Indian number').optional(),
    area: z.string().min(2, 'Area name must be at least 2 characters').max(50, 'Area name cannot exceed 50 characters').optional(),
    pricePerLiter: z.number().positive('Price must be a positive number').nullable().optional(),
    status: z.enum(['active', 'inactive'], {
      invalid_type_error: 'Status must be active or inactive',
    }).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'Customer ID param is required'),
  }),
};

export const getCustomerByIdSchema = {
  params: z.object({
    id: z.string().min(1, 'Customer ID param is required'),
  }),
};
