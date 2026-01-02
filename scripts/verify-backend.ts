import { env } from '../src/config/env';

const BASE_URL = `http://localhost:${env.port}/api`;
const ADMIN_EMAIL = 'admin@wassl.tn';
const ADMIN_PASSWORD = 'Password123!';

async function runVerification() {
    console.log('🚀 Starting Backend Verification...');

    try {
        // 1. Login as Admin
        console.log('\n1. Logging in as Admin...');
        const loginRes = await fetch(`${BASE_URL}/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData: any = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // 2. Create a Product (if not exists, but let's assume one exists or create one)
        // We'll create one to be sure
        console.log('\n2. Creating Test Product...');
        const productRes = await fetch(`${BASE_URL}/admin/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Test Product',
                slug: `test-product-${Date.now()}`,
                description: 'A test product',
                price: 100,
                stock: 10,
                category: 'NFC Cards',
                features: ['Feature 1'],
            }),
        });

        if (!productRes.ok) throw new Error(`Create Product failed: ${productRes.statusText}`);
        const product: any = await productRes.json();
        console.log('✅ Product created:', product.slug);

        // 3. Create an Order (Public)
        console.log('\n3. Creating Public Order...');
        const orderData = {
            productSlug: product.slug,
            customerName: 'Test Customer',
            customerEmail: `customer-${Date.now()}@test.com`,
            customerPhone: '12345678',
            address: 'Test Address',
            quantity: 1,
        };

        const orderRes = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (!orderRes.ok) {
            const err = await orderRes.json();
            throw new Error(`Create Order failed: ${JSON.stringify(err)}`);
        }
        const order: any = await orderRes.json();
        console.log('✅ Order created:', order.orderNumber);

        // 4. Verify Customer Creation (Admin)
        console.log('\n4. Verifying Customer Creation...');
        // Wait a bit for async processing if any (though here it's synchronous)
        const customerRes = await fetch(`${BASE_URL}/admin/customers/${orderData.customerEmail}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!customerRes.ok) throw new Error(`Get Customer failed: ${customerRes.statusText}`);
        const customer: any = await customerRes.json();

        if (customer.email === orderData.customerEmail && customer.orderCount >= 1) {
            console.log('✅ Customer verified:', customer.email);
        } else {
            throw new Error('Customer data mismatch');
        }

        // 5. Check Dashboard KPIs
        console.log('\n5. Checking Dashboard KPIs...');
        const kpiRes = await fetch(`${BASE_URL}/admin/dashboard/kpis`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!kpiRes.ok) throw new Error(`Get KPIs failed: ${kpiRes.statusText}`);
        const kpis = await kpiRes.json();
        console.log('✅ KPIs fetched:', kpis);

        // 6. Check Notifications
        console.log('\n6. Checking Notifications...');
        const notifRes = await fetch(`${BASE_URL}/admin/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!notifRes.ok) throw new Error(`Get Notifications failed: ${notifRes.statusText}`);
        const notifs: any = await notifRes.json();
        console.log(`✅ Notifications fetched (${notifs.notifications.length} total)`);

        console.log('\n🎉 All verifications passed!');

    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

runVerification();
