"use client";
import { usePathname } from "next/navigation";
import { waLink, WA_MESSAGES } from "@/lib/whatsapp";

export default function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <a
      href={waLink(WA_MESSAGES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="whatsapp-fab pulse-ring fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-rose shadow-soft flex items-center justify-center text-white hover:scale-105 hover:shadow-glow transition-all duration-200"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.93 11.93 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.83 11.83 0 0 0 5.65 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.45zM12.05 21.3h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.79.99 1.01-3.69-.22-.38a9.42 9.42 0 0 1-1.45-5.07c0-5.21 4.24-9.45 9.45-9.45 2.52 0 4.89.98 6.67 2.77a9.39 9.39 0 0 1 2.77 6.68c0 5.22-4.24 9.46-9.3 9.46zm5.18-7.07c-.28-.14-1.67-.83-1.93-.92-.26-.1-.45-.14-.64.14-.19.28-.74.92-.91 1.11-.17.19-.34.21-.62.07-.28-.14-1.18-.43-2.25-1.39-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.5.14-.17.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.55-.46-.48-.64-.49l-.55-.01c-.19 0-.49.07-.74.35-.26.28-.97.95-.97 2.32 0 1.37.99 2.69 1.13 2.88.14.19 1.95 2.97 4.72 4.16.66.29 1.18.46 1.58.59.66.21 1.27.18 1.74.11.53-.08 1.67-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33z"/>
      </svg>
    </a>
  );
}
