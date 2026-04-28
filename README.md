# Kan M — Repostería y Catering

Boutique bakery & catering site for **Kan M Repostería y Catering** (República Dominicana).

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite

## Features

- Public site: Inicio, Catálogo, Catering, Nosotros, Contacto
- Sticky blurred header, hero, product cards, testimonials, footer, floating WhatsApp FAB
- Brand color override: **#f17097**
- All CTAs prefill WhatsApp messages (number: **829-610-7064**)
- Admin panel at `/admin` (email + password from `.env`) with full product CRUD
- Catalog reads dynamically from SQLite — admin changes appear instantly
- JWT session via httpOnly cookie (`jose`); routes protected by Next.js middleware
- Zod validation on every API endpoint

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Edit .env — set ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET (>=32 chars)
# Generate a secret: openssl rand -base64 32

# 3. Create the SQLite database
npx prisma migrate dev --name init

# 4. Seed sample products (optional)
npm run db:seed

# 5. Run dev server
npm run dev
```

Visit **http://localhost:3000** for the site, **http://localhost:3000/admin** for the panel.

## Project structure

```
src/
  app/
    layout.tsx            # Root layout, fonts, navbar/footer/FAB
    page.tsx              # Home
    catalogo/page.tsx     # Catalog (reads /api/products)
    catering/page.tsx
    nosotros/page.tsx
    contacto/page.tsx     # WhatsApp-prefill contact form
    admin/
      page.tsx            # Redirects to login or dashboard
      login/page.tsx
      dashboard/page.tsx  # Product CRUD UI
    api/
      auth/login/route.ts
      auth/logout/route.ts
      products/route.ts        # GET (public), POST (admin)
      products/[id]/route.ts   # GET, PUT, DELETE
  components/
    Navbar.tsx
    Footer.tsx
    ProductCard.tsx
    WhatsAppFab.tsx
  lib/
    db.ts                 # Prisma client singleton
    auth.ts               # JWT session via jose + httpOnly cookie
    whatsapp.ts           # wa.me link helper + canned messages
  middleware.ts           # Protects /admin/dashboard + write APIs
prisma/
  schema.prisma           # Product model (SQLite)
  seed.ts                 # Sample products
```

## Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path (`file:./dev.db`) |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `AUTH_SECRET` | JWT signing secret (≥32 chars) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Business WhatsApp (E.164, no `+`) |

## Deployment

### Node hosts (recommended for SQLite)

Works out of the box on **Railway, Render, Fly.io, a VPS** — anywhere with a real persistent filesystem. Set the env vars, run `npm run build`, then `npm start`.

### Vercel / Netlify (serverless) — important caveat

Serverless platforms have **ephemeral filesystems**. The local `dev.db` file will not persist between deployments and may be wiped between cold starts. For these platforms, switch the Prisma datasource to a hosted database:

- **Turso** (libSQL, SQLite-compatible, free tier) — recommended for SQLite continuity
- **Neon / Supabase / PlanetScale** — Postgres / MySQL

Edit `prisma/schema.prisma` provider + `DATABASE_URL` accordingly, then `npx prisma migrate deploy`.

## Admin usage

1. Go to `/admin/login`
2. Sign in with the credentials from `.env`
3. Add / edit / delete products from the dashboard
4. Changes appear immediately on `/catalogo` (the catalog uses `force-dynamic` fetch + client revalidation on mount)

## Security notes

- Admin credentials are validated server-side; no localStorage or client-side checks
- Sessions: signed JWT (HS256) in httpOnly, sameSite=lax cookie, 7-day expiry
- All write endpoints validated with Zod and protected by middleware
- For production, replace plain-text password comparison with bcrypt by hashing `ADMIN_PASSWORD` once and storing the hash; `bcryptjs` is already a dependency

## License

Private project for Kan M Repostería y Catering.
