# Kan M — Repostería y Catering

Sitio web público + panel de administración para Kan M Repostería y Catering. Incluye catálogo, formulario de cotización, calendario de pedidos y reportes.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS + variables CSS personalizadas
- **Base de datos**: Neon (Postgres serverless) + Prisma 5
- **Almacenamiento de imágenes**: Cloudinary
- **Auth**: JWT (jose) en cookie httpOnly + bcrypt para contraseñas
- **Hosting**: Vercel

## Setup en desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores reales (DB, Cloudinary, etc.)

# 3. Aplicar el schema a la base de datos
npx prisma db push

# 4. Crear el primer usuario OWNER
ADMIN_EMAIL=tu@correo.com ADMIN_NAME="Tu Nombre" ADMIN_PASSWORD=miclavefuerte \
  npx tsx scripts/seed-owner.ts

# 5. Levantar el dev server
npm run dev
```

Abre http://localhost:3000 para el sitio público y http://localhost:3000/admin/login para el panel.

## Estructura

```
src/
├── app/
│   ├── (public pages)        Inicio, catálogo, catering, cotizar, etc.
│   ├── admin/
│   │   ├── login/            Login (público)
│   │   ├── dashboard/        Panel principal: pedidos + catálogo
│   │   ├── calendario/       Vista mes/semana/día con timeline
│   │   ├── reportes/         Métricas y export CSV
│   │   └── usuarios/         (solo OWNER) gestión de usuarios y roles
│   └── api/
│       ├── auth/             Login, logout, /me
│       ├── orders/           CRUD de pedidos + upload público
│       ├── products/         CRUD de productos
│       ├── upload/           Upload protegido (admin)
│       ├── users/            (solo OWNER) gestión de usuarios
│       ├── bakers/           Lista de reposteras activas
│       └── activity/         Bitácora de cambios
├── components/               Componentes compartidos
├── lib/
│   ├── auth.ts               Sesiones JWT, bcrypt, autorización
│   ├── activityLog.ts        Helper para bitácora de cambios
│   ├── rateLimit.ts          Rate limiter en memoria
│   └── db.ts                 Singleton de Prisma
└── middleware.ts             Protege /admin/* y APIs sensibles
```

## Roles y permisos

| Rol         | Pedidos | Catálogo | Reportes | Usuarios |
|-------------|---------|----------|----------|----------|
| `OWNER`     | ✅ todo | ✅ todo  | ✅ todo  | ✅ todo  |
| `BAKER`     | ✅ todo | ✅ todo  | ✅ todo  | ❌       |
| `ASSISTANT` | ✅ ver  | ✅ ver   | ✅ ver   | ❌       |

> Hoy `ASSISTANT` tiene los mismos permisos de lectura que `BAKER` para pedidos. Puedes ajustarlo en `src/lib/auth.ts` (`canEditAnyOrder`, etc.) y en los handlers de API.

## Bitácora de cambios

Cada acción importante (cambio de estado, edición de pedido, creación/eliminación de producto, login, gestión de usuarios) se registra en la tabla `ActivityLog` con quién hizo el cambio y cuándo. Se puede consultar desde `/api/activity?entityType=order&entityId=...`.

## Variables de entorno

Ver [`.env.example`](./.env.example) para la lista completa.

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Postgres pooled (Neon) |
| `DATABASE_URL_UNPOOLED` | Postgres directo, para Prisma migrate |
| `AUTH_SECRET` | Secreto JWT, ≥32 chars |
| `CLOUDINARY_*` | Upload de imágenes |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número WhatsApp del negocio |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |

> Los antiguos `ADMIN_EMAIL` y `ADMIN_PASSWORD` ya **no se leen para login**. Solo se usan en el script `seed-owner.ts` para crear el primer usuario.

## Deploy a producción

1. Conectar el repo de GitHub a Vercel
2. Configurar **todas** las variables de entorno en Vercel → Settings → Environment Variables
3. En Neon, asegurarse de tener un branch de producción separado del de desarrollo
4. Ejecutar `npx prisma db push` apuntando al branch de producción
5. Correr `seed-owner.ts` una vez para crear el primer OWNER
6. Push a `main` → Vercel deploya automáticamente

## Mantenimiento operacional

- **Olvidé mi contraseña**: si eres OWNER, otro OWNER puede restablecértela desde `/admin/usuarios`. Si solo hay un OWNER y se olvidó la contraseña, debes resetearla manualmente en la DB con bcrypt.
- **Cambiar el número de WhatsApp**: editar `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel y redeployar.
- **Bitácora de cambios**: queda en la tabla `activity_log` indefinidamente. Si crece mucho, considera correr una limpieza anual.

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Sesiones JWT firmadas (HS256) en cookie httpOnly + sameSite=lax + secure en prod
- Rate limit en login (8/5min por IP), cotizaciones (10/10min), uploads (30/10min)
- Headers HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Validación zod en todos los endpoints públicos
- `next/image` restringido a Cloudinary y Unsplash
- Comparación timing-safe del password (vía bcrypt)

Para auditoría detallada, ver `AUDIT.md`.
