import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./cart.css";

const CartDrawer = () => {
    const navigate = useNavigate();
    const {
        items,
        totalCount,
        totalPrice,
        isOpen,
        closeCart,
        removeFromCart,
        updateQty,
        clearCart,
    } = useCart();

    const handleCheckout = () => {
        closeCart();
        navigate("/checkout/cart");
    };

    return (
        <>
            <div
                className={`sc-cart-overlay ${isOpen ? "open" : ""}`}
                onClick={closeCart}
            />

            <div className={`sc-cart-drawer ${isOpen ? "open" : ""}`}>
                <div className="sc-cart-header">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Cart ({totalCount})
                    </h5>
                    <button
                        type="button"
                        className="btn btn-sm btn-link text-muted p-0"
                        onClick={closeCart}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                        >
                            close
                        </span>
                    </button>
                </div>

                <div className="sc-cart-body">
                    {items.length === 0 ? (
                        <p className="text-muted small mt-2">Your cart is empty.</p>
                    ) : (
                        items.map((item) => (
                            <div key={item._id} className="sc-cart-item">
                                <div className="sc-cart-item-main">
                                    <div className="sc-cart-item-title">
                                        {item.title || item.product?.name}
                                    </div>
                                        <div className="text-muted small">
                                        {item.vendor?.business_name ||
                                            item.business_name ||
                                            item.vendor_name ||
                                            item.vendorName ||
                                            "Unknown Vendor"}
                                        </div>
                                    <div className="text-muted small">
                                        LKR {item.price?.toLocaleString()}
                                    </div>
                                </div>

                                <div className="sc-cart-item-actions">
                                    <div className="btn-group btn-group-sm me-2" role="group">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => updateQty(item._id, -1)}
                                        >
                                            -
                                        </button>
                                        <span className="sc-cart-qty-display">{item.qty}</span>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => updateQty(item._id, 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => removeFromCart(item._id)}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="sc-cart-footer">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted">Items Total</span>
                        <span className="fw-semibold">
                            LKR {totalPrice.toLocaleString()}
                        </span>
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm flex-grow-1"
                            disabled={!items.length}
                            onClick={clearCart}
                        >
                            Clear Cart
                        </button>
                        <button
                            type="button"
                            className="btn btn-success btn-sm flex-grow-1"
                            disabled={!items.length}
                            onClick={handleCheckout}
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CartDrawer;