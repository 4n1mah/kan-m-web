"use client";
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number | null;
  quantity: number;
  category: string;
  imageUrl: string;
};

export type RecentOrder = {
  code: string;
  total: number;
  items: CartItem[];
  createdAt: number;
};

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; product: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD":
      return { items: action.items };
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...action.product, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "SET_QTY":
      if (action.quantity <= 0)
        return { items: state.items.filter((i) => i.id !== action.id) };
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

const CART_KEY = "kanm_cart";
const CART_TTL = 48 * 60 * 60 * 1000; // 48 horas

const RECENT_KEY = "kanm_recent_orders";
const MAX_RECENT = 3;

function loadRecentOrders(): RecentOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentOrder[];
  } catch {
    return [];
  }
}

function saveRecentOrders(orders: RecentOrder[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(orders));
  } catch {}
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: CartItem[]; updatedAt?: number };
    if (!Array.isArray(parsed.items) || !parsed.updatedAt) return [];
    if (Date.now() - parsed.updatedAt > CART_TTL) {
      localStorage.removeItem(CART_KEY);
      return [];
    }
    return parsed.items;
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ items, updatedAt: Date.now() }));
  } catch {}
}

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  add: (product: Omit<CartItem, "quantity">) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  reorder: (items: CartItem[]) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  recentOrders: RecentOrder[];
  addRecentOrder: (order: RecentOrder) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Cargar desde localStorage después del primer render (evita hidration mismatch)
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved.length > 0) dispatch({ type: "LOAD", items: saved });
    setHydrated(true);
    setRecentOrders(loadRecentOrders());
  }, []);

  // Persistir en localStorage en cada cambio (solo después de hidratar)
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state.items);
  }, [state.items, hydrated]);

  // Toggle clase CSS en body para ocultar el WhatsApp FAB
  useEffect(() => {
    if (isOpen) document.body.classList.add("cart-open");
    else document.body.classList.remove("cart-open");
    return () => document.body.classList.remove("cart-open");
  }, [isOpen]);

  const add = useCallback(
    (product: Omit<CartItem, "quantity">) => dispatch({ type: "ADD", product }),
    []
  );
  const remove = useCallback(
    (id: string) => dispatch({ type: "REMOVE", id }),
    []
  );
  const setQuantity = useCallback(
    (id: string, quantity: number) => dispatch({ type: "SET_QTY", id, quantity }),
    []
  );
  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
    try { localStorage.removeItem(CART_KEY); } catch {}
  }, []);

  const reorder = useCallback((items: CartItem[]) => {
    dispatch({ type: "LOAD", items });
  }, []);

  const addRecentOrder = useCallback((order: RecentOrder) => {
    setRecentOrders(prev => {
      const updated = [order, ...prev.filter(o => o.code !== order.code)].slice(0, MAX_RECENT);
      saveRecentOrders(updated);
      return updated;
    });
  }, []);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = state.items.reduce(
    (s, i) => s + (i.price ?? 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        add,
        remove,
        setQuantity,
        clear,
        reorder,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        recentOrders,
        addRecentOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// Versión que retorna null en lugar de lanzar error.
// Útil para componentes que se usan tanto dentro como fuera del CartProvider.
export function useCartOptional(): CartContextValue | null {
  return useContext(CartContext);
}
