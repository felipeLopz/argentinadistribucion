"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  talle: string;
  cantidad: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "cantidad"> & { cantidad?: number }) => void;
  removeItem: (productId: string, talle: string) => void;
  updateQuantity: (productId: string, talle: string, cantidad: number) => void;
  clearCart: () => void;
  justAdded: string | null;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "argentina-distributor-cart";

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full o privado — no hace nada */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* ─── Cargar desde localStorage al montar ─── */
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) setItems(stored);
    setHydrated(true);
  }, []);

  /* ─── Guardar en localStorage cada vez que cambia items ─── */
  useEffect(() => {
    if (!hydrated) return;           // no guardar hasta que se haya hidratado
    saveToStorage(items);
  }, [items, hydrated]);

  /* ─── Limpiar mensaje "justAdded" después de 2s ─── */
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(null), 2000);
    return () => clearTimeout(t);
  }, [justAdded]);

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.cantidad, 0);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "cantidad"> & { cantidad?: number }) => {
      const qty = newItem.cantidad ?? 1;
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === newItem.productId && i.talle === newItem.talle
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + qty };
          return copy;
        }
        return [...prev, { ...newItem, cantidad: qty }];
      });
      setJustAdded(newItem.name);
    },
    []
  );

  const removeItem = useCallback((productId: string, talle: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.talle === talle))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, talle: string, cantidad: number) => {
      if (cantidad <= 0) {
        removeItem(productId, talle);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.talle === talle
            ? { ...i, cantidad }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, []);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, justAdded }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}