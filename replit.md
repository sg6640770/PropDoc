# PropDoc - Real Estate Document Generation & E-Signature System

## Overview

PropDoc is a full-stack web application for automated real estate document generation and e-signature workflows. The system allows users to create document templates, generate documents from those templates with property/buyer/seller metadata, approve documents, and send them for e-signing. The backend serves as a thin API layer over a PostgreSQL database, while heavy automation logic (document generation, signing) is delegated to external n8n webhooks. The app is branded "PropDoc" and targets real estate professionals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Uses `wouter` (lightweight alternative to React Router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, custom fonts (Inter for body, Outfit for headings)
- **Forms**: react-hook-form with zod resolvers for validation
- **Charts**: Recharts for dashboard analytics
- **Auth**: JWT-based authentication stored in localStorage (token + user object). The `useAuth` hook in `client/src/hooks/use-auth.tsx` manages auth state via React Query and localStorage.

### Frontend Pages
- `/auth` - Login/Register page (unprotected)
- `/` - Dashboard with stats cards and charts
- `/documents` - Document list with create dialog
- `/documents/:id` - Document details with audit log and approve/sign actions
- `/templates` - Template management (list + create)
- `/transactions` - Transaction history table

### Backend (Express + Node.js)
- **Framework**: Express.js with TypeScript, run via `tsx`
- **Architecture**: Thin API layer — no heavy business logic. The backend handles CRUD operations and proxies automation to n8n.
- **Database**: PostgreSQL via Drizzle ORM (`drizzle-orm` + `node-postgres`)
- **Auth**: JWT tokens (jsonwebtoken) with bcryptjs for password hashing. JWT_SECRET from env vars.
- **Storage Pattern**: `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation using Drizzle ORM
- **API Contract**: Shared route definitions in `shared/routes.ts` with Zod schemas for input validation and response typing. Both frontend and backend import from this shared contract.

### Database Schema (PostgreSQL + Drizzle)
Defined in `shared/schema.ts`:
- **users** - id, email (unique), password (hashed), name, createdAt
- **templates** - id, name, documentType, content (HTML/rich text), createdAt, updatedAt
- **documents** - id, templateId (FK→templates), status (enum: pending/approved/signed/declined), metadata (JSONB - buyer, seller, property details), n8nId, createdAt, updatedAt
- **transactions** - id, documentId (FK→documents), status (enum: success/failed/pending), timestamp
- **audit_logs** - id, documentId (FK→documents), action (text), plus additional fields

Custom enums: `document_status` and `transaction_status` defined as pgEnum.

Schema migrations managed via `drizzle-kit push` (direct push, no migration files needed for dev).

### Shared Code (`shared/` directory)
- `shared/schema.ts` - Drizzle table definitions, Zod insert schemas (via drizzle-zod), TypeScript types
- `shared/routes.ts` - Full API contract with paths, methods, Zod input/output schemas. Used by both frontend hooks and backend route handlers.

### Build System
- Dev: `tsx server/index.ts` runs the Express server which sets up Vite dev middleware for HMR
- Production build: Custom `script/build.ts` that runs Vite build for client and esbuild for server, outputting to `dist/`
- Client builds to `dist/public/`, server builds to `dist/index.cjs`
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### n8n Integration
The backend proxies certain operations to n8n webhook endpoints. Base URL configured via `N8N_BASE_URL` env var (default: `https://n8n.fortivautomation.cloud/webhook-test/prop-flow`).

Webhook endpoints:
- `POST /create-template` - Create template in n8n
- `POST /document-generate` - Generate document via n8n
- `POST /approves-signing` - Approve and send for e-signature
- `GET /get-sign-status` - Check signing status

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection via `DATABASE_URL` environment variable. Used with Drizzle ORM.
- **n8n Automation Platform**: External webhook service for document generation and e-signature workflows. Configured via `N8N_BASE_URL` env var.

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for JWT token signing (defaults to a placeholder — must be changed for production)
- `N8N_BASE_URL` - Base URL for n8n webhooks (has default)

### Major NPM Dependencies
- **Backend**: express, drizzle-orm, pg, bcryptjs, jsonwebtoken, zod, drizzle-zod, connect-pg-simple, express-session
- **Frontend**: react, wouter, @tanstack/react-query, recharts, react-hook-form, @hookform/resolvers, date-fns, framer-motion
- **UI**: Full shadcn/ui component set (Radix UI primitives), tailwindcss, class-variance-authority, clsx, tailwind-merge, lucide-react
- **Build**: vite, @vitejs/plugin-react, esbuild, tsx, drizzle-kit