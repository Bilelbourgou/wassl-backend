import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { NotificationJobData } from '../queues';

// Notification worker
const notificationWorker = new Worker<NotificationJobData>(
    'notification',
    async (job: Job<NotificationJobData>) => {
        console.log(`Processing notification job: ${job.id}`);

        const { type, data } = job.data;

        switch (type) {
            case 'new-order':
                console.log(`🔔 New Order Notification:`);
                console.log(`   Order: ${data.orderNumber}`);
                // In production, send push notification, SMS, etc.
                break;

            case 'low-stock':
                console.log(`⚠️ Low Stock Alert:`);
                console.log(`   Product: ${data.productName}`);
                console.log(`   Remaining: ${data.currentStock}`);
                break;

            case 'new-contact':
                console.log(`📩 New Contact Message:`);
                console.log(`   From: ${data.senderName}`);
                break;

            default:
                console.log(`Unknown notification type: ${type}`);
        }

        return { success: true, processedAt: new Date().toISOString() };
    },
    {
        connection: redis,
        concurrency: 5,
    }
);

notificationWorker.on('completed', (job) => {
    console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
    console.error(`❌ Notification job ${job?.id} failed:`, err.message);
});

export default notificationWorker;
