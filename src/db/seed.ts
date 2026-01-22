import { PrismaClient, CouponType, CouponStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create admin user
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const admin = await prisma.admin.upsert({
        where: { email: 'admin@wassl.tn' },
        update: {},
        create: {
            email: 'admin@wassl.tn',
            passwordHash,
            name: 'WASSL Admin',
        },
    });

    console.log('Created admin:', admin.email);

    // Create products
    const products = [
        {
            slug: 'nfc-card',
            name: 'WASSL Custom NFC Business Card',
            description: 'Smart NFC business card with custom design and digital profile',
            price: 50,
            oldPrice: 70,
            stock: 150,
            category: 'NFC Cards',
            features: [
                'Custom design with your branding',
                'NFC technology for instant sharing',
                'Digital profile management',
                'Real-time analytics',
                'Unlimited profile updates',
            ],
            isActive: true,
        },
        {
            slug: 'review-plate',
            name: 'Google Review Plate',
            description: 'NFC-enabled plate to collect Google reviews effortlessly',
            price: 70,
            oldPrice: 109,
            stock: 100,
            category: 'Review Plates',
            features: [
                'Easy Google review collection',
                'NFC & QR code enabled',
                'Durable and weather-resistant',
                'Custom branding available',
                'Boost your online reputation',
            ],
            isActive: true,
        },
    ];

    for (const product of products) {
        const created = await prisma.product.upsert({
            where: { slug: product.slug },
            update: product,
            create: product,
        });
        console.log('Created product:', created.name);
    }

    // Create sample coupons
    const coupons = [
        {
            code: 'WASSL10',
            type: CouponType.PERCENTAGE,
            value: 10,
            minOrderAmount: 20,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            status: CouponStatus.ACTIVE,
        },
        {
            code: 'WELCOME5',
            type: CouponType.FIXED,
            value: 5,
            minOrderAmount: 50,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: CouponStatus.ACTIVE,
        },
    ];

    for (const coupon of coupons) {
        const created = await prisma.coupon.upsert({
            where: { code: coupon.code },
            update: {},
            create: coupon,
        });
        console.log('Created coupon:', created.code);
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
