# OpenCase Backend

Backend for an OpenCase-style website (case battle / mycsgo-like) with per-user profit chance and admin panel.

## Tech Stack
- Node.js + TypeScript
- Express 5
- Prisma ORM + SQLite (dev)
- JWT auth

## Quick Start
1. Install deps
```bash
npm install
```
2. Configure environment
```bash
cp .env.example .env
# edit .env as needed
```
3. Migrate DB and seed
```bash
npm run migrate
npm run seed
```
4. Start dev server
```bash
npm run dev
```
Server runs at http://localhost:3000

## Scripts
- `npm run dev`: run dev server (tsx)
- `npm run build`: compile TypeScript
- `npm start`: run compiled server
- `npm run migrate`: Prisma migrate dev
- `npm run seed`: seed database
- `npm run prisma:studio`: open Prisma Studio

## Auth
- POST `/api/auth/register` { email, username, password }
- POST `/api/auth/login` { emailOrUsername, password } → { token }
- GET `/api/auth/me` (Bearer token)

## Cases & Items
- GET `/api/cases` list active cases with contents
- GET `/api/cases/:slug`
- Admin CRUD:
  - Items: `/api/items` POST/PUT/DELETE
  - Cases: `/api/cases` POST/PUT/DELETE
  - Case contents: POST `/api/cases/:id/contents`, DELETE `/api/cases/contents/:contentId`

## Open Case
- POST `/api/open/:caseId` (Bearer token)
  - Applies global and per-user profit chance bias and house edge

## Admin Panel
- HTML: `/admin` (requires admin JWT)
- API:
  - GET/PUT `/api/admin/config` { globalProfitChanceBp, houseEdgeBp }
  - GET `/api/admin/users`
  - POST `/api/admin/users/:id/balance` { amountCents }
  - POST `/api/admin/users/:id/profit-basis` { profitChanceBasis }

## Environment (.env)
See `.env.example`.
