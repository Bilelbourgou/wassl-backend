import { Router, Response } from 'express';
import { orderService } from '../../services/order.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import prisma from '../../config/database';

// Get OrderStatus enum values from Prisma
const OrderStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
} as const;

type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Orders
 *   description: Order management for admins
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List orders
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number, name, or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of orders with pagination
 *       500:
 *         description: Server error
 */
// GET /api/admin/orders - List orders
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status, search, page, limit } = req.query;

        const result = await orderService.getAll({
            status: status as OrderStatusType | undefined,
            search: search as string | undefined,
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/orders/:id - Get order details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const order = await orderService.getById(id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!Object.values(OrderStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await orderService.updateStatus(id, status, req.admin?.id, note);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

export default router;
