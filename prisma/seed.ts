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
