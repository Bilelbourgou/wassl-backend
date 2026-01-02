import { z } from 'zod';

export const createContactSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        phone: z.string().optional(),
        message: z.string().min(10, 'Message must be at least 10 characters'),
    }),
});

export type CreateContactInput = z.infer<typeof createContactSchema>['body'];
