import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useReducer,
} from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "dakanak_cart_v1";

function reducer(state, action) {
    switch (action.type) {
        case "HYDRATE":
            return action.payload || [];
        case "ADD": {
            const existing = state.find((i) => i.key === action.item.key);
            if (existing) {
                return state.map((i) =>
                    i.key === action.item.key
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            }
            return [...state, { ...action.item, quantity: 1 }];
        }
        case "INC":
            return state.map((i) =>
                i.key === action.key ? { ...i, quantity: i.quantity + 1 } : i,
            );
        case "DEC":
            return state
                .map((i) =>
                    i.key === action.key
                        ? { ...i, quantity: i.quantity - 1 }
                        : i,
                )
                .filter((i) => i.quantity > 0);
        case "REMOVE":
            return state.filter((i) => i.key !== action.key);
        case "CLEAR":
            return [];
        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [items, dispatch] = useReducer(reducer, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) });
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {}
    }, [items]);

    const value = useMemo(() => {
        const totalQty = items.reduce((s, i) => s + i.quantity, 0);
        const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
        return {
            items,
            totalQty,
            totalPrice,
            add: (item) => dispatch({ type: "ADD", item }),
            inc: (key) => dispatch({ type: "INC", key }),
            dec: (key) => dispatch({ type: "DEC", key }),
            remove: (key) => dispatch({ type: "REMOVE", key }),
            clear: () => dispatch({ type: "CLEAR" }),
        };
    }, [items]);

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
