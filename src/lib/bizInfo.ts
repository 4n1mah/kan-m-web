/**
 * Fuente única de verdad del negocio.
 *
 * Cualquier información factual sobre Kan M Repostería y Catering que se
 * exponga al cliente (web, bot externo de WhatsApp, FAQs, endpoints
 * públicos) DEBE leerse desde acá. Si un valor cambia, se cambia acá y
 * todos los consumidores lo reciben — la web no puede contradecir al bot.
 *
 * NO hardcodear de nuevo direcciones, teléfonos, horarios, etc. en otros
 * archivos.
 */

// República Dominicana no aplica horario de verano: siempre UTC-4.
export const RD_UTC_OFFSET_HOURS = -4;

// Día de la semana (0=domingo .. 6=sábado) → ventana de atención local RD.
// Horario REAL: Lun–Jue 9–19, Vie–Dom 9–22.
export const SCHEDULE: Record<number, { open: number; close: number }> = {
  0: { open: 9, close: 22 }, // Domingo
  1: { open: 9, close: 19 }, // Lunes
  2: { open: 9, close: 19 }, // Martes
  3: { open: 9, close: 19 }, // Miércoles
  4: { open: 9, close: 19 }, // Jueves
  5: { open: 9, close: 22 }, // Viernes
  6: { open: 9, close: 22 }, // Sábado
};

export const SCHEDULE_TEXT =
  "Lunes a jueves de 9:00 AM a 7:00 PM. Viernes a domingo de 9:00 AM a 10:00 PM.";

// Excepciones por fecha local RD. Key = "YYYY-MM-DD".
// Valor null = cerrado todo el día (feriado). Objeto = horario especial.
// Ejemplo para extender:
//   HOLIDAY_OVERRIDES["2026-12-25"] = null;             // Navidad cerrado
//   HOLIDAY_OVERRIDES["2026-12-31"] = { open: 9, close: 16 };  // Fin de año cierre temprano
export const HOLIDAY_OVERRIDES: Record<
  string,
  { open: number; close: number } | null
> = {};

export const BUSINESS = {
  name: "Kan M Repostería y Catering",
  greeting: "¡Hola, bienvenido a Kan M Repostería y Catering!",
  address: "C. Espaillat 58, Zona Colonial, Santo Domingo",
  mapsUrl: "https://maps.app.goo.gl/D1i89Ui3vx92FubCA",
  phoneDisplay: "+1 (829) 610-7064",
  phoneTel: "+18296107064",
  email: "kanmreposteriaycatering@gmail.com",
  instagram: "https://www.instagram.com/kanm.reposteriacafe/",
  tiktok: "https://www.tiktok.com/@kanmreposteriacafe",
} as const;

// SITE_URL sin slash final — los helpers de LINKS concatenan rutas con "/".
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kan-m-reposteria.vercel.app";
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

// Categorías del catálogo. DEBEN coincidir con src/app/catalogo/CatalogClient.tsx.
export const CATALOG_CATEGORIES: { id: string; label: string }[] = [
  { id: "cakes", label: "Pasteles" },
  { id: "desserts", label: "Postres" },
  { id: "events", label: "Mesa de dulces" },
  { id: "picaderas", label: "Picaderas para eventos" },
  { id: "brunch", label: "Brunch" },
  { id: "drinks", label: "Bebidas" },
];

// Link externo copiado EXACTO desde src/components/DeliveryButtons.tsx
// (web fallback que sirve para Uber Eats en cualquier plataforma).
const UBER_EATS_WEB =
  "https://www.ubereats.com/do/store/kan-m-reposteria-y-catering/QOT7Ijk8VG2ghDALNJ_MKA";

export const LINKS = {
  home: SITE_URL,
  catalogo: `${SITE_URL}/catalogo`,
  catalogoCategoria: (cat: string) => `${SITE_URL}/catalogo?cat=${cat}`,
  cotizar: `${SITE_URL}/cotizar`,
  catering: `${SITE_URL}/catering`,
  faq: `${SITE_URL}/faq`,
  contacto: `${SITE_URL}/contacto`,
  maps: BUSINESS.mapsUrl,
  uberEats: UBER_EATS_WEB,
} as const;

// Reglas de negocio. minLeadDays = 3 es el valor canónico; la validación
// que lo aplica vive en src/app/api/orders/route.ts (eventDate >= hoy + 3
// en hora RD). Si algún día se cambia, hay que cambiarlo en ambos lugares.
export const RULES = {
  minLeadDays: 3,
  bigEventLeadText:
    "1 a 2 semanas para eventos grandes (bodas, cumpleaños temáticos)",
  deliveryMinAmountRD: 250,
  eventDepositPercent: 50,
  botMayShareBankInfo: false,
} as const;

