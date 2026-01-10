import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import prisma from '../../config/database';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Messages
 *   description: Contact messages management for admins
 */

/**
 * @swagger
 * /api/admin/messages:
 *   get:
 *     summary: List all contact messages
 *     tags: [Admin Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread messages
 *     responses:
 *       200:
 *         description: List of contact messages
 *       500:
 *         description: Server error
 */
// GET /api/admin/messages - List all contact messages
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { unreadOnly } = req.query;
        
        const where = unreadOnly === 'true' ? { isRead: false } : {};
        
        const messages = await prisma.contactMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.contactMessage.count({
            where: { isRead: false },
        });

        res.json({ messages, unreadCount });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * @swagger
 * /api/admin/messages/{id}:
 *   get:
 *     summary: Get message details
 *     tags: [Admin Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message details
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
// GET /api/admin/messages/:id - Get message details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        const message = await prisma.contactMessage.findUnique({
            where: { id },
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

/**
 * @swagger
 * /api/admin/messages/{id}/read:
 *   patch:
 *     summary: Mark message as read
 *     tags: [Admin Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
// PATCH /api/admin/messages/:id/read - Mark message as read
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        const message = await prisma.contactMessage.update({
            where: { id },
            data: { isRead: true },
        });

        res.json(message);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.status(500).json({ error: 'Failed to update message' });
    }
});

/**
 * @swagger
 * /api/admin/messages/{id}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Admin Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
// DELETE /api/admin/messages/:id - Delete message
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.contactMessage.delete({
            where: { id },
        });

        res.json({ message: 'Message deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default router;
