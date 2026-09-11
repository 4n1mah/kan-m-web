# Guía de configuración y despliegue

Esta guía cubre todo lo necesario para correr el proyecto en local y desplegarlo en producción (Vercel + Neon + Cloudinary), además de los servicios opcionales y las tareas de mantenimiento.

> Para una visión general del proyecto, ver el [README](./README.md).

## Contenido

1. [Requisitos](#1-requisitos)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Base de datos (Neon + Prisma)](#3-base-de-datos-neon--prisma)
4. [Primer usuario y acceso al panel](#4-primer-usuario-y-acceso-al-panel)
5. [Cloudinary](#5-cloudinary)
6. [Servicios opcionales](#6-servicios-opcionales)
7. [Deploy en Vercel](#7-deploy-en-vercel)
8. [Mantenimiento](#8-mantenimiento)
9. [Solución de problemas](#9-solución-de-problemas)

---

## 1. Requisitos

- **Node.js** 18.17 o superior (requisito de Next.js 14)
- **npm**
- Cuenta en **[Neon](https://neon.tech/)** o cualquier Postgres accesible
- Cuenta en **[Cloudinary](https://cloudinary.com/)**
- Cuenta en **[Vercel](https://vercel.com/)** (para producción)

## 2. Variables de entorno

Copia la plantilla y complétala:

```bash
cp .env.example .env.local
```

`.env.example` explica cada variable en detalle. Resumen:

### Obligatorias

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión **pooled** de Neon (queries normales). |
| `DATABASE_URL_UNPOOLED` | Cadena **directa** (sin pooler). La usa Prisma para `db push` y migraciones. |
| `AUTH_SECRET` | Secreto para firmar los JWT. **Mínimo 32 caracteres.** Si lo cambias, todos los usuarios quedan desconectados. |
| `ADMIN_LOGIN_SLUG` | Slug secreto de la URL de login (`/acceso/<slug>`). Mínimo 8 caracteres; se recomiendan más de 20. |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la cuenta de Cloudinary. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary (solo servidor). |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio, sin `/` final. Se usa en SEO, sitemap y enlaces canónicos. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp del negocio (botón flotante y enlaces). |

### Opcionales

| Variable | Si falta… |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | El rate limit funciona en memoria, por instancia. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | El servidor no envía notificaciones push. |
| `NEXT_PUBLIC_FIREBASE_*` (6 variables) | El panel no ofrece activar las notificaciones. |
| `EXTERNAL_ORDERS_API_URL` | Las órdenes del carrito no se sincronizan con el sistema externo. |

### Generar secretos

```bash
# AUTH_SECRET
openssl rand -base64 32

# ADMIN_LOGIN_SLUG
openssl rand -hex 12
```

Sin `openssl` (por ejemplo, en Windows):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> ⚠️ Nunca subas `.env` ni `.env.local` al repositorio. Ya están en `.gitignore`.

## 3. Base de datos (Neon + Prisma)

### Crear las tablas

El esquema se sincroniza con **`prisma db push`**, que crea o actualiza las tablas a partir de `prisma/schema.prisma`:

```bash
npx prisma db push
```

> **Nota sobre migraciones:** la carpeta `prisma/migrations/` contiene solo la migración inicial histórica (tabla `products`) y **no refleja el esquema actual**. Por eso el build de producción no ejecuta `prisma migrate deploy`. Usa `db push` para aplicar cambios de esquema.
>
> `prisma/baseline.sql` contiene el DDL completo del esquema. Sirve de referencia o para hacer un *baseline* manual si en el futuro se adopta `prisma migrate`.

### Tablas compartidas con el bot de WhatsApp

El bot externo (Python/FastAPI) usa la **misma base de datos**. Las tablas `wa_conversations`, `wa_processed_messages` y `wa_test_diag` pertenecen al bot. Están declaradas en el schema **solo** para que `prisma db push` no las borre. No las modifiques desde este proyecto.

### SQL de apoyo (`scripts/`)

| Archivo | Uso |
|---|---|
| `scripts/site-settings-migration.sql` | Crea `site_settings`. **Opcional**: la app crea esta tabla sola en runtime (`src/lib/settings.ts`). |

### Datos de ejemplo (solo desarrollo)

```bash
npm run db:seed
```

> ⚠️ Este comando **borra todos los productos** existentes antes de insertar los de ejemplo. No lo ejecutes contra producción.

### Recomendación para Neon

Usa **branches separados** en Neon: uno para desarrollo y otro para producción. Así los cambios de esquema de desarrollo no llegan a los datos reales.

## 4. Primer usuario y acceso al panel

### Crear el OWNER

Ejecútalo **una sola vez**, después de `db push`:

```bash
ADMIN_EMAIL=tu@correo.com ADMIN_NAME="Tu Nombre" ADMIN_PASSWORD=unaClaveFuerte \
  npx tsx scripts/seed-owner.ts
```

En PowerShell:

```powershell
$env:ADMIN_EMAIL="tu@correo.com"; $env:ADMIN_NAME="Tu Nombre"; $env:ADMIN_PASSWORD="unaClaveFuerte"
npx tsx scripts/seed-owner.ts
```

- La contraseña debe tener al menos 8 caracteres.
- Si el correo ya existe, el script no cambia nada.
- `ADMIN_EMAIL`, `ADMIN_NAME` y `ADMIN_PASSWORD` se usan **solo** en este script. No se leen durante el login.

Los demás usuarios se crean desde el panel, en **Configuración → Usuarios**.

### Entrar al panel

El login **no** está en `/admin/login` (esa ruta da 404). Se entra por la URL secreta:

```
https://tu-sitio.com/acceso/<ADMIN_LOGIN_SLUG>
```

Guarda este enlace como marcador en los dispositivos del equipo. Si cambias `ADMIN_LOGIN_SLUG`, el enlace anterior deja de funcionar.

## 5. Cloudinary

Las imágenes (productos, fotos de referencia de cotizaciones y comprobantes de pago) se suben **desde el servidor con firma**, usando `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. **No hace falta crear un upload preset.**

1. Entra a Cloudinary → **Dashboard**.
2. Copia **Cloud name**, **API Key** y **API Secret** en las variables `CLOUDINARY_*`.

Las imágenes se guardan en la carpeta `kanm`. Por seguridad, la app solo acepta URLs de `res.cloudinary.com` que pertenezcan a tu `CLOUDINARY_CLOUD_NAME`.

## 6. Servicios opcionales

### Upstash Redis (rate limiting distribuido)

Sin Upstash, el rate limit vive en la memoria de cada instancia serverless, así que solo protege a medias. Para producción:

1. Crea una base **Redis** en [upstash.com](https://upstash.com/) (el plan gratuito alcanza).
2. Copia `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

Si Upstash falla por un problema de red, las requests pasan igual (*fail-open*) y el error queda en el log.

### Firebase Cloud Messaging (notificaciones push)

Avisa a OWNER y BAKER cuando entra un pedido nuevo o una orden del carrito.

**Servidor** (enviar notificaciones):

1. Firebase Console → **Project settings → Service accounts → Generate new private key**.
2. Pega el **contenido completo** del JSON en `FIREBASE_SERVICE_ACCOUNT_JSON`.

**Cliente** (recibirlas en el navegador):

1. **Project settings → General → Your apps**: crea una *Web app* si no existe y copia `apiKey`, `authDomain`, `projectId`, `messagingSenderId` y `appId` en las variables `NEXT_PUBLIC_FIREBASE_*`.
2. **Project settings → Cloud Messaging → Web Push certificates → Generate key pair**: copia la clave en `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

Cada usuario activa las notificaciones desde el panel. El service worker (`public/firebase-messaging-sw.js`) recibe la configuración pública por query string al registrarse.

### Bot de WhatsApp

El bot vive en otro repositorio y comparte la base de datos. Consume estos endpoints públicos de solo lectura (sin auth y con caché de 5 min):

- `GET /api/public/business-info`: horario, dirección, enlaces, reglas y si el local está abierto ahora.
- `GET /api/public/faq`: todas las FAQ, o filtradas con `?q=texto` (sin distinguir tildes).

> La información del negocio (horario, dirección, precios, FAQ) se edita en **un solo lugar**: `src/lib/bizInfo.ts`. Si cambia el precio de La Latica, actualiza también el `knowledge_base.txt` del bot.

### API externa de órdenes

Si defines `EXTERNAL_ORDERS_API_URL`, cada orden del carrito confirmada se envía por `POST` a esa URL (timeout de 5 s). El resultado queda en el campo `externalSyncStatus` de la orden (`NOT_SENT`, `SENT` o `FAILED`).

## 7. Deploy en Vercel

1. En Vercel: **Add New → Project** y selecciona el repositorio.
2. Framework: **Next.js** (se detecta automáticamente). El build command sale de `vercel.json` (`npm run vercel-build` = `prisma generate && next build`), así que no lo modifiques.
3. En **Settings → Environment Variables**, agrega todas las variables de la [sección 2](#2-variables-de-entorno) para los entornos **Production** y **Preview**.
4. Clic en **Deploy**.
5. Con las variables apuntando al branch de producción de Neon, ejecuta **una vez** desde tu máquina:
   ```bash
   npx prisma db push
   npx tsx scripts/seed-owner.ts   # con ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD
   ```
6. Configura el dominio propio en **Settings → Domains** y actualiza `NEXT_PUBLIC_SITE_URL`.

A partir de ahí, **cada push a `main` despliega automáticamente**. Los pushes a otras ramas generan un *Preview Deployment*.

### Cambios de esquema en producción

Vercel **no** aplica cambios de esquema durante el build. Cuando modifiques `prisma/schema.prisma`:

1. Prueba el cambio contra el branch de desarrollo de Neon.
2. Ejecuta `npx prisma db push` contra producción **antes** de hacer merge del código que depende del cambio.

## 8. Mantenimiento

| Situación | Qué hacer |
|---|---|
| **Un usuario olvidó su contraseña** | Un OWNER se la restablece desde **Usuarios** en el panel. |
| **El único OWNER olvidó su contraseña** | Genera un hash nuevo (`node -e "console.log(require('bcryptjs').hashSync('nuevaClave', 12))"`) y actualiza `password_hash` de ese usuario directamente en la tabla `users` desde la consola de Neon. |
| **Cuenta bloqueada** | Se desbloquea sola 15 minutos después de 5 intentos fallidos. |
| **Cambiar el número de WhatsApp** | Edita `NEXT_PUBLIC_WHATSAPP_NUMBER` en Vercel y vuelve a desplegar (es una variable pública y se incrusta en el build). |
| **Cambiar horario, dirección o FAQ** | Edita `src/lib/bizInfo.ts`. La web y el bot lo toman automáticamente. |
| **Feriados u horarios especiales** | Agrega la fecha en `HOLIDAY_OVERRIDES` dentro de `src/lib/bizInfo.ts`. |
| **Apagar temporalmente el catálogo o las cotizaciones** | Panel → **Configuración** (solo OWNER). No requiere deploy. |
| **Filtración del enlace de login** | Cambia `ADMIN_LOGIN_SLUG` en Vercel y vuelve a desplegar. |
| **Cerrar todas las sesiones** | Rota `AUTH_SECRET` y vuelve a desplegar. |
| **La bitácora creció demasiado** | `activity_log` guarda todo indefinidamente. Si hace falta, elimina periódicamente los registros viejos. |

## 9. Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `AUTH_SECRET must be set (≥32 chars)` | `AUTH_SECRET` falta o es demasiado corto. |
| `/acceso/...` responde 404 | El slug no coincide con `ADMIN_LOGIN_SLUG`, la variable no está definida o tiene menos de 8 caracteres. |
| `/admin` redirige al inicio | No hay sesión activa. Entra por `/acceso/<slug>`. |
| "Configuración de servidor incompleta" al subir imágenes | Falta alguna variable `CLOUDINARY_*`. |
| Las imágenes subidas no se guardan | La URL no pertenece a `CLOUDINARY_CLOUD_NAME` (la validación rechaza cualquier otra cuenta). |
| Prisma no conecta durante `db push` | Revisa `DATABASE_URL_UNPOOLED`: debe ser la cadena **directa**, no la pooled. |
| No aparece la opción de activar notificaciones | Falta alguna variable `NEXT_PUBLIC_FIREBASE_*`. |
