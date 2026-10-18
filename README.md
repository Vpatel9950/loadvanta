# Loadvanta — Logistics Marketplace & Return-Load Matching Engine

> **Brand Tagline:** *Every Mile Counts. Every Load Matters.*

Loadvanta is a scalable, responsive, production-oriented B2B logistics marketplace tailored for **Punjab and North India** with a national expansion architecture. It bridges industrial shippers (textile mills, grain traders, engineering works, steel foundries) directly with verified commercial truck owners and fleet operators.

Its flagship differentiator is an **intelligent return-load matching engine** that minimizes deadhead empty kilometers on return routes (e.g., Ludhiana ⇄ Delhi, Jalandhar ⇄ Amritsar, Khanna ⇄ Delhi, Mandi Gobindgarh ⇄ Ludhiana).

---

## 🏗️ Architecture & Technology Stack

Loadvanta is built as a **Modular Monolith** with clean boundaries between HTTP routing, business logic, persistence, and external adapters:

```text
loadvanta/
├── client/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/layout/  # Navbar, Footer, ProtectedRoute
│   │   ├── pages/              # Home, Find Trucks, Find Loads, How It Works, About, Contact, Terms, Privacy
│   │   │   └── dashboard/      # ShipperDashboard, TransporterDashboard, AdminDashboard
│   │   ├── lib/                # Axios API client, AuthProvider, Theme Provider
│   │   └── App.tsx             # Route declarations
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/             # Database connection, Environment configuration
│   │   ├── infrastructure/
│   │   │   ├── database/       # Mongoose Models (User, Vehicle, Shipment, Quotation, Booking, Payment, AuditLog)
│   │   │   │   └── seed.ts     # Reproducible database seed script
│   │   │   ├── maps/           # Punjab & North India highway distance & detour matrix
│   │   │   ├── payments/       # Razorpay adapter (HMAC-SHA256 signature verification & webhooks)
│   │   │   └── storage/        # File upload and MIME validation middleware
│   │   ├── middleware/         # Auth JWT, Role authorization, Request validation, Error handler, Rate limiters
│   │   ├── modules/            # Auth, Shipments, Vehicles, Quotations, Bookings, Matching, Payments, Admin, Contact
│   │   ├── docs/               # OpenAPI / Swagger specification
│   │   ├── app.ts              # Express configuration
│   │   └── server.ts           # Server bootstrap & graceful shutdown
│   └── package.json
│
├── packages/contracts/         # Shared TypeScript interfaces, enums, and Zod schemas
├── .env.example                # Environment variable template with placeholders
├── package.json                # Root workspace configuration
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20.x recommended)
- **MongoDB**: Local MongoDB instance (running on `mongodb://127.0.0.1:27017`) or MongoDB Atlas URI

### 1. Installation
Install all dependencies across the workspaces from the repository root:
```bash
npm install
```

### 2. Build Shared Contracts
```bash
npm run build --workspace=packages/contracts
```

### 3. Seed Database with Realistic Punjab Logistics Data
Populates test users (Shipper, Transporter, Admin), verified trucks across Ludhiana/Jalandhar/Amritsar, published shipments, and active bookings:
```bash
npm run seed --workspace=server
```

