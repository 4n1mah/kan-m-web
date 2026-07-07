/**
 * Menú oficial de pasteles (decoración sencilla) — fuente única de verdad.
 *
 * Precios tomados del "Menú Pasteles" oficial del negocio. Cualquier cambio
 * de precio se hace AQUÍ y lo reciben el formulario de cotizar y el panel
 * admin (agendar pedido en persona).
 *
 * Regla del menú: máximo dos colores de decoración y mensaje corto opcional.
 * Decoraciones elaboradas / tamaños fuera del menú se cotizan aparte.
 */

export type CakeSizeId = "1/4" | "1/2" | "1";

export const SIZE_LABELS: Record<CakeSizeId, string> = {
  "1/4": "1/4 libra",
  "1/2": "1/2 libra",
  "1": "1 libra",
};

// ── Pastel tradicional ──────────────────────────────────────────
export const MASAS = ["Vainilla", "Chocolate", "Mármol cake", "Naranja"] as const;

export const FILLINGS = [
  "Dulce de leche",
  "Crema pastelera",
  "Crema pastelera chocolate",
  "Ganache chocolate",
  "Ganache chocolate blanco",
  "Mermelada fresa",
  "Mermelada frutos del bosque",
  "Mermelada piña",
  "Mermelada limón",
] as const;

// Decoración sencilla → precio por tamaño.
export const DECORATIONS: {
  id: string;
  label: string;
  prices: Record<CakeSizeId, number>;
}[] = [
  { id: "suspiro",     label: "Suspiro",     prices: { "1/4": 1100, "1/2": 1600, "1": 2300 } },
  { id: "chantilly",   label: "Chantilly",   prices: { "1/4": 1500, "1/2": 2100, "1": 2800 } },
  { id: "buttercream", label: "Buttercream", prices: { "1/4": 1800, "1/2": 2500, "1": 3400 } },
  { id: "ganache",     label: "Ganache (negro o blanco)", prices: { "1/4": 2800, "1/2": 3500, "1": 4600 } },
];

// ── Pasteles clásicos ───────────────────────────────────────────
// Solo se venden en 1/2 y 1 libra. El relleno viene definido.
export const CLASSIC_CAKES: {
  name: string;
  description: string;
  prices: Partial<Record<CakeSizeId, number>>;
}[] = [
  {
    name: "Red Velvet",
    description: "Relleno frutos rojos y frosting de queso crema",
    prices: { "1/2": 1800, "1": 2600 },
  },
  {
    name: "Beso de ángel",
    description: "",
    prices: { "1/2": 2100, "1": 3200 },
  },
  {
    name: "Carrot Cake",
    description: "Con nueces, relleno piña y frosting de queso crema",
    prices: { "1/2": 2300, "1": 3300 },
  },
];

// ── Especialidades de la casa ───────────────────────────────────
// Todas comparten el mismo precio: 1/2 lb RD$2,900 · 1 lb RD$3,900.
export const SPECIALTY_FLAVORS = [
  "Oreo crema",
  "Fresa crema",
  "Chinola coco",
  "Banana Nutella",
  "Selva negra",
  "Milky way",
  "Nutella y pistacho",
] as const;

export const SPECIALTY_PRICES: Partial<Record<CakeSizeId, number>> = {
  "1/2": 2900,
  "1": 3900,
};

export const CAKE_MENU_NOTE =
  "Precio estimado de decoración sencilla (máximo dos colores y mensaje corto opcional). El precio final puede variar según el diseño y los detalles del pastel.";

// ── Detalle de pastel (se guarda como JSON en Order.cakeDetails) ──
export type CakeDetail = {
  cakeType: "tradicional" | "clasico" | "especialidad";
  /** Nombre del clásico o especialidad (vacío en tradicional). */
  flavor: string;
  masa: string;
  filling: string;
  /** Label de la decoración elegida (solo tradicional). */
  decoration: string;
  size: string;
  colors: string;
  message: string;
  /** Precio del menú si el combo está en el menú; null = a cotizar. */
  estimatedPrice: number | null;
};

export const EMPTY_CAKE_DETAIL: CakeDetail = {
  cakeType: "tradicional",
  flavor: "",
  masa: "",
  filling: "",
  decoration: "",
  size: "",
  colors: "",
  message: "",
  estimatedPrice: null,
};

/** Normaliza "1/4 libra", "1/2 lb", "1" → id de tamaño del menú (o null). */
export function normalizeSize(size: string): CakeSizeId | null {
  const clean = size.trim().toLowerCase().replace(/\s*(libras?|lb)\s*$/, "");
  return clean === "1/4" || clean === "1/2" || clean === "1" ? clean : null;
}

/** Precio del menú para la combinación dada, o null si no está en el menú. */
export function estimateCakePrice(d: {
  cakeType: string;
  flavor?: string;
  decoration?: string;
  size?: string;
}): number | null {
  const size = normalizeSize(d.size ?? "");
  if (!size) return null;
  if (d.cakeType === "tradicional") {
    const deco = DECORATIONS.find((x) => x.label === d.decoration);
    return deco?.prices[size] ?? null;
  }
  if (d.cakeType === "clasico") {
    const cake = CLASSIC_CAKES.find((x) => x.name === d.flavor);
    return cake?.prices[size] ?? null;
  }
  if (d.cakeType === "especialidad") {
    if (!d.flavor || !SPECIALTY_FLAVORS.includes(d.flavor as (typeof SPECIALTY_FLAVORS)[number])) return null;
    return SPECIALTY_PRICES[size] ?? null;
  }
  return null;
}

export function formatRD(n: number): string {
  return `RD$${n.toLocaleString("es-DO")}`;
}
