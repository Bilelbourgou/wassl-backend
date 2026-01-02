import { Router, Response } from 'express';
import { couponService } from '../../services/coupon.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCouponSchema, updateCouponSchema } from '../../validators/coupon.schema';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Coupons
 *   description: Coupon management
 */

/**
 * @swagger
 * /api/admin/coupons:
 *   get:
 *     summary: List all coupons
 *     tags: [Admin Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new coupon
 *     tags: [Admin Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Coupon created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// GET /api/admin/coupons - List coupons
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const coupons = await couponService.getAll();
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// POST /api/admin/coupons - Create coupon
router.post('/', validate(createCouponSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const coupon = await couponService.create(req.body);
        res.status(201).json(coupon);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Coupon with this code already exists' });
        }
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// PUT /api/admin/coupons/:id - Update coupon
router.put('/:id', validate(updateCouponSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await couponService.update(id, req.body);
        res.json(coupon);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Coupon with this code already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        res.status(500).json({ error: 'Failed to update coupon' });
    }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        await couponService.delete(id);
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Coupon not found' });
        }
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// PATCH /api/admin/coupons/:id/toggle - Toggle status
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const coupon = await couponService.toggleStatus(id);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json(coupon);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle coupon status' });
    }
});

export default router;
