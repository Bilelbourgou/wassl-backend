import prisma from '../config/database';
import { CreateProductInput, UpdateProductInput } from '../validators/product.schema';

export class ProductService {
    async getAll(includeInactive = false) {
        return prisma.product.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getBySlug(slug: string) {
        return prisma.product.findUnique({
            where: { slug },
        });
    }

    async getById(id: string) {
        return prisma.product.findUnique({
            where: { id },
        });
    }

    async create(data: CreateProductInput) {
        return prisma.product.create({
            data,
        });
    }

    async update(id: string, data: UpdateProductInput) {
        return prisma.product.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.product.delete({
            where: { id },
        });
    }

    async toggleActive(id: string) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return null;

        return prisma.product.update({
            where: { id },
            data: { isActive: !product.isActive },
        });
    }

    async decrementStock(id: string, quantity: number) {
        return prisma.product.update({
            where: { id },
            data: {
                stock: { decrement: quantity },
            },
        });
    }

    async checkLowStock(id: string): Promise<boolean> {
        const product = await prisma.product.findUnique({ where: { id } });
        return product ? product.stock < 10 : false;
    }
}

export const productService = new ProductService();
