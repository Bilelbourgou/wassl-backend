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
        if (req.sessionId) {
            await prisma.adminSession.delete({
                where: { id: req.sessionId },
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

/**
 * @swagger
 * /api/admin/auth/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// PUT /api/admin/auth/profile
router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, email } = req.body;
        const adminId = req.admin?.id;

        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email is already taken by another admin
        const existingAdmin = await prisma.admin.findFirst({
            where: {
                email,
                NOT: { id: adminId }
            }
        });

        if (existingAdmin) {
            return res.status(400).json({ error: 'Email is already in use' });
        }

        // Update admin profile
        const updatedAdmin = await prisma.admin.update({
            where: { id: adminId },
            data: { name, email },
            select: { id: true, email: true, name: true }
        });

        res.json({ admin: updatedAdmin, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * @swagger
 * /api/admin/auth/password:
 *   put:
 *     summary: Update admin password
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid current password
 */
// PUT /api/admin/auth/password
router.put('/password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.admin?.id;

        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        // Validate new password length
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get admin with password hash
        const admin = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.admin.update({
            where: { id: adminId },
            data: { passwordHash: newPasswordHash }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

export default router;

