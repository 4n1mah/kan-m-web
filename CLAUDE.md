Actúa como senior Next.js / TypeScript / Prisma / Vercel production reviewer.

Estoy trabajando en el proyecto Kan M Repostería y Catering.

Necesito que revises el estado actual del proyecto después de varios cambios hechos por Claude Code y Codex. Quiero saber si está listo para producción o qué falta corregir.

IMPORTANTE:
No hagas cambios todavía.
No edites archivos.
No instales paquetes.
No corras npm audit fix.
No toques Prisma schema.
No corras migraciones.
Primero analiza y dame un reporte.

---

# Contexto del proyecto

Stack:
- Next.js App Router
- TypeScript
- Prisma
- Neon PostgreSQL
- Cloudinary
- Vercel
- Admin panel con roles
- Catálogo público
- Cotizaciones desde “Cotizar”
- Órdenes online desde carrito

Roles:
- OWNER / Dueña
- BAKER / Repostera
- ASSISTANT / Asistente

---

# Funcionalidades implementadas recientemente

## 1. Carrito en catálogo público

Se agregó carrito de compras desde /catalogo.

Debe permitir:
- Agregar productos.
- Cambiar cantidades.
- Eliminar productos.
- Persistir en localStorage aunque se refresque o cierre la página.
- Expirar después de 48 horas.
- Mostrar subtotal.
- Crear orden online.
- Limpiarse solo después de una orden exitosa.

Importante:
- El backend debe recalcular precios desde DB.
- No se debe confiar en precios del frontend.
- Productos HIDDEN u OUT_OF_STOCK no deben poder comprarse.
- El carrito es solo para “Pasar a recoger”.
- No hay delivery para órdenes online.
- Debe mostrar datos bancarios y permitir subir comprobante.

Datos bancarios usados:
- BHD: 23842820013, cuenta de ahorro
- Banreservas: 9606681469, cuenta de ahorro
- Titular: Karolyn Sierra
- Cédula: 40227956733

## 2. Órdenes online en admin

Se agregó sección admin /admin/ordenes.

Debe mostrar órdenes del carrito con:
- Código PED-####
- Cliente
- Teléfono
- Items
- Total
- Comprobante
- Estado
- Fecha
- Acción de confirmar/negar
- Botón WhatsApp para reconfirmar

También se preparó integración futura con API externa usando:
- EXTERNAL_ORDERS_API_URL

Si la variable no existe, no debe romper.

## 3. Cotizaciones

En /cotizar:
- Se agregó mínimo 3 días de antelación desde hoy.
- Debe validarse en frontend y backend.
- Debe mostrar mensaje claro al cliente.
- Teléfono debe tener formato RD.

## 4. Teléfono RD

En carrito y cotizar:
- Formato esperado: 809-519-5688
- Prefijos válidos: 809, 829, 849
- Máximo 10 dígitos reales / 12 caracteres con guiones.
- Guiones automáticos.
- Validación frontend y backend.

## 5. Fotos en admin

En órdenes/cotizaciones del admin:
- OWNER y BAKER pueden agregar fotos de referencia.
- OWNER y BAKER pueden eliminar fotos.
- Subida usando Cloudinary.
- ASSISTANT no debe hacer acciones peligrosas.

## 6. Reportes

En admin reportes:
- Se agregaron métricas aparte para órdenes online.
- No deben mezclarse de forma confusa con cotizaciones.

## 7. Seguridad login

Se agregó o revisó:
- Max attempts en login.
- Bloqueo tras varios intentos fallidos.
- Dueña puede desbloquear usuario.
- Usuarios desactivados o bloqueados no deben seguir usando sesión vieja.
- /api/auth/me debe limpiar cookie o invalidar sesión si el usuario ya no es válido.

## 8. Productos fuera de stock / fuera del menú

