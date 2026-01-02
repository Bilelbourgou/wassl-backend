import { Router, Response } from 'express';
import { notificationService } from '../../services/notification.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Notifications
 *   description: Admin notifications
 */

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: List notifications
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 *       500:
 *         description: Server error
 */
// GET /api/admin/notifications - List notifications
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { unreadOnly } = req.query;
        const notifications = await notificationService.getAll(unreadOnly === 'true');
        const unreadCount = await notificationService.getUnreadCount();

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PATCH /api/admin/notifications/:id/read - Mark as read
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PATCH /api/admin/notifications/read-all - Mark all read
router.patch('/read-all', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await notificationService.markAllAsRead();
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

export default router;
