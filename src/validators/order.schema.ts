import { z } from 'zod';

export const createOrderSchema = z.object({
    body: z.object({
        productSlug: z.string().min(1, 'Product slug is required'),
        customerName: z.string().min(2, 'Name must be at least 2 characters'),
        customerEmail: z.string().email('Invalid email address'),
        customerPhone: z.string().min(8, 'Phone number must be at least 8 digits'),
        address: z.string().min(10, 'Address must be at least 10 characters'),
        couponCode: z.string().optional(),
        quantity: z.number().int().positive().default(1),
    }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
