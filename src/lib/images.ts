/**
 * ============================================================
 *  CÓMO CAMBIAR LAS FOTOS DEL SITIO
 * ============================================================
 *
 *  PASO 1 — Sube la foto a Cloudinary:
 *    Opción A: Ve a /admin/dashboard → sube desde ahí
 *    Opción B: cloudinary.com → Media Library → Upload
 *    → Copia la URL que empieza con https://res.cloudinary.com/...
 *
 *  PASO 2 — Pega la URL abajo en el campo que quieras cambiar
 *
 *  PASO 3 — git add . → git commit -m "fotos" → git push
 *
 * ── CARRUSEL DE CATERING ────────────────────────────────────
 *  Cada sección de catering puede tener VARIAS fotos.
 *  Solo agrega más URLs al array, ejemplo:
 *
 *    cateringBodas: [
 *      "https://res.cloudinary.com/.../boda1.jpg",
 *      "https://res.cloudinary.com/.../boda2.jpg",
 *      "https://res.cloudinary.com/.../boda3.jpg",
 *    ],
 *
 * ── CARRUSEL DEL INICIO ─────────────────────────────────────
 *  Igual — agrega o quita URLs del array heroCarousel.
 *  Cambian automáticamente cada 4 segundos.
 * ============================================================
 */

export const IMAGES = {

  // ── INICIO — Carrusel de fondo ───────────────────────────
  heroCarousel: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1400",
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1400",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1400",
  ],

  // ── INICIO — Sección catering ────────────────────────────
  homeCatering: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900",

  // ── NOSOTROS ─────────────────────────────────────────────
  nosotrosTeam: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900",

  // ── CATERING — una o varias fotos por sección ────────────
  cateringPasteles: [
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900",
  ],
  cateringBodas: [
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900",
  ],
  cateringCumple: [
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900",
  ],
  cateringEventos: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900",
  ],
};
