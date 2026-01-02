import { z } from 'zod';

export const createCouponSchema = z.object({
    body: z.object({
        code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
        type: z.enum(['PERCENTAGE', 'FIXED']),
        value: z.number().int().positive('Value must be positive'),
        minOrderAmount: z.number().int().positive().optional().nullable(),
        maxUsage: z.number().int().positive().optional().nullable(),
        expiryDate: z.string().transform((str) => new Date(str)),
    }),
});

export const updateCouponSchema = z.object({
    body: z.object({
        code: z.string().min(3).toUpperCase().optional(),
        type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
        value: z.number().int().positive().optional(),
        minOrderAmount: z.number().int().positive().optional().nullable(),
        maxUsage: z.number().int().positive().optional().nullable(),
        expiryDate: z.string().transform((str) => new Date(str)).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

export const validateCouponSchema = z.object({
    body: z.object({
        code: z.string().min(1, 'Coupon code is required'),
        orderAmount: z.number().positive('Order amount must be positive'),
    }),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>['body'];
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>['body'];
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>['body'];
