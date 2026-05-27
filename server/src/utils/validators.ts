import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const complaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  departmentId: z.string().min(1, 'Department is required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['under_review', 'in_progress', 'resolved', 'rejected']),
  remarks: z.string().optional(),
});

export const createOfficerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
});
