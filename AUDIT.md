# Auditoría de seguridad y producción

Estado al cierre de la última sesión de trabajo.

## ✅ Hallazgos resueltos

### 🚨 Críticos

1. **`.env` filtrado en el repo** — el `.gitignore` antiguo ignoraba `.env.example` (al revés) pero no `.env`. Estaba subiendo contraseñas en plaintext, credenciales de Neon y un AUTH_SECRET literalmente igual al placeholder.
   - **Acción manual requerida**: rotar las credenciales (Neon password, AUTH_SECRET, ADMIN_PASSWORD) y `git rm --cached .env`. Si el repo es público en GitHub, considerar `git filter-repo` para borrar del historial.
   - **Resuelto en código**: `.gitignore` corregido, `.env.example` saneado.

2. **Middleware solo protegía `/admin/dashboard`** — `/admin/calendario` y `/admin/reportes` estaban abiertos al mundo, exponiendo nombres, teléfonos, emails y direcciones de los clientes.
   - **Resuelto**: middleware ahora protege todo `/admin/*` excepto `/admin/login`. `/admin/usuarios` solo OWNER.

3. **Comparación de password con `===`** vulnerable a timing attacks.
   - **Resuelto**: ahora usa `bcrypt.compare` (timing-safe) contra el hash en DB, con un dummy hash para evitar enumeración de emails válidos.

4. **Sin rate limit en endpoints públicos** — login, /api/orders, /api/orders/upload eran abusables por bots y brute force.
   - **Resuelto**: rate limit en memoria. Login 8/5min, pedidos 10/10min, uploads 30/10min.

### ⚠️ Importantes

5. **POST /api/orders sin validación robusta**: aceptaba payloads arbitrariamente grandes, tipos incorrectos, fechas malformadas.
   - **Resuelto**: validación zod completa, límites de tamaño, regex de fecha, sanity check de fecha del evento.

6. **PATCH /api/orders/[id] con `Number(NaN)`**: NaN escribiéndose en columnas Float de Prisma.
   - **Resuelto**: validación explícita de finiteness y signo positivo.

7. **`paymentStatus` y `deliveryMethod` sin validación**: aceptaba cualquier string.
   - **Resuelto**: enum check explícito.

8. **DELETE/PATCH de pedidos inexistentes lanzaba 500**.
   - **Resuelto**: try/catch con respuesta 404 amigable.

9. **`next/image` con `hostname: "**"`**: cualquier dominio HTTPS podía ser cargado vía `<Image>`.
   - **Resuelto**: solo `res.cloudinary.com` y `images.unsplash.com`.

10. **Headers de seguridad ausentes**.
    - **Resuelto**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, `poweredByHeader: false`.

## ⚠️ Pendientes / deuda técnica

### 🟡 No bloqueantes para producción

