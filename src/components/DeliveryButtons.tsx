"use client";

const UBER_WEB = "https://www.ubereats.com/do/store/kan-m-reposteria-y-catering/QOT7Ijk8VG2ghDALNJ_MKA";
const UBER_APP = "ubereats://restaurant?storeUUID=44ecfb82-393c-546d-8438-300b49df2ca8";

const PEDIDOS_WEB = "https://www.pedidosya.com.do/restaurantes/santo-domingo-d.n./kan-m-reposteria-y-catering-bc836e83-e25b-4ce0-a580-015108a4b79f-menu?origin=shop_list";
const PEDIDOS_APP = "pedidosya://restaurant/bc836e83-e25b-4ce0-a580-015108a4b79f";

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function openDelivery(appUrl: string, webUrl: string) {
  if (isMobile()) {
    // Try to open app; fall back to web after 1.5s if app not installed
    const start = Date.now();
    window.location.href = appUrl;
    setTimeout(() => {
      if (Date.now() - start < 2000) window.open(webUrl, "_blank");
    }, 1500);
  } else {
    window.open(webUrl, "_blank");
  }
}

interface Props {
  variant?: "hero" | "card"; // hero = small inline, card = full card
}

export default function DeliveryButtons({ variant = "hero" }: Props) {
  if (variant === "hero") {
    return (
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">Pide a domicilio:</span>
        <button
          onClick={() => openDelivery(UBER_APP, UBER_WEB)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:opacity-80 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
            <path d="M4 9h6v7a6 6 0 0012 0V9h-2v7a4 4 0 01-8 0V9H4z"/>
          </svg>
          Uber Eats
        </button>
        <button
          onClick={() => openDelivery(PEDIDOS_APP, PEDIDOS_WEB)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FA3C52] text-white text-xs font-medium hover:opacity-80 transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="2.5"/>
            <circle cx="12" cy="12" r="3.5" fill="white"/>
          </svg>
          PedidosYa
        </button>
      </div>
    );
  }

  // card variant - used in contacto
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => openDelivery(UBER_APP, UBER_WEB)}
        className="bg-card rounded-2xl border border-[var(--border)]/60 shadow-card p-4 flex items-center gap-3 hover:shadow-soft transition-shadow w-full text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
            <path d="M4 9h6v7a6 6 0 0012 0V9h-2v7a4 4 0 01-8 0V9H4z"/>
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm">Uber Eats</div>
          <div className="text-xs text-muted-foreground">Pide tus postres en minutos</div>
        </div>
        <svg className="w-4 h-4 text-muted-foreground ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <button
        onClick={() => openDelivery(PEDIDOS_APP, PEDIDOS_WEB)}
        className="bg-card rounded-2xl border border-[var(--border)]/60 shadow-card p-4 flex items-center gap-3 hover:shadow-soft transition-shadow w-full text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FA3C52] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="2.5"/>
            <circle cx="12" cy="12" r="3.5" fill="white"/>
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm">PedidosYa</div>
          <div className="text-xs text-muted-foreground">Delivery rápido a tu puerta</div>
        </div>
        <svg className="w-4 h-4 text-muted-foreground ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
