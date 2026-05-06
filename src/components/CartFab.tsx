"use client";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export default function CartFab() {
  const { totalItems, open } = useCart();

  return (
    <button
      onClick={open}
      aria-label="Abrir carrito"
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        background: "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)",
        boxShadow: "0 4px 20px rgba(240,112,151,0.45)",
      }}
    >
      <ShoppingCart size={22} />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}
