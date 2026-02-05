import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import prisma from './config/database';
import redisClient from './config/redis';
// Public routes
import publicProductsRouter from './routes/public/products';
import publicOrdersRouter from './routes/public/orders';
import publicCouponsRouter from './routes/public/coupons';
import publicContactRouter from './routes/public/contact';

// Admin routes
import adminAuthRouter from './routes/admin/auth';
import adminOrdersRouter from './routes/admin/orders';
import adminProductsRouter from './routes/admin/products';
import adminCustomersRouter from './routes/admin/customers';
import adminCouponsRouter from './routes/admin/coupons';
import adminNotificationsRouter from './routes/admin/notifications';
import adminDashboardRouter from './routes/admin/dashboard';
import adminMessagesRouter from './routes/admin/messages';
import { emailService } from './services/email.service';

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration
app.use(cors({
    origin: [env.frontendUrl, 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
    credentials: true,
}));

// Logging
if (env.isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads) with CORS headers
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(process.cwd(), env.uploadDir)));

// Health check
app.get('/health', async (req, res) => {
    try {
        // Check Postgres
        await prisma.$queryRaw`SELECT 1`;

        // Check Redis
        await redisClient.ping();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public API routes
app.use('/api/products', publicProductsRouter);
app.use('/api/orders', publicOrdersRouter);
app.use('/api/coupons', publicCouponsRouter);
app.use('/api/contact', publicContactRouter);

// Admin API routes
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/customers', adminCustomersRouter);
app.use('/api/admin/coupons', adminCouponsRouter);
app.use('/api/admin/notifications', adminNotificationsRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/messages', adminMessagesRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Verify email connection
        await emailService.verifyConnection();

        app.listen(env.port, () => {
            console.log(`🚀 Server running on http://localhost:${env.port}`);
            console.log(`📊 Environment: ${env.nodeEnv}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