// ── FAQs ───────────────────────────────────────────────────────────────────
// Redactadas en tuteo, amables. `tags` deben ser palabras clave en minúscula
// y SIN tildes para que el bot pueda matchear texto libre.
// Cualquier dato concreto (horario, dirección, links, montos) se interpola
// desde las constantes de arriba — no se hardcodea.

export interface Faq {
  id: string;
  q: string;
  a: string;
  tags: string[];
}

export const FAQS: Faq[] = [
  {
    id: "horario",
    q: "¿Cuál es su horario de atención?",
    a: `${SCHEDULE_TEXT} Si quieres confirmar si estamos abiertos ahora mismo, pregúntame y te digo.`,
    tags: [
      "horario",
      "hora",
      "horas",
      "abren",
      "cierran",
      "abierto",
      "cerrado",
      "atencion",
    ],
  },
  {
    id: "ubicacion",
    q: "¿Dónde están ubicados?",
    a: `Estamos en ${BUSINESS.address}. Aquí tienes la ubicación en Google Maps: ${BUSINESS.mapsUrl}`,
    tags: [
      "ubicacion",
      "direccion",
      "donde",
      "estan",
      "local",
      "tienda",
      "maps",
      "mapa",
      "zona colonial",
    ],
  },
  {
    id: "delivery",
    q: "¿Cómo puedo recibir mi pedido?",
    a:
      `Tienes tres opciones: ` +
      `1) Pickup gratis en ${BUSINESS.address}. ` +
      `2) Entrega propia desde un mínimo de RD$${RULES.deliveryMinAmountRD}; el costo varía según la distancia. ` +
      `3) Pídelo por Uber Eats (${LINKS.uberEats}).`,
    tags: [
      "delivery",
      "envio",
      "envios",
      "domicilio",
      "pickup",
      "recoger",
      "entrega",
      "entregas",
      "ubereats",
      "uber",
    ],
  },
  {
    id: "como-ordenar",
    q: "¿Cómo hago un pedido?",
    a:
      `Puedes ordenar de varias formas: ` +
      `del catálogo en ${LINKS.catalogo}, ` +
      `cotizar un pastel o evento personalizado en ${LINKS.cotizar}, ` +
      `escribirnos al WhatsApp ${BUSINESS.phoneDisplay}, ` +
      `o pedir por Uber Eats.`,
    tags: [
      "ordenar",
      "pedir",
      "pedido",
      "pedidos",
      "como",
      "comprar",
      "encargar",
    ],
  },
  {
    id: "personalizados",
    q: "¿Hacen pasteles personalizados?",
    a:
      `¡Claro que sí! Diseños temáticos, fotos comestibles, colores y sabores a tu gusto. ` +
      `Cuéntanos qué tienes en mente desde ${LINKS.cotizar} y te enviamos la cotización.`,
    tags: [
      "personalizado",
      "personalizados",
      "diseno",
      "disenos",
      "tematico",
      "tematica",
      "foto",
      "fotos",
      "comestible",
      "custom",
    ],
  },
  {
    id: "anticipacion",
    q: "¿Con cuánta anticipación debo pedir?",
    a:
      `Para pedidos regulares pedimos un mínimo de ${RULES.minLeadDays} días. ` +
      `Para ${RULES.bigEventLeadText}. Mientras antes nos cuentes, más fácil aseguramos disponibilidad y personalización.`,
    tags: [
      "anticipacion",
      "antelacion",
      "tiempo",
      "dias",
      "cuanto",
      "antes",
      "reservar",
      "reserva",
    ],
  },
  {
    id: "cotizar-evento",
    q: "¿Cómo cotizo mi evento?",
    a:
      `Lo más rápido es completar el formulario en ${LINKS.cotizar}; te respondemos en menos de 24 horas. ` +
      `Si prefieres hablar directo con una persona, dímelo y te conecto con el equipo.`,
    tags: [
      "cotizar",
      "cotizacion",
      "evento",
      "eventos",
      "presupuesto",
      "boda",
      "bodas",
      "cumpleanos",
      "cumple",
    ],
  },
  {
    id: "precios",
    q: "¿Cuánto cuestan los productos?",
    a:
      `Si el producto está en nuestro catálogo (${LINKS.catalogo}) puedo darte el precio al momento. ` +
      `Si no está listado o se trata de algo personalizado, no tengo esa info ahora mismo — te conecto con el equipo para que te lo cotice correctamente.`,
    tags: [
      "precio",
      "precios",
      "cuesta",
      "cuestan",
      "cuanto",
      "valor",
      "tarifa",
      "costo",
    ],
  },
  {
    id: "pagos",
    q: "¿Qué métodos de pago aceptan?",
    a:
      `Aceptamos transferencia bancaria, efectivo y tarjeta de crédito/débito. ` +
      `Para eventos pedimos ${RULES.eventDepositPercent}% de depósito al confirmar y el resto al momento de la entrega. ` +
      `Por seguridad, nunca enviamos números de cuenta por WhatsApp; cuando confirmes el pedido, el equipo te comparte los datos por el canal correcto.`,
    tags: [
      "pago",
      "pagos",
      "transferencia",
      "efectivo",
      "tarjeta",
      "deposito",
      "metodo",
      "metodos",
      "cuenta",
    ],
  },
  {
    id: "delivery-apps",
    q: "¿Están en Uber Eats?",
    a: `Sí. Puedes pedir por Uber Eats aquí: ${LINKS.uberEats}.`,
    tags: [
      "ubereats",
      "uber",
      "uber eats",
      "app",
      "apps",
      "delivery",
    ],
  },
  {
    id: "productos",
    q: "¿Qué productos tienen?",
    a:
      `Manejamos seis categorías: ${CATALOG_CATEGORIES.map((c) => c.label).join(", ")}. ` +
      `Puedes verlos todos con fotos y precios en ${LINKS.catalogo}.`,
    tags: [
      "productos",
      "menu",
      "carta",
      "catalogo",
      "tienen",
      "venden",
      "ofrecen",
      "que hay",
    ],
  },
  {
    id: "dieta",
    q: "¿Tienen opciones sin gluten o veganas?",
    a:
      `Sí, manejamos opciones sin gluten y veganas en varios productos. ` +
      `Como depende del producto y la fecha, te conecto con el equipo para que te oriente con lo que tenemos disponible para ti.`,
    tags: [
      "sin gluten",
      "gluten",
      "vegano",
      "vegana",
      "veganos",
      "veganas",
      "dieta",
      "celiaco",
      "celiaca",
      "intolerancia",
      "alergia",
    ],
  },
  {
    id: "catering",
    q: "¿Hacen catering o eventos corporativos?",
    a:
      `Sí, hacemos catering para eventos sociales y corporativos. ` +
      `El precio se cotiza según el tipo de evento, cantidad de invitados y menú elegido. ` +
      `Empieza tu cotización en ${LINKS.cotizar} o cuéntanos los detalles por WhatsApp.`,
    tags: [
      "catering",
      "corporativo",
      "corporativos",
      "empresa",
      "empresarial",
      "evento",
      "eventos",
      "buffet",
      "picaderas",
    ],
  },
];

