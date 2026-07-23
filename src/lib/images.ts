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
  homeCatering: "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777608859/_02A6188_1_aa4fi7.jpg",

  // ── NOSOTROS ─────────────────────────────────────────────
  nosotrosTeam: "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777610943/nosotro_odkh7u.png",

  // ── CATERING — una o varias fotos por sección ────────────
  cateringPasteles: [
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609637/pastel3_ggze5a.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609636/pastel1_dgbqr9.webp", 
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609635/pastel2_egdmn5.jpg", 
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
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777607822/INICIO1_nc3qkd.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609641/catering2_od2ayz.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609640/catering3_srcb9y.jpg", 
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777609639/catering4_zkwv73.jpg",
    "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777608859/_02A6188_1_aa4fi7.jpg",

  ],
  mesaDeDulces: [
  "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777607821/dulces5_ixexme.jpg",
  "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777607820/dulces1_afhihi.jpg",
  "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777607818/dulces2_hzjbxo.jpg",
  "https://res.cloudinary.com/dsvcag6oo/image/upload/q_auto/f_auto/v1777607820/Inicio4_pjbryu.jpg",
  ],

  // ── LA LATICA — postres en lata (producto estrella) ──────
  //  Fotos servidas desde /public/laticas. La PRIMERA es la destacada
  //  del hero. Para agregar/cambiar: sube el archivo a public/laticas/
  //  y edita este array (orden = orden en que aparecen en la galería).
  laticas: [
    "/laticas/1000518108.jpg", // destacada (hero)
    "/laticas/1000518130.jpg",
    "/laticas/1000518143.jpg",
    "/laticas/1000517919.jpg",
    "/laticas/1000518106.jpg",
    "/laticas/1000518151.jpg",
    "/laticas/1000518146.jpg",
    "/laticas/1000518136.jpg",
    "/laticas/1000518120.jpg",
  ] as string[],
};