1. **Rate limit en memoria, no distribuido** — en Vercel cada función serverless tiene su propia memoria. Un atacante puede repartir requests entre instancias y sortear el límite. Mitigación: cuando crezca el tráfico, migrar a [Upstash Ratelimit](https://upstash.com/) (tiene tier gratis).

2. **Cloudinary signature usa SHA-256** mientras Cloudinary usa SHA-1 por defecto. **Verificar** en tu cuenta Cloudinary que esté configurada para SHA-256, o cambiar a SHA-1 en `src/app/api/orders/upload/route.ts` (línea ~44).

3. **Lista hardcoded de bakers** — `BAKERS = ["Karolyn Sierra","Astrid Sierra"]` en dashboard y calendario. Cuando contraten más empleados, hay que editarlo manualmente. Existe `/api/bakers` para migrarlo a dinámico, pero requiere refactor con Context. **TODO documentado en el código.**

4. **Dashboard de 1200 líneas en un solo archivo** — `OrderModal`, `OrderCard`, `OrderEditModal`, `BakerPopup`, `ProductModal`, hooks varios. Mover a `src/app/admin/dashboard/_components/*` cuando tengas tiempo.

5. **`next/headers` cookies usado en `auth.ts` puede dar warnings en algunas rutas** — Next 14 a veces se queja de `cookies()` fuera de request context. No bloquea pero genera ruido en logs.

6. **No hay tests** — ni siquiera de los helpers puros (`daysUntil`, `priorityScore`, `matchesSearch`). 30 minutos en Vitest cubrirían lo crítico.

7. **El `useEffect` de auto-refresh en dashboard NO se pausa cuando la pestaña está oculta** — el calendario sí lo hace, el dashboard no. Si una repostera deja el dashboard abierto 8h, son ~480 requests inútiles.

8. **`Notification.permission` se llama sin pedir permiso primero**. La rama nunca corre porque el navegador devuelve "default". Falta un botón "Activar notificaciones" o `Notification.requestPermission()` la primera vez.

9. **GET /api/orders no pagina** — cuando llegues a 500+ pedidos, traer todos cada 60s será lento. Añadir `?from=&to=&limit=`.

10. **Cookie de sesión sin rotation** — si la cookie se compromete, dura 7 días. En cuentas con datos sensibles se hace rotation cada hora. Para tu caso (panel cerrado, 2-3 usuarias) es exagerado.

## Capacidad estimada en planes gratis

### Vercel (Hobby plan)
- **100 GB de bandwidth/mes** — para una página con catálogo de imágenes optimizadas, asume 1-2 MB por visita. Eso te da ~50,000-100,000 visitas/mes. Más que suficiente para un negocio local.
- **100 GB-hours de serverless functions** — cada request a un endpoint API es de ~50-200ms. Cien mil requests/mes = ~5 GB-hours. Cómodo.
- **Build minutes**: 6,000/mes. Suficiente para hacer 200 deploys.
- **Veredicto**: te aguanta tranquilamente para los próximos 1-2 años de operación normal.

### Neon (Free plan)
- **0.5 GB de storage** — un pedido pesa ~3-5 KB con todos los campos. Un producto ~1-2 KB. ActivityLog ~0.5 KB por entrada. Asume 1000 pedidos/año + 10,000 entradas de log = ~10 MB. Te queda muchísimo espacio.
- **191 horas de compute/mes** — Neon serverless escala a cero cuando no hay tráfico. Para un panel admin usado pocas horas al día, fácilmente cabes.
- **1 proyecto, 10 branches**: suficiente.
- **Veredicto**: capacidad de sobra. Si llegan a tener 100+ pedidos/día sostenidos, ahí toca upgrade ($19/mes).

### Cloudinary (Free plan)
- **25 GB de bandwidth/mes**
- **25 GB de storage**
- **Las fotos del cotizar y del catálogo van aquí.** Una foto promedio sin optimizar es 2-3 MB; Cloudinary la sirve transformada y comprimida (~100-300 KB).
- Si cada cotización trae 3 fotos, son 6 MB de upload. Storage llenas a los ~4000 cotizaciones.
- Bandwidth: si 100 visitas/día ven 5 fotos cada una, son 150 MB/día = 4.5 GB/mes. Cómodo.
- **Veredicto**: te aguanta los primeros 1-2 años. Vigilar el dashboard de Cloudinary mensualmente.

### Resumen de capacidad

| Servicio | Capacidad estimada | Cuándo migrar |
|----------|-------------------|---------------|
| Vercel | 50K-100K visitas/mes | >100K visitas/mes (~$20/mes) |
| Neon | ~50K pedidos en DB | >100 pedidos/día sostenidos ($19/mes) |
| Cloudinary | ~4000 cotizaciones acumuladas | Aviso al 80% del storage |

**Para una repostería local en RD que recién arranca, los 3 planes gratis son MÁS QUE suficientes.** No te apures por upgradearte.

## Checklist antes del primer deploy a producción

- [ ] Rotar `DATABASE_URL` de Neon (cambiar password)
- [ ] Generar `AUTH_SECRET` nuevo: `openssl rand -base64 32`
- [ ] Configurar todas las env vars en Vercel (no en `.env`)
- [ ] `git rm --cached .env` y commit
- [ ] Confirmar que Cloudinary signature está en SHA-256 (o cambiar a SHA-1)
- [ ] Correr `npx prisma db push` apuntando al branch de producción
- [ ] Correr `seed-owner.ts` para crear el primer OWNER
- [ ] Probar login en producción
- [ ] Probar el flujo de cotización completo (subir foto, llenar form, ver llegar al admin)
- [ ] Probar cambio de estado y aparición en calendario
- [ ] Verificar que `/admin/calendario` y `/admin/reportes` redirijan a login si no estás autenticada

## Para la auditoría técnica completa

Si en algún momento quieres una auditoría más a fondo (tests automatizados, pen testing, observabilidad con Sentry, monitoring de uptime), buscar:
- **Sentry**: tracking de errores en producción (free tier generoso)
- **Better Stack** o **UptimeRobot**: monitoreo de uptime
- **Snyk** o **GitHub Dependabot**: vulnerabilidades en dependencias

Por ahora no son necesarios. Cuando crezca, sí.