### 4. Run Development Servers
Start both backend API (`http://localhost:5000`) and frontend Vite client (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **OpenAPI / Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Pre-Configured Test Accounts (From Seed)

All accounts share the development password: `Password@123`

| Role | Email | Password | Primary Hub | Company Name |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@loadvanta.com` | `Password@123` | Mohali | Loadvanta Technologies Punjab |
| **Shipper** | `shipper@loadvanta.com` | `Password@123` | Ludhiana | Vardhman Textiles & Yarn Ltd |
| **Shipper** | `harjit@punjabgrains.com` | `Password@123` | Khanna | Grewal Grain Traders (Khanna Mandi) |
| **Transporter** | `transporter@loadvanta.com` | `Password@123` | Ludhiana | Dhillon Malwa Roadways |
| **Transporter** | `jaspal@majhafreight.com` | `Password@123` | Amritsar | Majha Express Movers |
| **Transporter** | `baldev@doaba.com` | `Password@123` | Jalandhar | Doaba Logistics Fleet |

*(Note: The login page features convenient 1-click login buttons for instant role testing!)*

---

## 🧠 Return-Load Matching Engine

Located in `server/src/modules/matching/matching.service.ts`:
Recommends shipments to fleet operators returning to their home base using a **100-point multi-factor weighted formula**:

1. **Route Compatibility (35%)**: Calculates distance between current truck location and shipment pickup, plus evaluates whether delivery lands near the fleet home base.
2. **Pickup Timing (25%)**: Aligns availability date within the pickup window (higher score for schedule alignment within 24-48 hours).
3. **Payload / Capacity Fit (20%)**: Ensures optimal truck capacity utilization (70% - 100%) while rejecting overloading violations.
4. **Detour Efficiency (10%)**: Computes deadhead kilometers using the Punjab highway matrix (`Ludhiana ⇄ Jalandhar`, `Khanna ⇄ Delhi`, etc.).
5. **Price Suitability (10%)**: Compares proposed freight with corridor rate benchmarks.

Every recommendation delivers a **composite match percentage** and **human-readable explanations** detailing why the load was recommended.

---

## 💳 Payment Gateway (Razorpay Integration)

- Located in `server/src/infrastructure/payments/razorpayAdapter.ts` and `server/src/modules/payments/`.
- Stored as integer minor units (`amountPaise`) with currency `INR`.
- **Cryptographic Signature Verification**: Validates `HMAC-SHA256(order_id + "|" + payment_id, secret)` before transitioning any booking to `CAPTURED`.
- **Idempotent Webhooks**: Validates webhook signatures using the raw HTTP request body before updating records.
- **Honest Gateway Status**: If live Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are not provided in environment variables, the system reports its unconfigured status and executes verified test cryptographic simulation without fabricating a live financial transaction.

---

## 🧪 Automated Test Suite

Run unit, integration, and E2E lifecycle tests with Vitest:
```bash
npm run test --workspace=server
```

### Test Coverage Highlights:
- **Unit Tests (`matching.test.ts`)**: Route compatibility, capacity limits, Punjab highway network calculations.
- **Integration Tests (`auth.test.ts`)**: Login, registration, role authorization, protected routes.
- **E2E Tests (`lifecycle.e2e.test.ts`)**: Complete journey:
  1. Transporter adds vehicle
  2. Shipper publishes shipment
  3. Return-load matching engine scores load
  4. Transporter quotes
  5. Shipper accepts quote & confirms booking
  6. Double-booking conflict check (locks vehicle)
  7. Transporter broadcasts transit milestones
  8. Shipper completes verified payment

---

## 🔒 Production Security Checklist

- [x] Passwords hashed using bcrypt with salt rounds
- [x] JWT tokens with strict expiry and HTTP-only cookie support
- [x] Server-side role authorization & resource ownership validation
- [x] Concurrency protection preventing vehicle double-booking
- [x] Rate limiting on authentication (`/api/v1/auth`) and general API routes
- [x] Helmet security headers and strict CORS configuration
- [x] Mongoose schema validation & sanitized error reporting (no stack traces leaked)
- [x] Centralized audit logging for critical state changes

---

## 📋 Production Deployment Instructions

- **Frontend Deployment (Vercel / Cloudflare Pages / Netlify):**
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set `VITE_API_URL` to your production backend URL.
- **Backend Deployment (Render / Railway / AWS ECS / VPS):**
  - Root directory: `server`
  - Build command: `npm run build`
  - Start command: `node dist/server.js`
  - Configure production environment variables in `.env` (MongoDB Atlas URI, JWT secrets, Razorpay live keys).
