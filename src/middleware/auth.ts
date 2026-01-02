import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/database';

export interface AuthenticatedRequest extends Request {
    admin?: {
        id: string;
        email: string;
        name: string;
    };
    sessionId?: string;
}

export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT
        const decoded = jwt.verify(token, env.jwtSecret) as { adminId: string; sessionId: string };

        // Check if session exists and is valid
        const session = await prisma.adminSession.findUnique({
            where: { id: decoded.sessionId },
            include: { admin: true },
        });

        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Session expired' });
        }

        // We don't compare session.token with JWT because they are different (UUID vs JWT)
        // The session validity is ensured by the existence of the session record and JWT signature

        req.admin = {
            id: session.admin.id,
            email: session.admin.email,
            name: session.admin.name,
        };
        req.sessionId = session.id;

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