En catálogo/admin:
- Productos pueden estar AVAILABLE, OUT_OF_STOCK, HIDDEN.
- Público solo debe ver productos disponibles.
- Admin debe poder ver y filtrar todos.
- OUT_OF_STOCK y HIDDEN no deben poder ordenarse.

---

# Cambios P0 ya aplicados por Codex

Codex aplicó una primera fase de seguridad/integridad.

Archivos cambiados:
- src/lib/cloudinary.ts
  - Nuevo helper para validar URLs Cloudinary.
- src/lib/auth.ts
  - Sesiones se invalidan si usuario está inactivo o bloqueado.
- src/app/api/auth/me/route.ts
  - Limpia cookie si la sesión ya no es válida.
- src/app/api/cart-orders/route.ts
  - Recalcula precios desde DB y valida disponibilidad.
- src/app/api/orders/route.ts
  - Valida URLs Cloudinary en cotizaciones.
- src/app/api/orders/[id]/route.ts
  - Bloquea ASSISTANT para edición.
  - DELETE queda OWNER-only.
  - Valida URLs Cloudinary.
  - Se corrigió error TypeScript donde existing podía ser null.
- src/app/api/products/route.ts
  - Crear productos solo OWNER/BAKER.
  - URLs restringidas.
- src/app/api/products/[id]/route.ts
  - Público no ve hidden/out-of-stock.
  - Mutaciones OWNER/BAKER.
- src/app/api/upload/route.ts
  - Upload de catálogo requiere OWNER/BAKER.
- src/app/api/admin/cart-orders/[id]/route.ts
  - ASSISTANT no puede confirmar/negar órdenes online.
- src/app/page.tsx
  - Home solo muestra productos AVAILABLE.

Qué corrigió:
- Backend ya no confía en precios del frontend para carrito.
- Valida existencia, disponibilidad y precio real del producto.
- Rechaza HIDDEN, OUT_OF_STOCK, productos inexistentes y cantidades abusivas.
- ASSISTANT bloqueado en mutaciones peligrosas.
- Sesiones viejas de usuarios inactivos/bloqueados quedan inválidas.
- URLs arbitrarias de imágenes/comprobantes restringidas a Cloudinary esperado.

No tocó:
- Prisma schema.
- Migraciones.
- Diseño.
- Paginación.
- Polling.
- Caching.
- Paquetes, excepto después para Next.js.
- Commit/push inicialmente.

---

# Build y verificaciones locales

Se creó script seguro:

"build:safe": "prisma generate && next build"

Esto evita correr prisma migrate deploy durante la prueba local.

Resultados actuales:

npm.cmd run build:safe: OK
npm.cmd run lint: OK con 1 warning
npx.cmd prisma validate: OK

Warning existente:

src/app/admin/dashboard/page.tsx
1114:5 Warning: React Hook useCallback has a missing dependency: 'addToast'.

Este warning no bloquea build.

---

# Next.js update

Se actualizó Next.js solo dentro de la rama 14.2.x.

Antes:
next@14.2.18

Ahora:
next@14.2.35

Archivos modificados:
- package.json
- package-lock.json

Confirmado:
npm.cmd ls next --depth=0 → next@14.2.35

Después de actualizar:
npm.cmd run build:safe: OK
npm.cmd run lint: OK con el mismo warning addToast
npx.cmd prisma validate: OK

No se migró a Next 15/16.

---

# npm audit

Se corrió npm.cmd audit.

Resultado:
- 5 vulnerabilities
- 1 moderate
- 4 high

No se ejecutó npm audit fix --force.

Motivo:
- El fix automático intentaría subir a next@16.2.4 y eslint-config-next@16.2.4.
- Eso sería un salto mayor y puede romper compatibilidad.
- Se decidió no hacerlo automáticamente.

Resumen audit:
- glob vía eslint-config-next: tooling/dev, no runtime.
- Vulnerabilidades Next: audit recomienda Next 16, pero el proyecto quedó en 14.2.35.
- PostCSS moderate: posible vía dependencia bundled.
- Recomendación previa: no forzar, tratar como fase separada si se decide migrar mayor.

