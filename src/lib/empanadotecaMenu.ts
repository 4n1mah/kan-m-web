/**
 * Menú de Empanadoteca — fuente única de verdad.
 *
 * Productos y precios tomados del "Menú Empanadoteca" oficial. Cualquier
 * cambio de precio o sabor se hace AQUÍ y lo recibe /empanadoteca.
 * Precios en RD$. Los nombres se muestran igual en ambos idiomas; los
 * títulos de cada masa se traducen en el diccionario
 * (t.empanadoteca.groups[id]).
 */

export type EmpItem = { name: string; price: number; featured?: boolean };

export type EmpGroupId = "tradicional" | "venezolana" | "catibias";

export type EmpGroup = { id: EmpGroupId; items: EmpItem[] };

export const EMP_PHOTOS = {
  hero: "/empanadoteca/empanadas-queso.jpg",
  superPastelito: "/empanadoteca/super-pastelito.jpg",
  empanadas: "/empanadoteca/empanadas.jpg",
};

export const EMP_MENU: EmpGroup[] = [
  {
    id: "tradicional",
    items: [
      { name: "Súper Pastelito", price: 375, featured: true },
      { name: "Súper Pastelito con camarones", price: 475, featured: true },
      { name: "Doble queso", price: 150 },
      { name: "Jamón y queso", price: 150 },
      { name: "Pollo con queso", price: 200 },
      { name: "Res con queso", price: 200 },
      { name: "Queso maíz", price: 200 },
      { name: "Pollo maíz", price: 200 },
      { name: "Vegetales con queso", price: 200 },
      { name: "Pollo BBQ", price: 200 },
      { name: "Pizza", price: 175 },
      { name: "Pizza maíz", price: 200 },
      { name: "Capresa", price: 200 },
      { name: "BBQ Pulled pork", price: 250 },
      { name: "Mariscos", price: 250 },
      { name: "Bacalao", price: 250 },
      { name: "Camarones", price: 300 },
    ],
  },
  {
    id: "venezolana",
    items: [
      { name: "Doble queso", price: 150 },
      { name: "Jamón y queso", price: 150 },
      { name: "Pollo con queso", price: 200 },
      { name: "Res con queso", price: 200 },
      { name: "Queso maíz", price: 200 },
      { name: "Pollo maíz", price: 200 },
      { name: "Vegetales con queso", price: 200 },
      { name: "Capresa", price: 250 },
      { name: "Pollo BBQ", price: 250 },
      { name: "BBQ Pulled pork", price: 250 },
      { name: "Mariscos", price: 275 },
      { name: "Bacalao", price: 275 },
      { name: "Camarones", price: 325 },
    ],
  },
  {
    id: "catibias",
    items: [
      { name: "Doble queso", price: 150 },
      { name: "Pollo con queso", price: 200 },
      { name: "Res con queso", price: 200 },
      { name: "Pollo BBQ", price: 200 },
      { name: "BBQ Pulled pork", price: 250 },
      { name: "Bacalao", price: 275 },
      { name: "Camarones", price: 325 },
    ],
  },
];

/** Productos destacados (Súper Pastelito) para la sección "estrella". */
export const EMP_FEATURED = EMP_MENU.flatMap((g) => g.items.filter((i) => i.featured));

/** Precio más bajo del menú, para el sello "desde RD$…". */
export const EMP_MIN_PRICE = Math.min(...EMP_MENU.flatMap((g) => g.items.map((i) => i.price)));
