// ─────────────────────────────────────────────────────────────
//  Diccionario de traducciones (ES / EN)
//  Fuente única de textos de la interfaz para el toggle de idioma.
//  El español es la base (tipo de referencia); el inglés DEBE tener
//  exactamente las mismas claves — TypeScript lo obliga (const en: Dict).
//
//  Cómo agregar textos:
//   1. Agrega la clave en el objeto `es`.
//   2. Agrega la MISMA clave en `en` con la traducción.
//   3. Úsala en el componente con `const { t } = useLang();`  → t.seccion.clave
//
//  Las FAQs en español se leen de src/lib/bizInfo.ts (fuente única de verdad
//  que también consume el bot); acá solo agregamos su versión en inglés.
// ─────────────────────────────────────────────────────────────

import { BUSINESS, LINKS, RULES, FAQS, LATICA } from "@/lib/bizInfo";

export type Lang = "es" | "en";

const es = {
  // Chrome global
  nav: {
    home: "Inicio",
    catalog: "Catálogo",
    catering: "Catering",
    latica: "La Latica",
    about: "Nosotros",
    faq: "FAQ",
    quote: "Cotizar",
    menu: "Menú",
    backToBakery: "· Volver a la repostería",
    langLabel: "Cambiar idioma",
  },
  delivery: {
    orderDelivery: "Pide a domicilio:",
    uberSubtitle: "Pide tus postres en minutos",
    whatsappAria: "Chatear por WhatsApp",
  },
  footer: {
    tagline:
      "Repostería artesanal y catering boutique. Endulzamos los momentos que más importan, con amor y detalle.",
    explore: "Explorar",
    contact: "Contacto",
    home: "Inicio",
    catalog: "Catálogo",
    catering: "Catering",
    latica: "La Latica",
    empanadoteca: "Empanadoteca",
    about: "Nosotros",
  },

  // Home
  home: {
    heroBadge: "Repostería Artesanal y Café",
    heroPre: "Endulzamos",
    heroMid1: "tus",
    heroWord1: "dias",
    heroMid2: "y tus",
    heroWord2: "eventos",
    heroSubtitle:
      "Pasteles artesanales, postres exclusivos y mesas dulces personalizadas para bodas, cumpleaños y eventos especiales en todo Santo Domingo. Ubicados en la Zona Colonial.",
    ctaQuote: "Cotizar",
    ctaWriteUs: "Escríbenos",
    ctaViewCatalog: "Ver catálogo",
    ctaContact: "Contáctanos",
    statEvents: "+500 eventos",
    statEventsSub: "endulzados con amor",
    featuredKicker: "Lo más pedido",
    featuredTitle: "Nuestras creaciones",
    viewAll: "Ver todos",
    cateringKicker: "para tu evento",
    cateringTitlePre: "Catering que",
    cateringTitleScript: "enamora",
    cateringItems: ["Bodas y compromisos", "Cumpleaños temáticos", "Eventos recreativos"],
    brunchTitle: "Brunch todo el dia, todos los dias",
    brunchCta: "Ver catálogo de Brunch",
    testimonialsKicker: "testimonios",
    testimonialsTitle: "Experiencias reales de clientes",
    googleReviews: "Google Reviews",
    seeAllReviews: "· Ver todas las reseñas",
    reviewBadge: "Google Review",
    marquee:
      "Bodas · Cumpleaños · Brunch · Mesas dulces · Picaderas · Catering corporativo · ",
    finalKicker: "hagamos algo especial",
    finalTitlePre: "Hagamos juntos",
    finalTitleScript: "tu evento",
    finalSubtitle:
      "Cuéntanos qué imaginas y lo creamos. Cada detalle, cada sabor, hecho a tu medida. Completa la cotización y nuestro equipo te contactará para confirmar disponibilidad.",
    finalCtaWhatsapp: "Escríbenos por WhatsApp",
  },

  // FAQ
  faq: {
    kicker: "Resolvemos tus dudas",
    title: "Preguntas frecuentes",
    subtitle:
      "Todo lo que necesitas saber antes de hacer tu pedido. ¿No encuentras tu respuesta? Escríbenos directamente.",
    ctaTitle: "¿Tienes otra pregunta?",
    ctaSubtitle: "Nuestro equipo responde rápido por WhatsApp.",
    ctaWhatsapp: "Escribir por WhatsApp",
    ctaQuote: "Cotizar mi evento",
    // ES = fuente de verdad (bizInfo). Solo proyectamos { q, a } para el render.
    items: FAQS.map(({ q, a }) => ({ q, a })),
  },

  // Nosotros
  about: {
    kicker: "nuestra historia",
    titlePre: "Pasión por lo",
    titleScript: "artesanal",
    p1: "Kan M nació del amor por crear momentos memorables a través de la repostería. Cada pastel, cada postre, cada mesa dulce es elaborada con ingredientes seleccionados y un toque de cariño que se siente en cada bocado.",
    p2: "Más de 500 eventos endulzados nos respaldan: bodas, cumpleaños, brunches corporativos y celebraciones íntimas en toda República Dominicana.",
    values: [
      { title: "Artesanal", desc: "Recetas propias, ingredientes frescos." },
      { title: "Personalizado", desc: "Diseñamos según tu visión y tema." },
      { title: "Detallista", desc: "Cuidamos cada elemento del montaje." },
    ],
    scheduleLabel: "Horario de atención",
    scheduleDays1: "Lunes a Jueves",
    scheduleDays2: "Viernes a Domingo",
  },

  // Sección de contacto (dentro de Nosotros)
  contact: {
    kicker: "conversemos",
    title: "Contáctanos",
    subtitle:
      "Estamos aquí para hacer tu evento especial. Encuéntranos en tus plataformas favoritas.",
    findUsHere: "Encuéntranos aquí",
    labelLocation: "Ubicación",
    labelPhone: "Teléfono",
    labelEmail: "Email",
    labelWhatsapp: "WhatsApp",
    whatsappValue: "Escríbenos directo",
    labelInstagram: "Instagram",
    labelTiktok: "TikTok",
    orderDelivery: "Pide a domicilio",
    or: "o",
    ctaKicker: "sin compromiso",
    ctaTitle: "¡Mejor dinos qué quieres y cotiza desde ahora!",
    ctaSubtitle:
      "Completa el formulario en menos de 2 minutos y nuestro equipo te respondera para endulzar tu proximo evento.",
    ctaButton: "Cotizar ahora",
    ctaButtonWhatsapp: "Escríbenos por WhatsApp",
    ctaFootnote: "Respuesta en menos de 24 horas · Sin compromiso",
  },

  // Catering
  catering: {
    heroBadge: "✦ Repostería artesanal · Eventos · Catering",
    heroKicker: "para tus eventos",
    heroTitlePre: "Catering que",
    heroTitleScript: "enamora",
    heroSubtitle1: "Diseñamos experiencias dulces a medida de tu evento,",
    heroSubtitle2: "con productos artesanales y servicio impecable.",
    heroChips: ["Pasteles", "Bodas", "Mesa de dulces", "Cumpleaños", "Eventos"],
    ctaQuote: "Cotizar",
    ctaWriteUs: "Escríbenos",
    expandHint: "Ver",
    zoomTitle: "Clic para ver en grande",
    services: [
      {
        title: "Pasteles personalizados",
        desc: "Diseñamos el pastel de tus sueños desde cero: tamaño, sabor, relleno y decoración a tu gusto. Cada detalle pensado para hacer ese momento inolvidable.",
        bullets: ["Diseño exclusivo para ti", "Sabores y rellenos a elección", "Desde una talla hasta varios pisos"],
      },
      {
        title: "Bodas",
        desc: "Mesas dulces personalizadas, pasteles de varios pisos y detalles que marcan el día más importante.",
        bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
      },
      {
        title: "Mesa de dulces",
        desc: "Postres artesanales y diseños exclusivos que endulzan tus momentos especiales.",
        bullets: ["Variedad gourmet", "Decoración temática", "Montaje incluido"],
      },
      {
        title: "Cumpleaños",
        desc: "Temáticas, sabores y presentaciones únicas para celebrar a quienes amas.",
        bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
      },
      {
        title: "Eventos recreativos",
        desc: "Baby showers, graduaciones, coffee breaks y catering boutique con atención al detalle.",
        bullets: ["Asesoría personalizada", "Diseño a tu temática", "Montaje y servicio"],
      },
    ],
  },

  // La Latica
  latica: {
    heroBadge: "Nuevo · producto estrella",
    heroKicker: "el antojo del momento",
    tagline: LATICA.tagline as string,
    priceLabel: "Precio",
    ctaWhatsapp: "Pídela por WhatsApp",
    photoComingSoon: "Foto próximamente",
    conceptoKicker: "¿qué es?",
    conceptoTitle: "Cuchara hasta el fondo",
    conceptoText:
      "Postres en lata pensados para disfrutar sin complicaciones: abres, tomas la cuchara y llegas hasta el fondo. Capas cremosas, textura suave y ese sabor casero de Kan M en un formato listo para llevar.",
    features: [
      { title: "Fáciles de comer", desc: "Ábrela y disfruta con cuchara, donde quieras." },
      { title: "Capas cremosas", desc: "Textura suave hasta el último bocado." },
      { title: "Listas para llevar", desc: "Perfectas para regalar o darte el gusto." },
    ],
    galleryKicker: "para antojarte",
    galleryTitle: "Nuestras laticas",
    gallerySubtitle: "Un vistazo a lo que te espera. Pronto más sabores y presentaciones.",
    finalKicker: "no te quedes con las ganas",
    finalTitle: "Pide tu Latica hoy",
    finalPricePre: "Solo",
    finalPriceSuf: "· disponible por WhatsApp y Uber Eats.",
    viewInCatalog: "Ver en el catálogo",
  },

  // Empanadoteca
  empanadoteca: {
    heroKicker: "las mejores empanadas de RD",
    subtitle: "Tradicionales · Venezolanas · Catibías",
    cookingTitle: "Estamos cocinando esta página…",
    cookingText:
      "🥟 ¡Mantente al tanto! Muy pronto podrás ver nuestro menú de empanadas aquí mismo. Mientras tanto, síguenos y visítanos.",
    directions: "Cómo llegar",
    backTo: "Volver a",
  },

  // Catálogo
  catalog: {
    kicker: "nuestro catálogo",
    title: "Creaciones Kan M",
    subtitle:
      "Explora nuestra colección de pasteles, postres, mesas de dulces y picaderas para eventos.",
    categories: [
      { id: "all", label: "Todo" },
      { id: "cakes", label: "Pasteles" },
      { id: "desserts", label: "Postres" },
      { id: "events", label: "Mesa de dulces" },
      { id: "picaderas", label: "Picaderas para eventos" },
      { id: "brunch", label: "Brunch" },
      { id: "drinks", label: "Bebidas" },
      { id: "laticas", label: "Laticas" },
    ],
    emptyTitle: "No hay productos en esta categoría aún.",
    emptySub: "Vuelve pronto — siempre estamos horneando algo nuevo.",
    loading: "Cargando…",
    bannerOrderTitle: "Ordena aquí",
    bannerOrderDesc:
      "Para pedidos rápidos del catálogo. Agrégalos al carrito, transfiere y recoge en el local.",
    bannerQuoteTitle: "Cotiza por aquí",
    bannerQuoteDesc:
      "Para pasteles personalizados, mesas dulces, bodas y catering de eventos. Te respondemos en menos de 24h.",
  },

  // Tarjeta de producto
  product: {
    outOfStock: "No disponible",
    priceFrom: "Desde",
    added: "¡Agregado!",
    inCart: "En el carrito",
    addToCart: "Agregar al carrito",
    orderInCatalog: "Ordenar en el catálogo",
    requestQuote: "Solicitar cotización",
    comingSoonMsg: "Vuelve pronto — disponible próximamente",
    categoryLabels: {
      cakes: "Pasteles",
      desserts: "Postres",
      events: "Mesa de dulces",
      picaderas: "Picaderas",
      brunch: "Brunch",
      drinks: "Bebidas",
      laticas: "Laticas",
    } as Record<string, string>,
  },

  // Página "muy pronto"
  comingSoon: {
    kicker: "muy pronto",
    catalogTitle: "Nuestro catálogo en línea está en preparación",
    catalogMessage:
      "Estamos horneando algo especial. Mientras tanto, escríbenos por WhatsApp y con gusto te mostramos lo que tenemos disponible.",
    quotesTitle: "Las cotizaciones en línea llegan pronto",
    quotesMessage:
      "Muy pronto podrás cotizar tu evento desde aquí. Mientras tanto, escríbenos por WhatsApp y te atendemos al momento.",
    ctaWhatsapp: "Escríbenos por WhatsApp",
    ctaContact: "Contáctanos",
  },

  // Carrito / checkout
  cart: {
    openCart: "Abrir carrito",
    stepCart: "Carrito",
    stepInfo: "Tu pedido",
    stepPayment: "Pago",
    stepSuccess: "¡Listo!",
    emptyTitle: "Tu carrito está vacío",
    emptySub: "Agrega productos desde el catálogo para comenzar tu pedido.",
    recentOrders: "Órdenes recientes",
    itemSingular: "producto",
    itemPlural: "productos",
    checking: "Consultando…",
    viewStatus: "Ver estado →",
    statusError: "No se pudo obtener el estado.",
    connectionError: "Error de conexión.",
    reorder: "Pedir de nuevo",
    statusPending: "Pendiente de revisión",
    statusConfirmed: "Confirmada",
    statusDenied: "No procesada",
    statusSent: "Enviada",
    priceOnRequest: "Precio a consultar",
    each: "c/u",
    subtotalLabel: "Subtotal",
    remove: "Eliminar",
    pickupNotice:
      "Las órdenes realizadas por la página son únicamente para pasar a recoger en el local. No tenemos delivery disponible para este tipo de orden.",
    order: "Ordenar →",
    pickupTitle: "Pasar a recoger en el local",
    pickupDesc:
      "Las órdenes realizadas por la página son únicamente para pasar a recoger. No tenemos delivery disponible para este tipo de orden.",
    nameLabel: "Tu nombre *",
    namePlaceholder: "Nombre completo",
    phoneLabel: "Teléfono *",
    phoneError: "Ingresa un número dominicano válido, ejemplo: 809-519-5688.",
    continueToPayment: "Continuar al pago →",
    totalToTransfer: "Total a transferir",
    transferExact: "Transfiere el monto exacto",
    transferToAccounts: "Transfiere a una de estas cuentas",
    transferInstructions:
      "Transfiere el monto exacto de tu orden y luego sube el comprobante para que podamos validar tu pedido.",
    savingsAccount: "Cuenta de ahorro",
    accountHolder: "Titular",
    idNumber: "Cédula",
    receiptLabel: "Comprobante de pago *",
    uploaded: "Subido",
    changeImage: "Cambiar imagen",
    uploading: "Subiendo…",
    uploadReceipt: "Subir foto del comprobante",
    fileHint: "JPG, PNG, HEIC — máx. 10MB",
    sendingOrder: "Enviando orden…",
    confirmOrder: "Confirmar orden",
    orderReceived: "¡Orden recibida!",
    confirmedTotal: "Total confirmado",
    exactAmountNote: "Asegúrate de que tu transferencia sea por este monto exacto.",
    successCodePre: "Tu código es ",
    successCodeSuf: ". Revisaremos tu comprobante y te contactaremos si necesitamos confirmar algo.",
    close: "Cerrar",
    uploadFailed: "Error al subir el comprobante.",
    receiptRequired: "Debes subir el comprobante antes de confirmar.",
    submitFailed: "Error al enviar la orden. Intenta de nuevo.",
  },

  // Cotizar (formulario de cotización)
  quote: {
    badge: "Cotización sin compromiso",
    title: "Cotiza tu evento",
    subtitle: "Cuéntanos qué imaginas. Te contactamos en menos de 24 horas.",
    step1: "Tus datos",
    fullName: "Nombre completo",
    namePlaceholder: "Tu nombre",
    phoneLabel: "WhatsApp / Teléfono",
    phoneError: "Ingresa un número dominicano válido, ejemplo: 809-555-6666.",
    emailLabel: "Correo",
    optional: "(opcional)",
    step2: "Tu evento",
    typeLabel: "Tipo",
    dateLabel: "Fecha",
    leadTimeNote: "Mínimo 3 días de antelación",
    deliveryTimeLabel: "Hora de entrega",
    guestsLabel: "Personas",
    guestsPlaceholder: "ej. 50",
    deliveryMethodLabel: "Método de entrega",
    pickupOption: "🏠 Recogida en tienda",
    deliveryOption: "🚗 Delivery / Envío",
    deliveryCostNote: "El delivery / envío tiene un costo adicional desde RD$250.00.",
    step3: "¿Qué te interesa?",
    step3Note: "Los pasteles pedirán detalles adicionales",
    editTitle: "Editar",
    colorsLabel: "Colores:",
    priceToQuote: "Precio a cotizar",
    step4: "Imágenes de inspiración",
    step4Note: "Sube hasta 5 fotos de referencia (opcional)",
    addImages: "Agregar imágenes de referencia",
    addMore: "Agregar más",
    step5: "Notas adicionales",
    notesPlaceholder: "Cuéntanos tu idea, colores, sabores, inspiración...",
    submit: "Enviar cotización",
    sending: "Enviando...",
    requiredNote:
      "Los campos * son obligatorios· Te contactamos por WhatsApp en menos de 24 horas.",
    successTitle: "¡Solicitud enviada!",
    successMsgPre: "Recibimos tu encargo, ",
    successMsgSuf: ". Te contactaremos por Whatsapp en unos momentos.",
    summaryEvent: "Evento:",
    summaryDate: "Fecha:",
    anotherQuote: "Hacer otra cotización",
    uploadingPhotoPre: "Subiendo foto ",
    uploadingPhotoMid: " de ",
    savingOrder: "Guardando pedido…",
    errNetworkPre: "Error de red al subir foto ",
    errNetworkSuf: ". Verifica tu conexión.",
    errSaveOrder: "Error al guardar el pedido",
    errGeneric: "Ocurrió un error. Por favor intenta de nuevo.",
    selectDate: "Selecciona una fecha",
    yearLabel: "Año:",
    cancel: "Cancelar",
    clear: "Limpiar",
    selectTime: "Selecciona una hora",
    save: "Guardar",
    months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    dateLocale: "es-ES",
    eventTypeLabels: {
      "Cumpleaños": "Cumpleaños",
      "Boda / Compromiso": "Boda / Compromiso",
      "Baby shower": "Baby shower",
      "Corporativo": "Corporativo",
      "Graduación": "Graduación",
      "Quinceañera": "Quinceañera",
      "Otro": "Otro",
    } as Record<string, string>,
    categoryLabels: {
      "Pasteles": "Pasteles",
      "Postres": "Postres",
      "Mesa dulce": "Mesa dulce",
      "Brunch / Catering": "Brunch / Catering",
    } as Record<string, string>,
    categoryNotes: {
      "Postres": "La cantidad y presentación se ajustan según tu evento.",
      "Mesa dulce": "La composición se personaliza según el número de personas y la temática.",
      "Brunch / Catering": "El menú se define en base a tus necesidades y tipo de evento.",
    } as Record<string, string>,
    itemLabels: {
      "Pastel personalizado": "Pastel personalizado",
      "Naked cake": "Naked cake",
      "Drip cake": "Drip cake",
      "Pastel de bodas": "Pastel de bodas",
      "Macarons": "Macarons",
      "Brownies": "Brownies",
      "Alfajores": "Alfajores",
      "Cheesecake": "Cheesecake",
      "Mesa dulce completa": "Mesa dulce completa",
      "Mesa de postres mini": "Mesa de postres mini",
      "Brunch para grupo": "Brunch para grupo",
      "Catering de evento": "Catering de evento",
    } as Record<string, string>,
  },
};

