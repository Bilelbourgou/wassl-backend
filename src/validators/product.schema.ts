import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
        name: z.string().min(2, 'Name must be at least 2 characters'),
        description: z.string().min(10, 'Description must be at least 10 characters'),
        price: z.number().int().positive('Price must be positive'),
        oldPrice: z.number().int().positive().optional().nullable(),
        stock: z.number().int().min(0).default(100),
        category: z.enum(['NFC Cards', 'Review Plates']),
        features: z.array(z.string()).default([]),
        imageUrl: z.string().url().optional().nullable(),
        isActive: z.boolean().default(true),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens').optional(),
        name: z.string().min(2).optional(),
        description: z.string().min(10).optional(),
        price: z.number().int().positive().optional(),
        oldPrice: z.number().int().positive().optional().nullable(),
        stock: z.number().int().min(0).optional(),
        category: z.enum(['NFC Cards', 'Review Plates']).optional(),
        features: z.array(z.string()).optional(),
        imageUrl: z.string().url().optional().nullable(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.string().min(1),
    }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
