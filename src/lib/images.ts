/**
 * ============================================================
 *  CÓMO CAMBIAR LAS FOTOS DE LA PÁGINA
 * ============================================================
 *
 *  OPCIÓN A — Subir desde el admin (recomendado):
 *    1. Ve a /admin/dashboard y sube la foto
 *    2. Cloudinary te devuelve una URL como:
 *       https://res.cloudinary.com/dsvcag6oo/image/upload/v.../kanm/foto.jpg
 *    3. Copia esa URL y pégala abajo en el campo que quieras cambiar
 *    4. Haz git push para que el cambio aparezca en la web
 *
 *  OPCIÓN B — Subir directamente a Cloudinary:
 *    1. cloudinary.com → Media Library → Upload
 *    2. Copia la URL y pégala abajo
 *
 *  NOTA: Para el carrusel del inicio, agrega o quita URLs del array heroCarousel.
 * ============================================================
 */

export const IMAGES = {

  // ── INICIO — CARRUSEL DE FONDO ───────────────────────────
  // Agrega más URLs al array para más fotos en el carrusel (cambian cada 4 segundos)
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

  // ── CATERING ─────────────────────────────────────────────
  cateringBodas:     "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900",
  cateringCumple:    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900",
  cateringEventos:   "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900",
  cateringPasteles:  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900",
};
