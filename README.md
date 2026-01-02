# wassl-backend

WASSL e-commerce platform backend API.

## Tech Stack

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis + BullMQ
- JWT Authentication

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up database:
```bash
npm run db:push     # Push schema to database
npm run db:seed     # Seed admin user and sample coupons
```

4. Start development server:
```bash
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List active products |
| GET | `/api/products/:slug` | Get product by slug |
| POST | `/api/orders` | Create order (checkout) |
| POST | `/api/coupons/validate` | Validate coupon |
| POST | `/api/contact` | Submit contact form |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/auth/login` | Admin login |
| POST | `/api/admin/auth/logout` | Logout |
| GET | `/api/admin/auth/me` | Get current admin |
| GET | `/api/admin/orders` | List orders |
| GET | `/api/admin/orders/:id` | Get order |
| PATCH | `/api/admin/orders/:id/status` | Update status |
| GET/POST/PUT/DELETE | `/api/admin/products` | Products CRUD |
| GET | `/api/admin/customers` | List customers |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | Coupons CRUD |
| GET | `/api/admin/notifications` | List notifications |
| GET | `/api/admin/dashboard/kpis` | Dashboard KPIs |

## Default Admin

- Email: `admin@wassl.tn`
- Password: `Password123!`
