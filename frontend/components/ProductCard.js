"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { getInventory, purchaseProduct, getOrders } from "../services/api";

const MAX_STOCK = 15;

export default function ProductCard({ product }) {
  const [stock, setStock] = useState(null);
  const [status, setStatus] = useState("");
  const orderPollInterval = useRef(null);

  const fetchStock = useCallback(async () => {
    try {
      const res = await getInventory(product.id);
      setStock(res.data.stock);
    } catch (e) {
      console.error("Failed to fetch stock for " + product.id, e);
    }
  }, [product.id]);

  useEffect(() => {
    fetchStock();
    const t = setInterval(fetchStock, 2000);
    return () => clearInterval(t);
  }, [fetchStock]);

  useEffect(() => {
    return () => {
      if (orderPollInterval.current) clearInterval(orderPollInterval.current);
    };
  }, []);

  const pollOrderStatus = (orderId) => {
    if (orderPollInterval.current) clearInterval(orderPollInterval.current);
    orderPollInterval.current = setInterval(async () => {
      try {
        const res = await getOrders();
        const order = res.data.find((o) => o.id === orderId);
        if (order && order.status === "CONFIRMED") {
          setStatus("confirmed");
          clearInterval(orderPollInterval.current);
        } else if (order && order.status === "FAILED") {
          setStatus("failed");
          clearInterval(orderPollInterval.current);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);
  };

  const handleBuy = async () => {
    try {
      setStatus("pending");
      const res = await purchaseProduct(1, product.id);
      pollOrderStatus(res.data.order_id);
      fetchStock();
    } catch {
      setStatus("failed");
    }
  };

  const isProcessing = status === "pending";
  const pct = stock === null ? 0 : Math.min(100, (stock / MAX_STOCK) * 100);

  const barColor =
    pct > 60
      ? "from-emerald-400 to-emerald-300"
      : pct > 25
      ? "from-amber-400 to-amber-300"
      : "from-red-400 to-red-300";

  const btnBase =
    "w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 tracking-wide";
  const btnStyle =
    stock === 0
      ? btnBase + " bg-white/[0.05] text-white/20 cursor-not-allowed"
      : isProcessing
      ? btnBase + " bg-violet-500/20 text-violet-400/80 cursor-not-allowed"
      : btnBase +
        " bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-900/30";

  const btnLabel =
    stock === 0 ? "Sold Out" : isProcessing ? "Processing..." : "Buy Now";

  const price = product.price.toLocaleString("en-IN");

  const stockBadgeClass =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold w-fit mb-3 border " +
    (stock > 0
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20");

  const stockDotClass =
    "w-1.5 h-1.5 rounded-full flex-shrink-0 " +
    (stock > 0
      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
      : "bg-red-400");

  return (
    <div className="group relative flex flex-col bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.16] hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.08),transparent_70%)]" />

      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/25 mb-1.5">
        {product.category || "Electronics"}
      </p>

      <h3
        className="text-base font-bold text-white leading-snug mb-2 line-clamp-2"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {product.name}
      </h3>

      <p className="text-2xl font-light text-white/90 mb-5 tracking-tight">
        <span className="text-sm align-super text-white/40 mr-0.5">Rs.</span>
        {price}
      </p>

      {stock !== null && (
        <div>
          <div className={stockBadgeClass}>
            <span className={stockDotClass} />
            {stock > 0 ? stock + " in stock" : "Out of stock"}
          </div>
          <div className="h-0.5 bg-white/[0.06] rounded-full mb-5 overflow-hidden">
            <div
              className={"h-full rounded-full bg-gradient-to-r " + barColor + " transition-all duration-500"}
              style={{ width: pct + "%" }}
            />
          </div>
        </div>
      )}

      <button onClick={handleBuy} disabled={stock === 0 || isProcessing} className={btnStyle}>
        {btnLabel}
      </button>

      <div className="h-7 mt-2.5 flex items-center justify-center">
        {status === "confirmed" && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
            Order confirmed
          </span>
        )}
        {status === "failed" && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-500/10 text-red-400">
            Purchase failed
          </span>
        )}
        {status === "pending" && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-violet-500/10 text-violet-400">
            Placing order...
          </span>
        )}
      </div>
    </div>
  );
}
