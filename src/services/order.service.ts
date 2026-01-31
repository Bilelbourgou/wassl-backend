import prisma from '../config/database';
import { OrderStatus } from '@prisma/client';
import { generateOrderNumber } from '../utils/orderNumber';
import { calculatePricing } from '../utils/pricing';
import { productService } from './product.service';
import { couponService } from './coupon.service';
import { notificationService } from './notification.service';
import { CustomerService } from './customer.service';
import { emailService } from './email.service';

interface CreateOrderData {
    items: {
        productSlug: string;
        quantity: number;
    }[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    couponCode?: string;
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
        const { items, customerName, customerEmail, customerPhone, address, couponCode, files = [] } = data;

        if (!items || items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        // 1. Fetch all products and validate
        const productDetails = await Promise.all(
            items.map(async (item) => {
                const product = await productService.getBySlug(item.productSlug);
                if (!product) throw new Error(`Product not found: ${item.productSlug}`);
                if (!product.isActive) throw new Error(`Product is not available: ${product.name}`);
                if (product.stock < item.quantity) throw new Error(`Not enough stock for: ${product.name}`);

                return {
                    ...product,
                    orderedQuantity: item.quantity
                };
            })
        );

        // 2. Validate coupon if provided
        let coupon = null;
        const totalSubtotalBeforeDiscount = productDetails.reduce(
            (sum, p) => sum + (p.price * p.orderedQuantity), 0
        );

        if (couponCode) {
            const validation = await couponService.validate(couponCode, totalSubtotalBeforeDiscount);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            coupon = validation.coupon;
        }

        // 3. Calculate pricing using updated pricing utility
        const pricing = calculatePricing({
            items: productDetails.map(p => ({
                unitPrice: p.price,
                quantity: p.orderedQuantity
            })),
            coupon: coupon ? { type: coupon.type, value: coupon.value } : null,
        });

        // 4. Generate order number
        const orderNumber = generateOrderNumber();

        // 5. Find or create customer
        const customer = await CustomerService.findOrCreateCustomer({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
        });

        // 6. Create order with items and files
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerName,
                customerEmail,
                customerPhone,
                address,
                subtotal: pricing.subtotal,
                deliveryFee: pricing.deliveryFee,
                discount: pricing.discount,
                total: pricing.total,
                couponId: coupon?.id,
                couponCode: coupon?.code,
                customerId: customer.id,
                status: OrderStatus.PENDING,
                items: {
                    create: productDetails.map(p => ({
                        productId: p.id,
                        productName: p.name,
                        productSlug: p.slug,
                        quantity: p.orderedQuantity,
                        unitPrice: p.price,
                    }))
                },
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
                items: true,
                files: true,
            },
        });

        // 7. Manage stock and notifications for each item
        for (const p of productDetails) {
            // Decrement stock
            await productService.decrementStock(p.id, p.orderedQuantity);

            // Check for low stock notification
            if (await productService.checkLowStock(p.id)) {
                // Fetch the updated product for current stock level
                const updatedProduct = await productService.getBySlug(p.slug);
                if (updatedProduct) {
                    await notificationService.createLowStockNotification(p.id, p.name, updatedProduct.stock);
                }
            }
        }

        // 8. Increment coupon usage
        if (coupon) {
            await couponService.incrementUsage(coupon.id);
        }

        // 9. Create notification
        await notificationService.createOrderNotification(order.id, order.orderNumber, order.total);

        // 10. Send order confirmation email (updated to pass multiple products)
        await emailService.sendOrderConfirmation({
            customerName,
            customerEmail,
            orderNumber: order.orderNumber,
            items: order.items.map(item => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.unitPrice * item.quantity
            })),
            subtotal: pricing.subtotal,
            deliveryFee: pricing.deliveryFee,
            discount: pricing.discount,
            total: pricing.total,
            address,
            couponCode: coupon?.code,
        });

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
                {
                    items: {
                        some: {
                            productName: { contains: search, mode: 'insensitive' }
                        }
                    }
                }
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: true,
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
                items: {
                    include: {
                        product: true
                    }
                },
                files: true,
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                },
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
                items: true,
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
