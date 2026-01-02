import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';

interface DashboardKPIs {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    totalProducts: number;
}

interface DailyRevenue {
    date: string;
    revenue: number;
    orders: number;
}

export class DashboardService {
    async getKPIs(): Promise<DashboardKPIs> {
        const [
            revenueResult,
            totalOrders,
            pendingOrders,
            customersResult,
            totalProducts,
        ] = await Promise.all([
            prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    status: { not: OrderStatus.CANCELLED },
                },
            }),
            prisma.order.count(),
            prisma.order.count({ where: { status: OrderStatus.PENDING } }),
            prisma.customer.count(),
            prisma.product.count({ where: { isActive: true } }),
        ]);

        return {
            totalRevenue: revenueResult._sum.total || 0,
            totalOrders,
            pendingOrders,
            totalCustomers: customersResult,
            totalProducts,
        };
    }

    async getDailyRevenue(days = 7): Promise<DailyRevenue[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { not: OrderStatus.CANCELLED },
            },
            select: {
                total: true,
                createdAt: true,
            },
        });

        // Group by date
        const dailyData = new Map<string, { revenue: number; orders: number }>();

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyData.set(dateStr, { revenue: 0, orders: 0 });
        }

        for (const order of orders) {
            const dateStr = order.createdAt.toISOString().split('T')[0];
            const existing = dailyData.get(dateStr);
            if (existing) {
                existing.revenue += order.total;
                existing.orders += 1;
            }
        }

        return Array.from(dailyData.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getOrdersByStatus() {
        const statuses = Object.values(OrderStatus);
        const counts = await Promise.all(
            statuses.map(async (status) => ({
                status,
                count: await prisma.order.count({ where: { status } }),
            }))
        );
        return counts;
    }
}

export const dashboardService = new DashboardService();
