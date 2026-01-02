import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { validate } from '../../middleware/validate';
import { loginSchema } from '../../validators/auth.schema';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Auth
 *   description: Admin authentication
 */

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
// POST /api/admin/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find admin
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const session = await prisma.adminSession.create({
            data: {
                adminId: admin.id,
                token: sessionToken,
                expiresAt,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { adminId: admin.id, sessionId: session.id },
            env.jwtSecret,
            { expiresIn: 604800 } // 7 days in seconds
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Server error
 */
// POST /api/admin/auth/logout
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            await prisma.adminSession.deleteMany({
                where: { token },
            });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

/**
 * @swagger
 * /api/admin/auth/me:
 *   get:
 *     summary: Get current admin info
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin details
 *       401:
 *         description: Unauthorized
 */
// GET /api/admin/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    res.json({ admin: req.admin });
});

export default router;