// ── Helper de horario ──────────────────────────────────────────────────────

/**
 * Devuelve si Kan M está abierto en `now` (default: ahora).
 *
 * Calcula la hora local RD aplicando RD_UTC_OFFSET_HOURS — mismo patrón que
 * `src/app/api/orders/route.ts` (`Date.now() - 4 * 3600_000`). Lee
 * HOLIDAY_OVERRIDES primero (null = cerrado, objeto = horario especial); si
 * no hay override, cae al SCHEDULE semanal.
 */
export function isOpenNow(
  now: Date = new Date(),
): { open: boolean; schedule: string } {
  // Hora local RD vista a través de getUTC*: añadimos el offset (negativo)
  // al timestamp y luego leemos los componentes UTC del resultado.
  const nowRD = new Date(now.getTime() + RD_UTC_OFFSET_HOURS * 3600_000);

  const yyyy = nowRD.getUTCFullYear();
  const mm = String(nowRD.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(nowRD.getUTCDate()).padStart(2, "0");
  const dateKey = `${yyyy}-${mm}-${dd}`;
  const hourFloat = nowRD.getUTCHours() + nowRD.getUTCMinutes() / 60;

  if (Object.prototype.hasOwnProperty.call(HOLIDAY_OVERRIDES, dateKey)) {
    const override = HOLIDAY_OVERRIDES[dateKey];
    if (override === null) {
      return { open: false, schedule: SCHEDULE_TEXT };
    }
    return {
      open: hourFloat >= override.open && hourFloat < override.close,
      schedule: SCHEDULE_TEXT,
    };
  }

  const day = nowRD.getUTCDay();
  const slot = SCHEDULE[day];
  if (!slot) return { open: false, schedule: SCHEDULE_TEXT };
  return {
    open: hourFloat >= slot.open && hourFloat < slot.close,
    schedule: SCHEDULE_TEXT,
  };
}
