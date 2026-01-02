import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';
import { generateOrderNumber } from '../utils/orderNumber';
import { calculatePricing } from '../utils/pricing';
import { productService } from './product.service';
import { couponService } from './coupon.service';
import { notificationService } from './notification.service';

interface CreateOrderData {
    productSlug: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    couponCode?: string;
    quantity?: number;
    files?: {
        filename: string;
        storedName: string;
        url: string;
        mimeType: string;
        size: number;
    }[];
}

interface OrderFilters {
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
}

export class OrderService {
    async create(data: CreateOrderData) {
        const { productSlug, customerName, customerEmail, customerPhone, address, couponCode, quantity = 1, files = [] } = data;

        // Get product
        const product = await productService.getBySlug(productSlug);
        if (!product) {
            throw new Error('Product not found');
        }
        if (!product.isActive) {
            throw new Error('Product is not available');
        }
        if (product.stock < quantity) {
            throw new Error('Not enough stock');
        }

        // Validate coupon if provided
        let coupon = null;
        if (couponCode) {
            const validation = await couponService.validate(couponCode, product.price * quantity);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            coupon = validation.coupon;
        }

        // Calculate pricing
        const pricing = calculatePricing({
            unitPrice: product.price,
            quantity,
            coupon: coupon ? { type: coupon.type, value: coupon.value } : null,
        });

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order with files
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerName,
                customerEmail,
                customerPhone,
                address,
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                quantity,
                unitPrice: product.price,
                subtotal: pricing.subtotal,
                deliveryFee: pricing.deliveryFee,
                discount: pricing.discount,
                total: pricing.total,
                couponId: coupon?.id,
                couponCode: coupon?.code,
                status: OrderStatus.PENDING,
                files: {
                    create: files,
                },
                statusHistory: {
                    create: {
                        fromStatus: null,
                        toStatus: OrderStatus.PENDING,
                        note: 'Order placed',
                    },
                },
            },
            include: {
                files: true,
            },
        });

        // Decrement stock
        await productService.decrementStock(product.id, quantity);

        // Check for low stock notification
        if (await productService.checkLowStock(product.id)) {
            await notificationService.createLowStockNotification(product.id, product.name, product.stock - quantity);
        }

        // Increment coupon usage
        if (coupon) {
            await couponService.incrementUsage(coupon.id);
        }

        // Create notification
        await notificationService.createOrderNotification(order.id, order.orderNumber, order.total);

        return order;
    }

    async getAll(filters: OrderFilters = {}) {
        const { status, search, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    files: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: {
                files: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
                product: true,
                coupon: true,
            },
        });
    }

    async updateStatus(id: string, status: OrderStatus, adminId?: string, note?: string) {
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return null;

        const updated = await prisma.order.update({
            where: { id },
            data: {
                status,
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: status,
                        changedBy: adminId,
                        note,
                    },
                },
            },
            include: {
                files: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        return updated;
    }

    async getRecentOrders(limit = 5) {
        return prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                total: true,
                status: true,
                createdAt: true,
            },
        });
    }
}

export const orderService = new OrderService();
