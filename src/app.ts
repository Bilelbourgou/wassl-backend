import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';

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

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: [env.frontendUrl, 'http://localhost:8080'],
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

// Static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), env.uploadDir)));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
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
