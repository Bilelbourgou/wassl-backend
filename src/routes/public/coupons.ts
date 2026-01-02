import { Router, Request, Response } from 'express';
import { couponService } from '../../services/coupon.service';
import { validate } from '../../middleware/validate';
import { validateCouponSchema } from '../../validators/coupon.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon validation
 */

/**
 * @swagger
 * /api/coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Invalid coupon
 *       500:
 *         description: Server error
 */
// POST /api/coupons/validate - Validate coupon code
router.post('/validate', validate(validateCouponSchema), async (req: Request, res: Response) => {
    try {
        const { code, orderAmount } = req.body;
        const result = await couponService.validate(code, orderAmount);

        if (!result.valid) {
            return res.status(400).json({ valid: false, error: result.error });
        }

        res.json({
            valid: true,
            discount: result.discount,
            coupon: {
                code: result.coupon!.code,
                type: result.coupon!.type,
                value: result.coupon!.value,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

export default router;
