import prisma from '../config/database';
import { CreateCouponInput, UpdateCouponInput } from '../validators/coupon.schema';
import { CouponStatus } from '@prisma/client';

export class CouponService {
    async getAll() {
        return prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async getById(id: string) {
        return prisma.coupon.findUnique({
            where: { id },
        });
    }

    async getByCode(code: string) {
        return prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });
    }

    async create(data: CreateCouponInput) {
        return prisma.coupon.create({
            data: {
                ...data,
                code: data.code.toUpperCase(),
                status: CouponStatus.ACTIVE,
            },
        });
    }

    async update(id: string, data: UpdateCouponInput) {
        return prisma.coupon.update({
            where: { id },
            data: {
                ...data,
                code: data.code?.toUpperCase(),
            },
        });
    }

    async delete(id: string) {
        return prisma.coupon.delete({
            where: { id },
        });
    }

    async toggleStatus(id: string) {
        const coupon = await prisma.coupon.findUnique({ where: { id } });
        if (!coupon) return null;

        const newStatus = coupon.status === CouponStatus.ACTIVE
            ? CouponStatus.INACTIVE
            : CouponStatus.ACTIVE;

        return prisma.coupon.update({
            where: { id },
            data: { status: newStatus },
        });
    }

    async validate(code: string, orderAmount: number) {
        const coupon = await this.getByCode(code);

        if (!coupon) {
            return { valid: false, error: 'Coupon not found' };
        }

        if (coupon.status !== CouponStatus.ACTIVE) {
            return { valid: false, error: 'Coupon is not active' };
        }

        if (coupon.expiryDate < new Date()) {
            return { valid: false, error: 'Coupon has expired' };
        }

        if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
            return { valid: false, error: 'Coupon usage limit reached' };
        }

        if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
            return { valid: false, error: `Minimum order amount is ${coupon.minOrderAmount} DT` };
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'PERCENTAGE') {
            discount = Math.floor((orderAmount * coupon.value) / 100);
        } else {
            discount = coupon.value;
        }

        return {
            valid: true,
            coupon,
            discount,
        };
    }

    async incrementUsage(id: string) {
        return prisma.coupon.update({
            where: { id },
            data: {
                usageCount: { increment: 1 },
            },
        });
    }
}

export const couponService = new CouponService();
