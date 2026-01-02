import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const CustomerService = {
    async getAllCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
        const { page = 1, limit = 10, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { orders: true },
                    },
                    orders: {
                        select: {
                            total: true,
                        },
                    },
                },
            }),
            prisma.customer.count({ where }),
        ]);

        return {
            customers: customers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                ordersCount: customer._count.orders,
                totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
                createdAt: customer.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async getCustomerByEmail(email: string) {
        return prisma.customer.findUnique({
            where: { email },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        files: true,
                    },
                },
            },
        });
    },

    async findOrCreateCustomer(data: { name: string; email: string; phone: string }) {
        let customer = await prisma.customer.findUnique({
            where: { email: data.email },
        });

        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                },
            });
        } else {
            // Update phone/name if changed? For now let's keep original or update?
            // Let's update phone if provided and different, but usually email is the key.
            if (data.phone && customer.phone !== data.phone) {
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: { phone: data.phone, name: data.name } // Also update name
                });
            }
        }

        return customer;
    },
};
