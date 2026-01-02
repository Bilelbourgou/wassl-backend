import { Router, Request, Response } from 'express';
import { orderService } from '../../services/order.service';
import { upload } from '../../middleware/upload';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order placement and management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (Checkout)
 *     tags: [Orders]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productSlug:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               address:
 *                 type: string
 *               couponCode:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or stock issue
 *       500:
 *         description: Server error
 */
// POST /api/orders - Create order (checkout)
router.post('/', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
        const { productSlug, customerName, customerEmail, customerPhone, address, couponCode, quantity } = req.body;

        // Process uploaded files
        const files = (req.files as Express.Multer.File[] || []).map(file => ({
            filename: file.originalname,
            storedName: file.filename,
            url: `/uploads/${file.filename}`,
            mimeType: file.mimetype,
            size: file.size,
        }));

        const order = await orderService.create({
            productSlug,
            customerName,
            customerEmail,
            customerPhone,
            address,
            couponCode,
            quantity: quantity ? parseInt(quantity, 10) : 1,
            files,
        });

        res.status(201).json({
            orderNumber: order.orderNumber,
            productName: order.productName,
            totalPrice: order.total,
            customerName: order.customerName,
        });
    } catch (error: any) {
        console.error('Order creation error:', error);
        res.status(400).json({ error: error.message || 'Failed to create order' });
    }
});

export default router;
