"use client";

const UBER_WEB =
  "https://www.ubereats.com/do/store/kan-m-reposteria-y-catering/QOT7Ijk8VG2ghDALNJ_MKA";

function openUberAndroid() {
  const appUrl = "ubereats://store-browse-uuid/40e4fb22-393c-546d-a084-300b349fcc28?diningMode=DELIVERY";
  const start = Date.now();
  window.location.href = appUrl;
  setTimeout(() => {
    if (document.hasFocus() || Date.now() - start < 2000) {
      window.open(UBER_WEB, "_blank");
    }
  }, 1500);
}

function openUber() {
  if (typeof navigator === "undefined") { window.open(UBER_WEB, "_blank"); return; }
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    openUberAndroid();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    window.location.href = UBER_WEB;
  } else {
    window.open(UBER_WEB, "_blank");
  }
}

interface Props { variant?: "hero" | "card"; }

export default function DeliveryButtons({ variant = "hero" }: Props) {
  if (variant === "hero") {
    return (
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/80 font-medium">Pide a domicilio:</span>
        <button
          onClick={openUber}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold hover:opacity-80 transition cursor-pointer"
        >
          {/* Uber Eats: green circle U icon */}
          <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="none">
            <circle cx="10" cy="10" r="10" fill="#06C167"/>
            <text x="10" y="14.5" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">U</text>
          </svg>
          Uber Eats
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={openUber}
        className="glass rounded-2xl p-4 flex items-center gap-3 hover:shadow-soft transition-shadow w-full text-left cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 20 20" className="w-6 h-6" fill="none">
            <circle cx="10" cy="10" r="10" fill="#06C167"/>
            <text x="10" y="14.5" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">U</text>
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm">Uber Eats</div>
          <div className="text-xs text-muted-foreground">Pide tus postres en minutos</div>
        </div>
        <svg className="w-4 h-4 text-muted-foreground ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
