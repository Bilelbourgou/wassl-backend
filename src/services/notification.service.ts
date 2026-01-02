import prisma from '../config/database';
import { NotificationType } from '@prisma/client';

export class NotificationService {
    async getAll(unreadOnly = false) {
        return prisma.notification.findMany({
            where: unreadOnly ? { isRead: false } : {},
            orderBy: { createdAt: 'desc' },
        });
    }

    async markAsRead(id: string) {
        return prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead() {
        return prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
    }

    async getUnreadCount() {
        return prisma.notification.count({
            where: { isRead: false },
        });
    }

    async createOrderNotification(orderId: string, orderNumber: string, total: number) {
        return prisma.notification.create({
            data: {
                type: NotificationType.ORDER,
                title: 'New Order Received',
                message: `Order ${orderNumber} has been placed for ${total} DT`,
                metadata: { orderId, orderNumber, total },
            },
        });
    }

    async createLowStockNotification(productId: string, productName: string, currentStock: number) {
        return prisma.notification.create({
            data: {
                type: NotificationType.STOCK,
                title: 'Low Stock Alert',
                message: `${productName} is running low (${currentStock} remaining)`,
                metadata: { productId, productName, currentStock },
            },
        });
    }

    async createContactNotification(contactId: string, senderName: string) {
        return prisma.notification.create({
            data: {
                type: NotificationType.USER,
                title: 'New Contact Message',
                message: `New message from ${senderName}`,
                metadata: { contactId, senderName },
            },
        });
    }
}

export const notificationService = new NotificationService();
