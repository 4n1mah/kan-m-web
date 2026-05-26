Actúa como senior Next.js / TypeScript / Prisma engineer trabajando en el proyecto
Kan M Repostería y Catering (Next.js 14 App Router, Prisma, Neon Postgres, Vercel).

OBJETIVO (Fase 0): crear la FUENTE ÚNICA DE VERDAD del negocio y exponerla por
endpoints públicos de solo lectura, para que un bot de WhatsApp externo (proyecto
Python/FastAPI aparte) la consuma sin contradecir a la web. NO construir el bot aquí.

REGLAS:
- No toques el schema de Prisma todavía salvo donde se indica explícitamente abajo.
- No cambies la apariencia visual de ninguna página.
- No instales paquetes nuevos.
- TypeScript estricto, mismo estilo del proyecto.

────────────────────────────────────────────────────────────
PASO 1 — Crear src/lib/bizInfo.ts (fuente única de verdad)
────────────────────────────────────────────────────────────
Exporta constantes tipadas con:

- RD_UTC_OFFSET_HOURS = -4 (RD sin horario de verano).
- SCHEDULE: Record<number, {open:number; close:number}> con día 0=domingo..6=sábado.
  Horario REAL: Lun–Jue 9–19, Vie–Dom 9–22 (domingo=9-22, sáb=9-22, vie=9-22,
  lun a jue=9-19).
- SCHEDULE_TEXT = "Lunes a jueves de 9:00 AM a 7:00 PM. Viernes a domingo de
  9:00 AM a 10:00 PM."
- HOLIDAY_OVERRIDES: objeto vacío {} por ahora (dejar comentario de cómo extender).
- BUSINESS: { name, greeting:"¡Hola, bienvenido a Kan M Repostería y Catering!",
  address:"C. Espaillat 58, Zona Colonial, Santo Domingo",
  mapsUrl:"https://maps.app.goo.gl/D1i89Ui3vx92FubCA",
  phoneDisplay:"+1 (829) 610-7064", phoneTel:"+18296107064",
  email:"kanmreposteriaycatering@gmail.com",
  instagram, tiktok } (toma instagram/tiktok de src/app/contacto/page.tsx).
- LINKS: home, catalogo, catalogoCategoria(cat), cotizar, catering, faq, contacto,
  maps, uberEats, pedidosYa. SITE_URL desde
  process.env.NEXT_PUBLIC_SITE_URL || "https://kan-m-reposteria.vercel.app",
  sin slash final. Los links uberEats/pedidosYa cópialos EXACTOS desde
  src/components/DeliveryButtons.tsx.
- CATALOG_CATEGORIES: mismas 6 que src/app/catalogo/CatalogClient.tsx
  (cakes/Pasteles, desserts/Postres, events/Mesa de dulces,
  picaderas/Picaderas para eventos, brunch/Brunch, drinks/Bebidas).
- RULES: { minLeadDays:3, bigEventLeadText:"1 a 2 semanas para eventos grandes
  (bodas, cumpleaños temáticos)", deliveryMinAmountRD:250, eventDepositPercent:50,
  botMayShareBankInfo:false }.
  (minLeadDays DEBE coincidir con la regla de 3 días ya validada en
  src/app/api/orders/route.ts — no cambies orders, solo deja un comentario
  indicando que este es el valor canónico).
- FAQS: array de { id, q, a, tags:string[] } con estas 13 preguntas, redactadas
  amables y en tuteo, usando los valores de arriba (no hardcodear, interpolar):
  1) horario  2) ubicación  3) delivery (3 opciones: pickup gratis / entrega
  propia mínimo RD$250 según distancia / Uber Eats + PedidosYa)
  4) cómo ordenar  5) pasteles personalizados (→ link cotizar)
  6) anticipación (3 días / eventos grandes 1-2 semanas)
  7) cotizar evento (web preferido, si insiste → humano)
  8) precios: SOLO si está en el catálogo el bot dice lo que hay; si NO está,
     conecta con humano avisando que no tiene esa info al momento
  9) métodos de pago: transferencia/efectivo/tarjeta + 50% depósito eventos;
     IMPORTANTE: nunca enviar números de cuenta por WhatsApp
  10) Uber Eats / PedidosYa (sí, ambos, con links)
  11) qué productos tienen (orienta por categorías + link, no lista 1x1)
  12) opciones sin gluten / veganas (sí, escala a humano para orientación)
  13) catering / corporativo (sí, se cotiza según evento)
  `tags` deben ser palabras clave en minúscula sin tildes para que el bot
  matchee texto libre.

