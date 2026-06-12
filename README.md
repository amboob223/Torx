# Torx 🔧

Uber for mobile car services. Request a mechanic, gasser, or car washer — on demand.

## Roles
- **Torkee** — requests car services
- **Torka** — provides car services (mechanic, gasser, washer)

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **AI**: Hermes (car diagnostic intake)
- **Payments**: Stripe + Stripe Connect (payouts to Torka)
- **Deploy**: Render

## Setup

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE torx;"
psql -U postgres -d torx -f server/db/schema.sql
psql -U postgres -d torx -f server/db/seed.sql  # optional test users
```

### 2. Server
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### 3. Client
```bash
cd client
cp .env.example .env   # fill in VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

## Test accounts (after running seed.sql)
- Torka:  `torka@test.com` / `password123`
- Torkee: `torkee@test.com` / `password123`

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register (torka or torkee) |
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Current user |
| GET  | /api/jobs | Get jobs (role-filtered) |
| POST | /api/jobs | Create job request |
| PATCH | /api/jobs/:id/status | Update job status |
| POST | /api/ai/diagnose | AI car diagnosis |
| POST | /api/payments/intent | Create Stripe payment |
| POST | /api/payments/connect | Stripe Connect onboarding |

## Deploy to Render
1. Push to GitHub
2. In Render: New → Blueprint → connect your repo
3. `render.yaml` handles server + PostgreSQL automatically
4. Set secret env vars in Render dashboard (Stripe keys, Hermes keys, JWT_SECRET)
