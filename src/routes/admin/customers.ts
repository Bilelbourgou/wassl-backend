import { Router, Response } from 'express';
import prisma from '../../config/database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { CustomerService } from '../../services/customer.service';

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
// GET /api/admin/customers - List unique customers
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { page = '1', limit = '10', search } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);

        const result = await CustomerService.getAllCustomers({
            page: pageNum,
            limit: limitNum,
            search: search as string,
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET /api/admin/customers/:email - Get customer order history
router.get('/:email', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { email } = req.params;

        const customer = await CustomerService.getCustomerByEmail(email);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const formattedCustomer = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            orderCount: customer.orders.length,
            totalSpent: customer.orders.reduce((sum: number, o: { total: number }) => sum + o.total, 0),
            orders: customer.orders,
            createdAt: customer.createdAt,
        };

        res.json(formattedCustomer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

export default router;
