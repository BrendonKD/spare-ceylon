import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const CartContext = createContext();
const SHIPPING_PER_VENDOR = 900;
const API = "http://localhost:5000";

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const getToken = () => localStorage.getItem("token");
    const isLoggedIn = () => !!getToken();

    // Normalize cart items from ANY source (guest product, DB item, etc)
    const normalizeCartItem = useCallback((product) => {
        // Extract vendorId - try multiple possible field names
        const vendorId =
            product.vendor?._id ||
            product.vendor?.userId ||
            product.vendor_id?._id ||
            product.vendor_id?.vendor_id ||
            product.vendor_id ||
            product.vendorId ||
            "unknown-vendor";

        const business_name =
            product.business_name ||
            product.vendor?.business_name ||
            product.vendor_name ||
            product.vendorName ||
            "Unknown Vendor";

        // Extract product name
        const productName =
            product.productName ||
            product.product?.name ||
            product.product_id?.name ||
            product.title ||
            "";

        return {
        ...product,
        vendorId,
        business_name,
        vendorName: business_name,
        vendor_name: business_name,
        productName,
        price: product.price ?? product.price_at_added ?? 0,
        qty: product.qty || 1,
        };
    }, []);

    // Map DB cart response to item structure
    const mapDbCartToItems = useCallback(
        (cart) => {
            return (cart.items || []).map((item) =>
                normalizeCartItem({
                    _id: item.vendor_listing_id,
                    title: item.title,
                    image_url: item.image_url,
                    condition: item.condition,
                    price: item.price_at_added,
                    qty: item.qty,
                    vendor_id: item.vendor_id,
                    business_name: item.vendor_name,
                    vendorName: item.vendor_name,
                    vendor_name: item.vendor_name,
                })
            );
        },
        [normalizeCartItem]
    );

    // Load guest cart from localStorage
    const loadGuestCart = useCallback(() => {
        try {
            const stored = localStorage.getItem("sc_cart");
            if (stored) {
                const parsed = JSON.parse(stored);
                const normalizedStored = Array.isArray(parsed)
                    ? parsed.map(normalizeCartItem)
                    : [];
                setItems(normalizedStored);
            } else {
                setItems([]);
            }
        } catch (e) {
            console.error("Failed to parse cart from localStorage", e);
            setItems([]);
        }
    }, [normalizeCartItem]);

    // Load cart from database
    const loadDbCart = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API}/api/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to load DB cart");

            const cart = await res.json();
            setItems(mapDbCartToItems(cart));
        } catch (err) {
            console.error("Error loading DB cart:", err);
            loadGuestCart();
        }
    }, [mapDbCartToItems, loadGuestCart]);

    // Initial load: determine if user is logged in
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            loadDbCart();
        } else {
            loadGuestCart();
        }
    }, [loadDbCart, loadGuestCart]);

    // Save guest cart to localStorage (only when not logged in)
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            localStorage.setItem("sc_cart", JSON.stringify(items));
        }
    }, [items]);

    const addToCart = async (product) => {
        const normalized = normalizeCartItem(product);

        if (isLoggedIn()) {
            try {
                const token = getToken();
                const res = await fetch(`${API}/api/cart/add`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        listingId: normalized._id,
                        qty: 1,
                    }),
                });

                if (!res.ok) throw new Error("Failed to add item to DB cart");

                const cart = await res.json();
                setItems(mapDbCartToItems(cart));
            } catch (err) {
                console.error("DB addToCart failed:", err);
            }
        } else {
            setItems((prev) => {
                const existing = prev.find((p) => p._id === normalized._id);
                if (existing) {
                    return prev.map((p) =>
                        p._id === normalized._id ? { ...p, qty: p.qty + 1 } : p
                    );
                }
                return [...prev, { ...normalized, qty: 1 }];
            });
        }
        setIsOpen(true);
    };

    const removeFromCart = async (id) => {
        if (isLoggedIn()) {
            try {
                const token = getToken();
                const res = await fetch(`${API}/api/cart/item/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                const cart = await res.json();
                setItems(mapDbCartToItems(cart));
            } catch (err) {
                console.error("DB removeFromCart failed:", err);
            }
        } else {
            setItems((prev) => prev.filter((p) => p._id !== id));
        }
    };

    const updateQty = async (id, delta) => {
        if (isLoggedIn()) {
            const current = items.find((p) => p._id === id);
            if (!current) return;
            const nextQty = Math.max(1, current.qty + delta);
            try {
                const token = getToken();
                const res = await fetch(`${API}/api/cart/item/${id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ qty: nextQty }),
                });
                const cart = await res.json();
                setItems(mapDbCartToItems(cart));
            } catch (err) {
                console.error("DB updateQty failed:", err);
            }
        } else {
            setItems((prev) =>
                prev.map((p) =>
                    p._id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p
                )
            );
        }
    };

    const clearCart = async () => {
        if (isLoggedIn()) {
            try {
                const token = getToken();
                await fetch(`${API}/api/cart/clear`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                setItems([]);
            } catch (err) {
                console.error("DB clearCart failed:", err);
            }
        } else {
            setItems([]);
        }
    };

    const toggleCart = () => setIsOpen((o) => !o);
    const openCart = () => setIsOpen(true);
    const closeCart = () => setIsOpen(false);

    const totalCount = items.reduce((sum, it) => sum + it.qty, 0);
    const totalPrice = items.reduce((sum, it) => sum + (it.price || 0) * it.qty, 0);

    const getGroupedCart = () => {
        const groups = {};

        items.forEach((item) => {
            const vendorId = item.vendorId || "unknown-vendor";
            // Use business_name consistently
            const business_name = item.business_name || item.vendorName || item.vendor_name || "Unknown Vendor";

            if (!groups[vendorId]) {
                groups[vendorId] = {
                    vendorId,
                    vendorName: business_name, // For UI display
                    items: [],
                    subtotal: 0,
                    shippingFee: SHIPPING_PER_VENDOR,
                    total: 0,
                };
            }

            const lineSubtotal = (item.price || 0) * item.qty;
            groups[vendorId].items.push(item);
            groups[vendorId].subtotal += lineSubtotal;
        });

        Object.values(groups).forEach((group) => {
            group.total = group.subtotal + group.shippingFee;
        });

        return Object.values(groups);
    };

    const getCartSummary = () => {
        const grouped = getGroupedCart();
        const subtotal = grouped.reduce((sum, g) => sum + g.subtotal, 0);
        const shipping = grouped.reduce((sum, g) => sum + g.shippingFee, 0);
        const total = subtotal + shipping;

        return { grouped, subtotal, shipping, total, vendorCount: grouped.length };
    };

    return (
        <CartContext.Provider
            value={{
                items,
                totalCount,
                totalPrice,
                isOpen,
                addToCart,
                removeFromCart,
                updateQty,
                clearCart,
                toggleCart,
                openCart,
                closeCart,
                getGroupedCart,
                getCartSummary,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);