---

# Logs de Vercel

Logs anteriores no mostraban 500.

Se vio patrón:
GET /api/orders → 401 cada minuto

Probable causa:
- Polling automático de /api/orders cada 60s sin sesión válida.
- La API está protegida porque responde 401.
- No parece crash.
- No se consideró prioridad inmediata por ahora, pero debe revisarse si hay tiempo.

Quiero que confirmes:
- Si /api/orders solo se llama desde admin.
- Si hay polling innecesario.
- Si un 401 detiene polling o no.
- Si esto genera costo/ruido en Vercel.

---

# Lo que necesito de ti ahora

Quiero una revisión final como senior dev.

NO hagas cambios todavía.

Revisa:

## A. Seguridad
1. APIs admin protegidas.
2. Roles OWNER/BAKER/ASSISTANT aplicados en backend.
3. Usuarios bloqueados/inactivos no pueden seguir usando sesiones.
4. Login max attempts correcto.
5. Logout limpia sesión.
6. No hay datos admin expuestos en rutas públicas.
7. Cloudinary upload seguro.
8. Validación de URLs Cloudinary correcta.
9. Teléfono validado backend.
10. Fecha mínima de cotización validada backend.

## B. Carrito y órdenes online
1. Backend recalcula precios desde DB.
2. Productos ocultos/out-of-stock no se pueden ordenar.
3. Cantidades tienen límites.
4. Total no puede manipularse desde frontend.
5. Comprobante obligatorio.
6. Orden llega correctamente al admin.
7. Confirmar/negar respeta permisos.
8. API externa no rompe si falta EXTERNAL_ORDERS_API_URL.

## C. Cotizaciones
1. Mínimo 3 días funciona en frontend y backend.
2. Upload de fotos funciona.
3. Admin puede agregar/eliminar fotos.
4. BAKER se autoasigna si corresponde.
5. OWNER puede asignar manualmente.

## D. Productos/catálogo
1. Público solo ve AVAILABLE.
2. Admin puede ver todos.
3. Filtros funcionan.
4. HIDDEN y OUT_OF_STOCK no se pueden comprar.
5. Home no muestra productos ocultos.

## E. Prisma/Neon
1. Revisar schema y migraciones.
2. Ver si hay riesgo de drift porque antes pudo haberse usado db push.
3. No tocar producción todavía.
4. Decirme cómo revisar safely el estado de migraciones.
5. Decirme si conviene staging/copia antes de tocar DB.
6. Ver si npm run build actual sigue corriendo prisma migrate deploy y si eso es seguro para Vercel.

## F. Vercel/producción
1. Variables de entorno necesarias.
2. Cookies/session config en producción.
3. Middleware.
4. Cache de páginas públicas.
5. Logs esperados vs sospechosos.
6. /api/orders 401 cada minuto.

## G. Performance
1. Polling.
2. Paginación en /api/orders.
3. Queries potencialmente caras.
4. Imágenes.
5. Bundle/client components.
6. Caching.

---

# Entrega el reporte así

## 1. Veredicto
- Listo para producción: Sí / No / Casi
- Nivel de riesgo: Bajo / Medio / Alto

## 2. Bloqueadores reales
Solo cosas que impiden publicar.

## 3. Debe corregirse antes de uso público
Cosas importantes pero no necesariamente fatales.

## 4. Puede esperar
Mejoras no urgentes.

## 5. Sobre Prisma/migraciones
Explica claramente qué revisar antes de tocar producción.

## 6. Sobre npm audit
Explica si conviene quedarse en Next 14.2.35 o migrar a Next 16 ahora.

## 7. Sobre /api/orders 401 cada minuto
Explica si requiere cambio y dónde revisar.

## 8. Checklist manual final
Dame pruebas exactas que debo hacer en producción.

## 9. Si recomiendas cambios
Lista el orden exacto de fases.

No apliques cambios sin que yo confirme.