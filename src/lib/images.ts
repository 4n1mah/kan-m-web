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
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777569347/Inicio3_b6dnzx.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777569346/INICIO1_emkhx3.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777569345/Inicio2_kq9pez.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777507121/kanm/ykckfyzhnf4vvmhpzfri.jpg",

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
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568570/boda1_xdayyk.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568573/boda2_dqnsmn.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568571/Boda3_hyexsj.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568570/boda1_xdayyk.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777569047/boda4_kqvrtp.jpg",
  ],
  cateringCumple: [
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568570/cumple3_ryr4xa.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568570/cumple4_agt0wg.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568569/cumple2_rq3jwb.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777568569/cumple1_jsl6zw.jpg",
  ],
  cateringEventos: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900",
  ],
};
