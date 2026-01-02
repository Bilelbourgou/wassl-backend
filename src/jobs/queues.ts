import { Queue } from 'bullmq';
import redis from '../config/redis';

// Email queue
export const emailQueue = new Queue('email', {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

// Notification queue
export const notificationQueue = new Queue('notification', {
    connection: redis,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});

// Queue job type definitions
export interface EmailJobData {
    type: 'order-confirmation';
    to: string;
    subject: string;
    orderNumber: string;
    customerName: string;
    productName: string;
    total: number;
}

export interface NotificationJobData {
    type: 'new-order' | 'low-stock' | 'new-contact';
    data: Record<string, any>;
}

// Add jobs to queues
export async function queueOrderConfirmationEmail(data: Omit<EmailJobData, 'type'>) {
    await emailQueue.add('order-confirmation', {
        type: 'order-confirmation',
        ...data,
    });
}

export async function queueNewOrderNotification(orderId: string, orderNumber: string) {
    await notificationQueue.add('new-order', {
        type: 'new-order',
        data: { orderId, orderNumber },
    });
}
