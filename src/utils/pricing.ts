import { CouponType } from '@prisma/client';

interface PricingInput {
    unitPrice: number;
    quantity: number;
    coupon?: {
        type: CouponType;
        value: number;
    } | null;
}

interface PricingResult {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
}

const DELIVERY_FEE = 6;

/**
 * Calculate order pricing
 */
export function calculatePricing(input: PricingInput): PricingResult {
    const { unitPrice, quantity, coupon } = input;

    const subtotal = unitPrice * quantity;
    const deliveryFee = DELIVERY_FEE;

    let discount = 0;

    if (coupon) {
        if (coupon.type === 'PERCENTAGE') {
            discount = Math.floor((subtotal * coupon.value) / 100);
        } else if (coupon.type === 'FIXED') {
            discount = coupon.value;
        }
        // Discount cannot exceed subtotal
        discount = Math.min(discount, subtotal);
    }

    const total = subtotal + deliveryFee - discount;

    return {
        subtotal,
        deliveryFee,
        discount,
        total,
    };
}
