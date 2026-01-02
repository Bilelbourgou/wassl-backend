import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { validate } from '../../middleware/validate';
import { createContactSchema } from '../../validators/contact.schema';
import { notificationService } from '../../services/notification.service';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submission
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// POST /api/contact - Submit contact form
router.post('/', validate(createContactSchema), async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message } = req.body;

        const contact = await prisma.contactMessage.create({
            data: {
                name,
                email,
                phone,
                message,
            },
        });

        // Create notification for admin
        await notificationService.createContactNotification(contact.id, name);

        res.status(201).json({
            message: 'Contact form submitted successfully',
            id: contact.id,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit contact form' });
    }
});

export default router;
