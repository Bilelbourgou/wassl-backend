import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }

    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Database operation failed',
        });
    }

    // Validation errors from Zod
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: (err as any).errors,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Invalid or expired token',
        });
    }

    // Multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            error: (err as any).message || 'File upload error',
        });
    }

    // Default to 500 server error
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
};
