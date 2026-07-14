/**
 * Menú oficial de pasteles (decoración sencilla) — fuente única de verdad.
 *
 * Precios tomados del "Menú Pasteles" oficial del negocio. Cualquier cambio
 * de precio se hace AQUÍ y lo reciben el formulario de cotizar y el panel
 * admin (agendar pedido en persona).
 *
 * Regla del menú: máximo dos colores de decoración y mensaje corto opcional.
 * Decoraciones elaboradas se cotizan aparte.
 */

export type CakeSizeId = "1/2" | "1";

export const SIZE_LABELS: Record<CakeSizeId, string> = {
  "1/2": "1/2 libra",
  "1": "1 libra",
};

// ── Menú de pasteles ────────────────────────────────────────────
export const CAKE_MENU: {
  name: string;
  description: string;
  prices: Record<CakeSizeId, number>;
}[] = [
  {
    name: "Dominicano",
    description: "Bizcocho de vainilla, dulce de leche, mermelada de guayaba y suspiro",
    prices: { "1/2": 1800, "1": 2500 },
  },
  {
    name: "Beso de ángel",
    description: "Pastel de tres leches, relleno de flan y chantilly",
    prices: { "1/2": 2500, "1": 3500 },
  },
  {
    name: "Red Velvet Berry",
    description: "Bizcocho red velvet, mermelada de frutos rojos, betún de queso crema",
    prices: { "1/2": 2500, "1": 3500 },
  },
  {
    name: "Nutella Crunch",
    description: "Bizcocho de chocolate, bizcocho de vainilla, mousse de Nutella, Nutella pura y chispas de chocolate",
    prices: { "1/2": 2500, "1": 3500 },
  },
  {
    name: "Fiesta de Chocolate",
    description: "Bizcocho de chocolate, ganache de chocolate y chantilly de chocolate",
    prices: { "1/2": 2000, "1": 3200 },
  },
  {
    name: "Carrot Cake",
    description: "Bizcocho de zanahoria y nueces, mermelada de piña, betún de queso crema",
    prices: { "1/2": 2500, "1": 3500 },
  },
  {
    name: "Colibrí",
    description: "Bizcocho de banana, piña y nueces, flan y chantilly",
    prices: { "1/2": 2500, "1": 3500 },
  },
  {
    name: "Delicia de Chinola",
    description: "Bizcocho de vainilla, mousse de chinola, mermelada de chinola",
    prices: { "1/2": 2000, "1": 3200 },
  },
  {
    name: "Selva Negra",
    description: "Bizcocho de chocolate, cerezas, chispas de chocolate y chantilly",
    prices: { "1/2": 2000, "1": 3200 },
  },
  {
    name: "Chocoflan",
    description: "Bizcocho de chocolate, flan y dulce de leche",
    prices: { "1/2": 2500, "1": 3500 },
  },
];

export const CAKE_MENU_NOTE =
  "Precio estimado de decoración sencilla (máximo dos colores y mensaje corto opcional). El precio final puede variar según el diseño y los detalles del pastel.";

// ── Detalle de pastel (se guarda como JSON en Order.cakeDetails) ──
// masa/filling/decoration quedan vacíos en los pedidos nuevos ("menu"),
// pero se conservan en el tipo por compatibilidad con los pedidos viejos
// (tradicional/clásico/especialidad) ya guardados en la base de datos.
export type CakeDetail = {
  cakeType: "menu" | "tradicional" | "clasico" | "especialidad";
  /** Nombre del pastel del menú. */
  flavor: string;
  masa: string;
  filling: string;
  decoration: string;
  size: string;
  colors: string;
  message: string;
  /** Precio del menú si el combo está en el menú; null = a cotizar. */
  estimatedPrice: number | null;
};

export const EMPTY_CAKE_DETAIL: CakeDetail = {
  cakeType: "menu",
  flavor: "",
  masa: "",
  filling: "",
  decoration: "",
  size: "",
  colors: "",
  message: "",
  estimatedPrice: null,
};

/** Normaliza "1/2 libra", "1 lb", "1" → id de tamaño del menú (o null). */
export function normalizeSize(size: string): CakeSizeId | null {
  const clean = size.trim().toLowerCase().replace(/\s*(libras?|lb)\s*$/, "");
  return clean === "1/2" || clean === "1" ? clean : null;
}

/** Precio del menú para la combinación dada, o null si no está en el menú. */
export function estimateCakePrice(d: {
  flavor?: string;
  size?: string;
}): number | null {
  const size = normalizeSize(d.size ?? "");
  if (!size) return null;
  const cake = CAKE_MENU.find((x) => x.name === d.flavor);
  return cake?.prices[size] ?? null;
}

export function formatRD(n: number): string {
  return `RD$${n.toLocaleString("es-DO")}`;
}
