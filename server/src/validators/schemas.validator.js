import { z } from 'zod';

// Schema for Admin Login
export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please provide a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
});

// Schema for Customer Activation
export const activationSchema = z.object({
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, {
    message: 'Mobile number must be a valid 10-digit number starting with 6-9.',
  }),
  activationCode: z.string().trim().min(1, { message: 'Activation code cannot be empty.' }),
});

// Schema for Quick Add Entries
export const quickAddSchema = z.object({
  customerId: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid customer ID format.',
  }),
  ml: z.number().min(0, { message: 'Quantity in ml must be a positive number.' }),
  shift: z.enum(['morning', 'evening']).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format.',
    })
    .optional(),
});

// Schema for global Price Config versions
export const pricingSchema = z.object({
  rate: z.number().min(0, { message: 'Rate must be a non-negative number.' }),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Date must be in YYYY-MM-DD format.',
    })
    .optional(),
});
