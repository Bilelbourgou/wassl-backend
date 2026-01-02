import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { EmailJobData } from '../queues';

// Email worker - In production, this would send actual emails
const emailWorker = new Worker<EmailJobData>(
    'email',
    async (job: Job<EmailJobData>) => {
        console.log(`Processing email job: ${job.id}`);

        const { type, to, subject, orderNumber, customerName, productName, total } = job.data;

        switch (type) {
            case 'order-confirmation':
                // In production, integrate with email service (SendGrid, AWS SES, etc.)
                console.log(`📧 Sending order confirmation email:`);
                console.log(`   To: ${to}`);
                console.log(`   Subject: ${subject}`);
                console.log(`   Order: ${orderNumber}`);
                console.log(`   Customer: ${customerName}`);
                console.log(`   Product: ${productName}`);
                console.log(`   Total: ${total} DT`);
                break;

            default:
                console.log(`Unknown email type: ${type}`);
        }

        return { success: true, sentAt: new Date().toISOString() };
    },
    {
        connection: redis,
        concurrency: 5,
    }
);

emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

export default emailWorker;
