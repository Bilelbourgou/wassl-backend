import { Router, Request, Response } from 'express';
import { productService } from '../../services/product.service';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Public product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all active products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of active products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   name:
 *                     type: string
 *                   price:
 *                     type: number
 *                   stock:
 *                     type: number
 *                   imageUrl:
 *                     type: string
 *       500:
 *         description: Server error
 */
// GET /api/products - List all active products
router.get('/', async (req: Request, res: Response) => {
    try {
        const products = await productService.getAll(false);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * @swagger
 * /api/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
// GET /api/products/:slug - Get product by slug
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const product = await productService.getBySlug(slug);

        if (!product || !product.isActive) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

export default router;
