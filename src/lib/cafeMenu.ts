/**
 * Menú del café (Brunch, Bebidas y Postres) — fuente única de verdad.
 *
 * Productos, precios y descripciones tomados del "Menú KANm Café" oficial.
 * Cualquier cambio de precio o producto se hace AQUÍ y lo recibe /menu.
 * Todos los precios en RD$, ITBIS incluido.
 *
 * Los nombres y descripciones se muestran tal cual en ambos idiomas (es el
 * menú oficial del local); los títulos de categoría y grupo se traducen en
 * el diccionario (t.cafeMenu.groups[id]).
 *
 * Fotos: viven en /public/menu y son decorativas/de referencia, no van
 * atadas a un producto específico.
 */

import { LATICA } from "@/lib/bizInfo";

export type MenuPrice = { label?: string; amount: number };

export type MenuItem = {
  name: string;
  desc?: string;
  prices?: MenuPrice[];
};

export type MenuGroupId =
  | "picaderas"
  | "sandwichBar"
  | "desayunos"
  | "jugos"
  | "cafeFrio"
  | "cafeCaliente"
  | "tragos"
  | "latica"
  | "pedazos"
  | "galletones";

export type MenuGroup = {
  id: MenuGroupId;
  /** Precio único para todo el grupo (ej. La Latica). */
  price?: number;
  items: MenuItem[];
  /** Lista de toppings a escoger + precio del topping adicional. */
  toppings?: { list: string; extraPrice: number };
};

export type MenuCategoryId = "brunch" | "bebidas" | "postres";

export type MenuPhoto = { src: string; caption?: string };

export type MenuCategory = {
  id: MenuCategoryId;
  photos: MenuPhoto[];
  groups: MenuGroup[];
  /** En desktop, los grupos antes de este índice van en la columna izquierda
   *  y el resto en la derecha (mismo orden que el PDF del menú). */
  splitAt: number;
};

// Helper para no repetir { amount } en cada producto de precio único.
const rd = (amount: number): MenuPrice[] => [{ amount }];

export function formatRD(amount: number) {
  return `RD$${amount.toLocaleString("en-US")}`;
}

// Fondo del encabezado de /menu (carrusel): una foto por categoría.
export const MENU_HERO_PHOTOS = [
  "/menu/brunch-mangu.jpg",
  "/menu/bebidas-strawberry-latte.png",
  "/menu/postres-beso-de-angel.jpg",
  "/menu/bebidas-jugos-naturales.png",
];

