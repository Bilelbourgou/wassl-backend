import { Router, Response } from 'express';
import { productService } from '../../services/product.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from '../../validators/product.schema';
import { upload } from '../../middleware/upload';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Admin Products
 *   description: Product management for admins
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: List all products (including inactive)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all products
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new product
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
// GET /api/admin/products - List all products
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const products = await productService.getAll(true); // Include inactive
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/admin/products/:id - Get product details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await productService.getById(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/admin/products - Create product
router.post('/', validate(createProductSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const product = await productService.create(req.body);
        res.status(201).json(product);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Product with this slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT /api/admin/products/:id - Update product
router.put('/:id', validate(updateProductSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await productService.update(id, req.body);
        res.json(product);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Product with this slug already exists' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        await productService.delete(id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// PATCH /api/admin/products/:id/toggle - Toggle active status
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await productService.toggleActive(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle product status' });
    }
});

// POST /api/admin/products/:id/image - Upload product image
router.post('/:id/image', upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imageUrl = `/uploads/${file.filename}`;
        const product = await productService.update(id, { imageUrl });

        res.json(product);
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;