// El tipo del diccionario lo define el español (la base).
export type Dict = typeof es;

// El inglés debe cumplir el MISMO shape. Si falta o sobra una clave, TS falla.
const en: Dict = {
  nav: {
    home: "Home",
    catalog: "Catalog",
    catering: "Catering",
    latica: "La Latica",
    about: "About",
    faq: "FAQ",
    quote: "Get a quote",
    menu: "Menu",
    backToBakery: "· Back to the bakery",
    langLabel: "Change language",
  },
  delivery: {
    orderDelivery: "Order delivery:",
    uberSubtitle: "Get your desserts in minutes",
    whatsappAria: "Chat on WhatsApp",
  },
  footer: {
    tagline:
      "Artisan bakery and boutique catering. We sweeten the moments that matter most, with love and detail.",
    explore: "Explore",
    contact: "Contact",
    home: "Home",
    catalog: "Catalog",
    catering: "Catering",
    latica: "La Latica",
    empanadoteca: "Empanadoteca",
    about: "About",
  },

  home: {
    heroBadge: "Artisan Bakery & Café",
    heroPre: "We sweeten",
    heroMid1: "your",
    heroWord1: "days",
    heroMid2: "and your",
    heroWord2: "events",
    heroSubtitle:
      "Artisan cakes, exclusive desserts and custom dessert tables for weddings, birthdays and special events across Santo Domingo. Located in the Colonial Zone.",
    ctaQuote: "Get a quote",
    ctaWriteUs: "Write to us",
    ctaViewCatalog: "View catalog",
    ctaContact: "Contact us",
    statEvents: "+500 events",
    statEventsSub: "sweetened with love",
    featuredKicker: "Most requested",
    featuredTitle: "Our creations",
    viewAll: "View all",
    cateringKicker: "for your event",
    cateringTitlePre: "Catering that",
    cateringTitleScript: "captivates",
    cateringItems: ["Weddings & engagements", "Themed birthdays", "Recreational events"],
    brunchTitle: "Brunch all day, every day",
    brunchCta: "View Brunch menu",
    testimonialsKicker: "testimonials",
    testimonialsTitle: "Real customer experiences",
    googleReviews: "Google Reviews",
    seeAllReviews: "· See all reviews",
    reviewBadge: "Google Review",
    marquee:
      "Weddings · Birthdays · Brunch · Dessert tables · Party platters · Corporate catering · ",
    finalKicker: "let's make something special",
    finalTitlePre: "Let's create",
    finalTitleScript: "your event",
    finalSubtitle:
      "Tell us what you imagine and we'll create it. Every detail, every flavor, made to measure. Fill out the quote and our team will contact you to confirm availability.",
    finalCtaWhatsapp: "Message us on WhatsApp",
  },

  faq: {
    kicker: "We answer your questions",
    title: "Frequently asked questions",
    subtitle:
      "Everything you need to know before ordering. Can't find your answer? Message us directly.",
    ctaTitle: "Have another question?",
    ctaSubtitle: "Our team replies quickly on WhatsApp.",
    ctaWhatsapp: "Message on WhatsApp",
    ctaQuote: "Get a quote for my event",
    items: [
      {
        q: "What are your business hours?",
        a: "Monday to Thursday from 9:00 AM to 7:00 PM. Friday to Sunday from 9:00 AM to 10:00 PM.",
      },
      {
        q: "Where are you located?",
        a: `We're at ${BUSINESS.address}. Find us here: ${BUSINESS.mapsUrl}`,
      },
      {
        q: "How can I receive my order?",
        a:
          `You have three options:\n` +
          `1) Free pickup at ${BUSINESS.address}.\n` +
          `2) Our own delivery from a minimum of RD$${RULES.deliveryMinAmountRD}; the cost varies by distance.\n` +
          `3) Order for delivery through ${LINKS.uberEats}.`,
      },
      {
        q: "How do I place an order?",
        a:
          `It's very simple: place your order at least ${RULES.minLeadDays} days in advance, ` +
          `message us on WhatsApp at ${BUSINESS.phoneDisplay} ` +
          `and arrange your quote with our bakers.`,
      },
      {
        q: "Do you make custom cakes?",
        a: `Absolutely! Themed designs, edible photos, colors and flavors to your taste. Tell us what you have in mind and we'll send you a quote.`,
      },
      {
        q: "How far in advance should I order?",
        a:
          `For regular orders we ask for a minimum of ${RULES.minLeadDays} days. ` +
          `For large events (weddings, themed birthdays), 1 to 2 weeks. ` +
          `The sooner you tell us, the easier we can secure availability and customization.`,
      },
      {
        q: "What payment methods do you accept?",
        a:
          `We accept bank transfer, cash and credit/debit card. ` +
          `For events we ask for a ${RULES.eventDepositPercent}% deposit upon confirmation and the rest at delivery. ` +
          `For your safety, we never send account numbers over WhatsApp; once you confirm the order, the team shares the details through the proper channel.`,
      },
      {
        q: "Are you on Uber Eats?",
        a: `Yes. Order for delivery here: ${LINKS.uberEats}.`,
      },
      {
        q: "Do you have gluten-free or vegan options?",
        a:
          `Yes, we offer gluten-free and vegan options on several products. ` +
          `Since it depends on the product and the date, I'll connect you with the team so they can guide you with what we have available for you.`,
      },
      {
        q: "Do you do catering or corporate events?",
        a:
          `Yes, we do catering for social and corporate events. ` +
          `The price is quoted based on the type of event, number of guests and chosen menu. ` +
          `Start your quote through our WhatsApp: ${BUSINESS.phoneDisplay}.`,
      },
    ],
  },

  about: {
    kicker: "our story",
    titlePre: "A passion for the",
    titleScript: "handmade",
    p1: "Kan M was born from a love of creating memorable moments through baking. Every cake, every dessert, every dessert table is made with hand-picked ingredients and a touch of care you can taste in every bite.",
    p2: "More than 500 sweetened events back us up: weddings, birthdays, corporate brunches and intimate celebrations across the Dominican Republic.",
    values: [
      { title: "Handmade", desc: "Our own recipes, fresh ingredients." },
      { title: "Custom", desc: "We design around your vision and theme." },
      { title: "Detail-oriented", desc: "We care for every element of the setup." },
    ],
    scheduleLabel: "Business hours",
    scheduleDays1: "Monday to Thursday",
    scheduleDays2: "Friday to Sunday",
  },

  contact: {
    kicker: "let's talk",
    title: "Contact us",
    subtitle:
      "We're here to make your event special. Find us on your favorite platforms.",
    findUsHere: "Find us here",
    labelLocation: "Location",
    labelPhone: "Phone",
    labelEmail: "Email",
    labelWhatsapp: "WhatsApp",
    whatsappValue: "Message us directly",
    labelInstagram: "Instagram",
    labelTiktok: "TikTok",
    orderDelivery: "Order delivery",
    or: "or",
    ctaKicker: "no commitment",
    ctaTitle: "Better yet, tell us what you want and get a quote now!",
    ctaSubtitle:
      "Fill out the form in under 2 minutes and our team will get back to you to sweeten your next event.",
    ctaButton: "Get a quote now",
    ctaButtonWhatsapp: "Message us on WhatsApp",
    ctaFootnote: "Reply within 24 hours · No commitment",
  },

  catering: {
    heroBadge: "✦ Artisan bakery · Events · Catering",
    heroKicker: "for your events",
    heroTitlePre: "Catering that",
    heroTitleScript: "captivates",
    heroSubtitle1: "We design sweet experiences tailored to your event,",
    heroSubtitle2: "with artisan products and impeccable service.",
    heroChips: ["Cakes", "Weddings", "Dessert table", "Birthdays", "Events"],
    ctaQuote: "Get a quote",
    ctaWriteUs: "Write to us",
    expandHint: "View",
    zoomTitle: "Click to enlarge",
    services: [
      {
        title: "Custom cakes",
        desc: "We design the cake of your dreams from scratch: size, flavor, filling and decoration to your taste. Every detail thought out to make that moment unforgettable.",
        bullets: ["A design exclusively for you", "Flavors and fillings of your choice", "From a single tier to several"],
      },
      {
        title: "Weddings",
        desc: "Custom dessert tables, multi-tier cakes and details that make the most important day.",
        bullets: ["Personalized guidance", "Design to your theme", "Setup and service"],
      },
      {
        title: "Dessert table",
        desc: "Artisan desserts and exclusive designs that sweeten your special moments.",
        bullets: ["Gourmet variety", "Themed decoration", "Setup included"],
      },
      {
        title: "Birthdays",
        desc: "Themes, flavors and unique presentations to celebrate the ones you love.",
        bullets: ["Personalized guidance", "Design to your theme", "Setup and service"],
      },
      {
        title: "Recreational events",
        desc: "Baby showers, graduations, coffee breaks and boutique catering with attention to detail.",
        bullets: ["Personalized guidance", "Design to your theme", "Setup and service"],
      },
    ],
  },

  latica: {
    heroBadge: "New · signature product",
    heroKicker: "the craving of the moment",
    tagline: "Desserts in a can, easy to open and eat with a spoon all the way to the bottom.",
    priceLabel: "Price",
    ctaWhatsapp: "Order it on WhatsApp",
    photoComingSoon: "Photo coming soon",
    conceptoKicker: "what is it?",
    conceptoTitle: "Spoon to the bottom",
    conceptoText:
      "Desserts in a can made to enjoy with no fuss: open it, grab a spoon and reach the bottom. Creamy layers, smooth texture and that homemade Kan M flavor in a ready-to-go format.",
    features: [
      { title: "Easy to eat", desc: "Open it and enjoy with a spoon, wherever you are." },
      { title: "Creamy layers", desc: "Smooth texture down to the last bite." },
      { title: "Ready to go", desc: "Perfect to gift or to treat yourself." },
    ],
    galleryKicker: "to tempt you",
    galleryTitle: "Our laticas",
    gallerySubtitle: "A glimpse of what's waiting for you. More flavors and presentations soon.",
    finalKicker: "don't miss out",
    finalTitle: "Order your Latica today",
    finalPricePre: "Only",
    finalPriceSuf: "· available on WhatsApp and Uber Eats.",
    viewInCatalog: "View in catalog",
  },

  empanadoteca: {
    heroKicker: "the best empanadas in the DR",
    subtitle: "Traditional · Venezuelan · Catibías",
    cookingTitle: "We're cooking up this page…",
    cookingText:
      "🥟 Stay tuned! Very soon you'll be able to see our empanada menu right here. In the meantime, follow us and come visit.",
    directions: "Directions",
    backTo: "Back to",
  },

  catalog: {
    kicker: "our catalog",
    title: "Kan M Creations",
    subtitle:
      "Explore our collection of cakes, desserts, dessert tables and party platters for events.",
    categories: [
      { id: "all", label: "All" },
      { id: "cakes", label: "Cakes" },
      { id: "desserts", label: "Desserts" },
      { id: "events", label: "Dessert table" },
      { id: "picaderas", label: "Party platters" },
      { id: "brunch", label: "Brunch" },
      { id: "drinks", label: "Drinks" },
      { id: "laticas", label: "Laticas" },
    ],
    emptyTitle: "No products in this category yet.",
    emptySub: "Check back soon — we're always baking something new.",
    loading: "Loading…",
    bannerOrderTitle: "Order here",
    bannerOrderDesc:
      "For quick catalog orders. Add them to the cart, transfer and pick up at the shop.",
    bannerQuoteTitle: "Get a quote here",
    bannerQuoteDesc:
      "For custom cakes, dessert tables, weddings and event catering. We reply within 24h.",
  },

  product: {
    outOfStock: "Unavailable",
    priceFrom: "From",
    added: "Added!",
    inCart: "In cart",
    addToCart: "Add to cart",
    orderInCatalog: "Order in the catalog",
    requestQuote: "Request a quote",
    comingSoonMsg: "Check back soon — available soon",
    categoryLabels: {
      cakes: "Cakes",
      desserts: "Desserts",
      events: "Dessert table",
      picaderas: "Platters",
      brunch: "Brunch",
      drinks: "Drinks",
      laticas: "Laticas",
    } as Record<string, string>,
  },

  comingSoon: {
    kicker: "coming soon",
    catalogTitle: "Our online catalog is in preparation",
    catalogMessage:
      "We're baking something special. In the meantime, message us on WhatsApp and we'll gladly show you what we have available.",
    quotesTitle: "Online quotes are coming soon",
    quotesMessage:
      "Very soon you'll be able to quote your event from here. In the meantime, message us on WhatsApp and we'll help you right away.",
    ctaWhatsapp: "Message us on WhatsApp",
    ctaContact: "Contact us",
  },

  cart: {
    openCart: "Open cart",
    stepCart: "Cart",
    stepInfo: "Your order",
    stepPayment: "Payment",
    stepSuccess: "Done!",
    emptyTitle: "Your cart is empty",
    emptySub: "Add products from the catalog to start your order.",
    recentOrders: "Recent orders",
    itemSingular: "item",
    itemPlural: "items",
    checking: "Checking…",
    viewStatus: "View status →",
    statusError: "Couldn't get the status.",
    connectionError: "Connection error.",
    reorder: "Order again",
    statusPending: "Pending review",
    statusConfirmed: "Confirmed",
    statusDenied: "Not processed",
    statusSent: "Sent",
    priceOnRequest: "Price on request",
    each: "each",
    subtotalLabel: "Subtotal",
    remove: "Remove",
    pickupNotice:
      "Orders placed through the website are for pickup at the shop only. We don't offer delivery for this type of order.",
    order: "Order →",
    pickupTitle: "Pick up at the shop",
    pickupDesc:
      "Orders placed through the website are for pickup only. We don't offer delivery for this type of order.",
    nameLabel: "Your name *",
    namePlaceholder: "Full name",
    phoneLabel: "Phone *",
    phoneError: "Enter a valid Dominican number, e.g. 809-519-5688.",
    continueToPayment: "Continue to payment →",
    totalToTransfer: "Total to transfer",
    transferExact: "Transfer the exact amount",
    transferToAccounts: "Transfer to one of these accounts",
    transferInstructions:
      "Transfer the exact amount of your order and then upload the receipt so we can validate your order.",
    savingsAccount: "Savings account",
    accountHolder: "Account holder",
    idNumber: "ID",
    receiptLabel: "Payment receipt *",
    uploaded: "Uploaded",
    changeImage: "Change image",
    uploading: "Uploading…",
    uploadReceipt: "Upload receipt photo",
    fileHint: "JPG, PNG, HEIC — max. 10MB",
    sendingOrder: "Sending order…",
    confirmOrder: "Confirm order",
    orderReceived: "Order received!",
    confirmedTotal: "Confirmed total",
    exactAmountNote: "Make sure your transfer is for this exact amount.",
    successCodePre: "Your code is ",
    successCodeSuf: ". We'll review your receipt and contact you if we need to confirm anything.",
    close: "Close",
    uploadFailed: "Error uploading the receipt.",
    receiptRequired: "You must upload the receipt before confirming.",
    submitFailed: "Error sending the order. Please try again.",
  },

  quote: {
    badge: "Free quote, no commitment",
    title: "Quote your event",
    subtitle: "Tell us what you imagine. We'll contact you within 24 hours.",
    step1: "Your details",
    fullName: "Full name",
    namePlaceholder: "Your name",
    phoneLabel: "WhatsApp / Phone",
    phoneError: "Enter a valid Dominican number, e.g. 809-555-6666.",
    emailLabel: "Email",
    optional: "(optional)",
    step2: "Your event",
    typeLabel: "Type",
    dateLabel: "Date",
    leadTimeNote: "Minimum 3 days in advance",
    deliveryTimeLabel: "Delivery time",
    guestsLabel: "Guests",
    guestsPlaceholder: "e.g. 50",
    deliveryMethodLabel: "Delivery method",
    pickupOption: "🏠 Store pickup",
    deliveryOption: "🚗 Delivery / Shipping",
    deliveryCostNote: "Delivery / shipping has an additional cost from RD$250.00.",
    step3: "What are you interested in?",
    step3Note: "Cakes will ask for extra details",
    editTitle: "Edit",
    colorsLabel: "Colors:",
    priceToQuote: "Price to be quoted",
    step4: "Inspiration images",
    step4Note: "Upload up to 5 reference photos (optional)",
    addImages: "Add reference images",
    addMore: "Add more",
    step5: "Additional notes",
    notesPlaceholder: "Tell us your idea, colors, flavors, inspiration...",
    submit: "Send quote",
    sending: "Sending...",
    requiredNote:
      "Fields marked * are required · We'll contact you on WhatsApp within 24 hours.",
    successTitle: "Request sent!",
    successMsgPre: "We received your request, ",
    successMsgSuf: ". We'll contact you on WhatsApp shortly.",
    summaryEvent: "Event:",
    summaryDate: "Date:",
    anotherQuote: "Make another quote",
    uploadingPhotoPre: "Uploading photo ",
    uploadingPhotoMid: " of ",
    savingOrder: "Saving order…",
    errNetworkPre: "Network error uploading photo ",
    errNetworkSuf: ". Check your connection.",
    errSaveOrder: "Error saving the order",
    errGeneric: "An error occurred. Please try again.",
    selectDate: "Select a date",
    yearLabel: "Year:",
    cancel: "Cancel",
    clear: "Clear",
    selectTime: "Select a time",
    save: "Save",
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dateLocale: "en-US",
    eventTypeLabels: {
      "Cumpleaños": "Birthday",
      "Boda / Compromiso": "Wedding / Engagement",
      "Baby shower": "Baby shower",
      "Corporativo": "Corporate",
      "Graduación": "Graduation",
      "Quinceañera": "Quinceañera",
      "Otro": "Other",
    } as Record<string, string>,
    categoryLabels: {
      "Pasteles": "Cakes",
      "Postres": "Desserts",
      "Mesa dulce": "Dessert table",
      "Brunch / Catering": "Brunch / Catering",
    } as Record<string, string>,
    categoryNotes: {
      "Postres": "Quantity and presentation adjust to your event.",
      "Mesa dulce": "The composition is customized to the number of guests and the theme.",
      "Brunch / Catering": "The menu is defined based on your needs and type of event.",
    } as Record<string, string>,
    itemLabels: {
      "Pastel personalizado": "Custom cake",
      "Naked cake": "Naked cake",
      "Drip cake": "Drip cake",
      "Pastel de bodas": "Wedding cake",
      "Macarons": "Macarons",
      "Brownies": "Brownies",
      "Alfajores": "Alfajores",
      "Cheesecake": "Cheesecake",
      "Mesa dulce completa": "Full dessert table",
      "Mesa de postres mini": "Mini dessert table",
      "Brunch para grupo": "Group brunch",
      "Catering de evento": "Event catering",
    } as Record<string, string>,
  },
};

export const DICT: Record<Lang, Dict> = { es, en };
