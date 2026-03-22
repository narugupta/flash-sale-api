"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";

const STATUS_STYLES = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_DOT = {
  CONFIRMED: "bg-emerald-400",
  PENDING: "bg-amber-400",
  FAILED: "bg-red-400",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8000/orders");
      setOrders(res.data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-violet-400 mb-2">
            Dashboard
          </p>
          <h1
            className="text-4xl font-black tracking-tight text-white"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            My Orders
          </h1>
          <p className="text-white/30 text-sm mt-1 font-light">
            Live updates every 5 seconds
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
            <p className="text-white/30 text-sm">Fetching orders...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <p className="text-white/40 text-sm">No orders yet. Go grab a deal!</p>
            <a
              href="/"
              className="mt-3 text-xs font-semibold text-violet-400 underline underline-offset-4"
            >
              Browse Live Deals
            </a>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const s = order.status ? order.status.toUpperCase() : "PENDING";
              const style = STATUS_STYLES[s] || STATUS_STYLES.PENDING;
              const dot = STATUS_DOT[s] || STATUS_DOT.PENDING;
              const label = s.charAt(0) + s.slice(1).toLowerCase();
              const orderId = "Order #" + String(order.id).padStart(5, "0");
              const productName = order.product_name || "Product #" + order.product_id;

              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div>
                    <p className="text-xs text-white/30 mb-0.5 font-medium">{orderId}</p>
                    <p
                      className="text-base font-bold text-white"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {productName}
                    </p>
                    {order.created_at && (
                      <p className="text-xs text-white/25 mt-0.5">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                  </div>

                  <div className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border " + style}>
                    <span className={"w-1.5 h-1.5 rounded-full flex-shrink-0 " + dot} />
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