export const CAFE_MENU: MenuCategory[] = [
  // ── BRUNCH (solo fines de semana) ───────────────────────────
  {
    id: "brunch",
    splitAt: 2,
    photos: [
      { src: "/menu/brunch-mangu.jpg", caption: "Desayuno Criollo Mangú" },
      { src: "/menu/brunch-croquetas.jpg", caption: "Croquetas" },
      { src: "/menu/brunch-quipes.jpg", caption: "Quipes" },
    ],
    groups: [
      {
        id: "picaderas",
        items: [
          { name: "Pastelitos (4 unds)", prices: rd(150) },
          { name: "Croquetas (4 unds)", prices: rd(150) },
          { name: "Quipes (4 unds)", prices: rd(150) },
          { name: "Bollitos de Yuca (4 unds)", prices: rd(150) },
          { name: "Bolitas de Queso (4 unds)", prices: rd(175) },
        ],
      },
      {
        id: "sandwichBar",
        items: [
          {
            name: "Sandwich BLT",
            desc: "Bacon, lechuga, tomates sazonados y queso crema",
            prices: rd(450),
          },
          {
            name: "Sandwich Chicken Salad",
            desc: "Sandwich frío de ensalada de pollo, mayonesa, tomate, maíz, cebolla, ajíes morrones y lechuga",
            prices: rd(400),
          },
          {
            name: "Club Sandwich",
            desc: "Pollo, jamón, queso, mantequilla, tomates sazonados, lechuga y salsa york, con papas fritas sazonadas",
            prices: rd(475),
          },
        ],
      },
      {
        id: "desayunos",
        items: [
          { name: "Servicio de Papitas", desc: "Papas fritas sazonadas", prices: rd(150) },
          {
            name: "Desayuno Americano Toast",
            desc: "Tostadas de mantequilla, mermelada, huevos revueltos y tocineta",
            prices: rd(400),
          },
          {
            name: "Desayuno Americano Deluxe",
            desc: "Pancakes esponjosos, syrup, mermelada, huevos revueltos y tocineta",
            prices: rd(475),
          },
          {
            name: "Desayuno Criollo Mangú",
            desc: "Mangú, servido con cebollita, salami frito, queso frito y huevos fritos",
            prices: rd(475),
          },
          {
            name: "Waffle Sandwich",
            desc: "Sándwich de waffle tradicional o de avena, con queso, huevo, tocineta y drizzle de miel orgánica",
            prices: rd(400),
          },
          {
            name: "Chicken Waffle",
            desc: "Waffle tradicional o de avena, con pechuga de pollo empanizada, lechuga, sour cream y drizzle de miel orgánica",
            prices: rd(450),
          },
          {
            name: "Waffles Tradicionales",
            desc: "Servidos con 2 toppings de preferencia",
            prices: rd(350),
          },
          {
            name: "Waffles de Avena",
            desc: "Masa de avena, servidos con 2 toppings de preferencia",
            prices: rd(350),
          },
          {
            name: "Pancakes Tradicionales",
            desc: "Esponjosos pancakes servidos con 2 toppings de preferencia",
            prices: rd(400),
          },
        ],
        toppings: {
          list: "Miel orgánica, mermelada, syrup, syrup de chocolate, crema batida, chispas de chocolate, chispas de colores, fruta del día, almendras, nutella.",
          extraPrice: 75,
        },
      },
    ],
  },

  // ── BEBIDAS ─────────────────────────────────────────────────
  {
    id: "bebidas",
    splitAt: 2,
    photos: [
      { src: "/menu/bebidas-strawberry-latte.png", caption: "Strawberry Latte" },
      { src: "/menu/bebidas-cappuccino-dulce-de-leche.png", caption: "Cappuccino Dulce de Leche" },
      { src: "/menu/bebidas-jugos-naturales.png", caption: "Jugos Naturales" },
      { src: "/menu/bebidas-smoothie-mango.png", caption: "Smoothie de Mango" },
      { src: "/menu/bebidas-infusion-salvaje.png", caption: "Infusión Salvaje" },
      { src: "/menu/bebidas-coco-pasion.png", caption: "Coco Pasión" },
    ],
    groups: [
      {
        id: "jugos",
        items: [
          {
            name: "Jugos Naturales",
            prices: [
              { label: "12oz", amount: 125 },
              { label: "16oz", amount: 150 },
            ],
          },
          { name: "Batidas", desc: "Fresa, mango, lechosa, guineo, zapote", prices: rd(225) },
          {
            name: "Smoothies",
            desc: "Base: agua, leche entera o leche de coco · Fruta: fresa, guineo, frutos del bosque o mango",
            prices: rd(300),
          },
          {
            name: "Malteadas",
            desc: "Sabor a escoger: brownie, fresa, bizcocho de cumpleaños, dulce de leche",
            prices: [
              { label: "12oz", amount: 275 },
              { label: "16oz", amount: 300 },
            ],
          },
        ],
      },
      {
        id: "cafeCaliente",
        items: [
          { name: "Café Negro", prices: rd(100) },
          { name: "Café Espresso", prices: rd(100) },
          { name: "Cortadito", prices: rd(150) },
          { name: "Café con Leche", prices: rd(150) },
          { name: "Café Vainilla Latte", prices: rd(150) },
          { name: "Cappuccino", prices: rd(150) },
          { name: "Cappuccino Dulce de Leche", prices: rd(200) },
          { name: "Café Moca", prices: rd(200) },
          { name: "Chocolate Caliente", prices: rd(200) },
          {
            name: "Affogato",
            desc: "Bola de helado de vainilla sumergida en café negro",
            prices: rd(200),
          },
          {
            name: "Infusión Salvaje",
            desc: "Té de rosas, frutos rojos y miel orgánica",
            prices: rd(150),
          },
          {
            name: "Infusión Relajante",
            desc: "Té de manzanilla, tilo y miel orgánica",
            prices: rd(150),
          },
        ],
      },
      {
        id: "cafeFrio",
        items: [
          { name: "Frappé o Ice Cappuccino", prices: rd(250) },
          { name: "Frappé o Ice Moca", prices: rd(250) },
          { name: "Frappé o Ice Dulce de Leche", prices: rd(250) },
          {
            name: "Strawberry Coffee Latte",
            desc: "Café, leche fría, syrup de fresas y crema batida",
            prices: rd(250),
          },
          {
            name: "Strawberry Latte",
            desc: "Leche fría, syrup de fresas y crema batida",
            prices: rd(250),
          },
          {
            name: "Merry Berry",
            desc: "Té frío de frutos del bosque macerados y miel",
            prices: rd(250),
          },
          {
            name: "Coco Pasión",
            desc: "Té frío de chinola, crema de coco y leche de coco",
            prices: rd(250),
          },
          { name: "Refrescos", prices: rd(75) },
          { name: "Agua", prices: rd(75) },
          { name: "Agua Carbonatada", prices: rd(75) },
        ],
      },
      {
        id: "tragos",
        items: [
          {
            name: "Affogato Borracho",
            desc: "Shot de espresso, ron dorado y bola de helado de vainilla",
            prices: rd(350),
          },
          {
            name: "Merry Berry Margarita",
            desc: "Té de frutos rojos, macerado de frutos rojos, tequila y triple sec",
            prices: rd(400),
          },
          {
            name: "Coco Pasión Borracho",
            desc: "Té de chinola, crema de coco, leche de coco y ron dorado",
            prices: rd(400),
          },
          {
            name: "La Piña Más Colada",
            desc: "Jugo de piña, crema de coco, leche de coco, ron dorado y paleta de coco",
            prices: rd(550),
          },
          {
            name: "Gin Tropical",
            desc: "Ginebra con jugo de chinola y jugo de piña",
            prices: rd(400),
          },
          { name: "Corona", prices: rd(350) },
          { name: "Presidente", prices: rd(300) },
        ],
      },
    ],
  },

  // ── POSTRES ─────────────────────────────────────────────────
  {
    id: "postres",
    splitAt: 1,
    photos: [
      { src: "/laticas/1000518108.jpg", caption: "La Latica" },
      { src: "/menu/postres-beso-de-angel.jpg", caption: "Beso de Ángel" },
      { src: "/menu/postres-cheesecake.jpg", caption: "Cheesecake" },
      { src: "/menu/postres-blondie.jpg", caption: "Blondie" },
    ],
    groups: [
      {
        id: "latica",
        price: LATICA.priceRD,
        items: [
          {
            name: "Nutella Crunch",
            desc: "Bizcocho de chocolate, bizcocho de vainilla, mousse de Nutella, Nutella pura y chispas de chocolate",
          },
          {
            name: "Red Velvet Berry",
            desc: "Bizcocho red velvet, mermelada de frutos rojos, betún de queso crema",
          },
          {
            name: "Fiesta de Chocolate",
            desc: "Bizcocho de chocolate, ganache de chocolate y chantilly de chocolate",
          },
          {
            name: "Carrot Cake",
            desc: "Bizcocho de zanahoria y nueces, mermelada de piña, betún de queso crema",
          },
          { name: "Colibrí", desc: "Bizcocho de banana, piña y nueces, flan y chantilly" },
          {
            name: "Dominicana",
            desc: "Bizcocho de vainilla, dulce de leche, mermelada de guayaba y suspiro",
          },
          { name: "Chocoflan", desc: "Bizcocho de chocolate, flan y dulce de leche" },
          {
            name: "Carlota Dulce de Leche",
            desc: "Galletas María, dulce de leche, queso crema y chantilly",
          },
          { name: "Tres Leches", desc: "Bizcocho esponjoso, crema tres leches y chantilly" },
          {
            name: "Delicia de Chinola",
            desc: "Bizcocho de vainilla, mousse de chinola, mermelada de chinola",
          },
          {
            name: "Selva Negra",
            desc: "Bizcocho de chocolate, cerezas, chispas de chocolate y chantilly",
          },
        ],
      },
      {
        id: "pedazos",
        items: [
          { name: "Beso de Ángel", desc: "Pastel tres leches relleno de flan", prices: rd(350) },
          { name: "Flan de Leche", prices: rd(250) },
          { name: "Cheesecake", prices: rd(350) },
          { name: "Brownie", prices: rd(125) },
          { name: "Blondie", prices: rd(125) },
          { name: "Brownie / Blondie a la Moda", prices: rd(275) },
        ],
      },
      {
        id: "galletones",
        items: [
          { name: "Chispas de Chocolate", prices: rd(200) },
          { name: "Brownie", prices: rd(200) },
          { name: "Brownie Dulce de Leche", prices: rd(200) },
          { name: "Red Velvet", prices: rd(200) },
          { name: "Churro", prices: rd(200) },
          { name: "Guayaba y Chocolate Blanco", prices: rd(200) },
          { name: "S'mores", prices: rd(200) },
          { name: "Nutella", prices: rd(300) },
          { name: "Berry Cheesecake", prices: rd(300) },
          { name: "Galletón a la Moda", prices: rd(350) },
          { name: "Galletón Relleno a la Moda", prices: rd(450) },
        ],
      },
    ],
  },
];