────────────────────────────────────────────────────────────
PASO 2 — Helper de horario en src/lib/bizInfo.ts
────────────────────────────────────────────────────────────
Agrega export function isOpenNow(now?: Date): { open:boolean; schedule:string }
que calcule la hora local RD aplicando RD_UTC_OFFSET_HOURS (mismo patrón que
src/app/api/orders/route.ts usa: Date.now() - 4*3600_000), consulte SCHEDULE
por día, y devuelva si está abierto + SCHEDULE_TEXT. Considerar HOLIDAY_OVERRIDES
aunque esté vacío (preparado para el futuro).

────────────────────────────────────────────────────────────
PASO 3 — Endpoints públicos de solo lectura
────────────────────────────────────────────────────────────
Crear:
- src/app/api/public/business-info/route.ts → GET que devuelve
  { business, address, mapsUrl, phone, email, socials, schedule:SCHEDULE_TEXT,
    isOpenNow, links, rules, categories }. Público, sin auth.
  Cache-Control: "public, s-maxage=300, stale-while-revalidate=600".
- src/app/api/public/faq/route.ts → GET que devuelve FAQS.
  Mismo header de cache. Soporta ?q= opcional: si viene, filtra FAQS por match
  simple en q/a/tags (normalizando minúsculas/sin tildes) y devuelve las que
  matcheen; si no, devuelve todas.
- Ambos: export const revalidate = 300; runtime nodejs.
- Reutiliza el catálogo existente: NO crees endpoint nuevo de productos,
  el bot usará el GET /api/products que ya existe.

IMPORTANTE sobre middleware: revisa src/middleware.ts. El matcher actual NO
cubre /api/public/*, así que estos endpoints quedan públicos por defecto —
verifícalo y, si hiciera falta, asegúralo explícitamente, pero NO agregues
auth a /api/public/*.

────────────────────────────────────────────────────────────
PASO 4 — Refactor SIN cambiar apariencia
────────────────────────────────────────────────────────────
- src/app/faq/page.tsx: reemplaza el array local FAQS por import desde
  src/lib/bizInfo.ts (mapea {q,a}). El render, estilos y animaciones quedan
  idénticos. No toques el JSX de presentación.
- src/app/contacto/page.tsx: reemplaza los strings hardcodeados de dirección,
  teléfono, email, instagram, tiktok, mapsUrl por los de BUSINESS/LINKS.
  Apariencia idéntica.
- No toques lib/whatsapp.ts ni DeliveryButtons.tsx en esta fase (solo se
  copiaron sus valores a bizInfo; unificarlos es fase posterior).

────────────────────────────────────────────────────────────
PASO 5 — Modelo Escalation + endpoint (preparación para Fase 2)
────────────────────────────────────────────────────────────
- En prisma/schema.prisma agrega modelo Escalation:
  id (cuid), customerPhone, customerName?, summary (String), state (String),
  status (enum: OPEN | HANDLED, default OPEN), handledBy?, handledAt?,
  createdAt (default now). @@map("whatsapp_escalations"), índices en
  status y createdAt.
  NO corras migraciones tú: deja el schema listo y documenta el comando
  exacto en un comentario al final del prompt de salida.
- Crear src/app/api/whatsapp/escalations/route.ts:
  POST: lo llama el bot externo. Protección por header
  x-bot-api-key === process.env.BOT_API_KEY (comparación timing-safe;
  si no hay env, responde 503). Valida body con zod
  (customerPhone requerido formato dominicano usando lib/phone.ts,
  customerName opcional, summary string 1..2000, state string). Crea
  Escalation. Tras crear, dispara la notificación push existente
  reutilizando el patrón de src/lib/push.ts (notifica a OWNER/BAKER;
  si push falla, NO rompas el POST, solo console.error — mismo patrón
  que /api/orders).
  GET: protegido con getSession (cualquier usuario logueado), lista
  escalations OPEN ordenadas por createdAt desc. Cache private no-store.
- Añade /api/whatsapp/ al matcher de src/middleware.ts SOLO para el GET
  (el POST se protege por API key, no por sesión; revisa que el matcher
  no bloquee el POST del bot — el POST debe poder entrar sin cookie).
- Actualiza .env.example agregando BOT_API_KEY="" con comentario.

────────────────────────────────────────────────────────────
PASO 6 — Verificación final
────────────────────────────────────────────────────────────
- npx tsc --noEmit debe pasar.
- npm run lint debe pasar.
- Lista de archivos creados/modificados.
- El comando exacto de migración Prisma para que YO lo corra manualmente
  (no lo ejecutes tú).
- NO crees el bot, NO toques el panel admin UI (la bandeja visual es Fase 2).

Cuando termines, dame un resumen de qué creaste, qué modificaste, y confirma
que faq/contacto se ven igual que antes.