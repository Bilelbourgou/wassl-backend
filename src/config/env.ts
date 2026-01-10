import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const env = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    databaseUrl: process.env.DATABASE_URL || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),

    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Email configuration
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'WASSL <noreply@wassl.tn>',

    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};
