import { Router, Response } from 'express';
import { dashboardService } from '../../services/dashboard.service';
import { orderService } from '../../services/order.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Dashboard KPIs and analytics
 */

/**
 * @swagger
 * /api/admin/dashboard/kpis:
 *   get:
 *     summary: Get dashboard KPIs
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI data
 *       500:
 *         description: Server error
 */
// GET /api/admin/dashboard/kpis - Get KPIs
router.get('/kpis', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const kpis = await dashboardService.getKPIs();
        res.json(kpis);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
});

// GET /api/admin/dashboard/revenue - Daily revenue
router.get('/revenue', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { days = '7' } = req.query;
        const revenue = await dashboardService.getDailyRevenue(parseInt(days as string, 10));
        res.json(revenue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
});

// GET /api/admin/dashboard/recent-orders - Recent orders
router.get('/recent-orders', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { limit = '5' } = req.query;
        const orders = await orderService.getRecentOrders(parseInt(limit as string, 10));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

// GET /api/admin/dashboard/orders-by-status - Orders by status
router.get('/orders-by-status', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const data = await dashboardService.getOrdersByStatus();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders by status' });
    }
});

export default router;
