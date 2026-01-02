import { Router, Response } from 'express';
import prisma from '../../config/database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Customers
 *   description: Customer data derived from orders
 */

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: List unique customers
 *     tags: [Admin Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of customers
 *       500:
 *         description: Server error
 */
// GET /api/admin/customers - List unique customers from orders
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Get unique customers with order counts
        const customers = await prisma.order.groupBy({
            by: ['customerEmail', 'customerName', 'customerPhone'],
            _count: { id: true },
            _sum: { total: true },
            orderBy: { _count: { id: 'desc' } },
            skip,
            take: limitNum,
        });

        const total = await prisma.order.groupBy({
            by: ['customerEmail'],
        });

        res.json({
            customers: customers.map((c: { customerEmail: string; customerName: string; customerPhone: string; _count: { id: number }; _sum: { total: number | null } }) => ({
                email: c.customerEmail,
                name: c.customerName,
                phone: c.customerPhone,
                orderCount: c._count.id,
                totalSpent: c._sum.total || 0,
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: total.length,
                totalPages: Math.ceil(total.length / limitNum),
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET /api/admin/customers/:email - Get customer order history
router.get('/:email', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email } = req.params;

        const orders = await prisma.order.findMany({
            where: { customerEmail: email },
            orderBy: { createdAt: 'desc' },
            include: {
                files: true,
            },
        });

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = {
            email: orders[0].customerEmail,
            name: orders[0].customerName,
            phone: orders[0].customerPhone,
            address: orders[0].address,
            orderCount: orders.length,
            totalSpent: orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0),
            orders,
        };

        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

export default router;
