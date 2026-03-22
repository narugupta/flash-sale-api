"use client";
import { useState, useEffect } from "react";
import { getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import Navbar from "../components/Navbar";

function TimerBlock({ value, label }) {
  return (
    <div className="flex flex-col items-center bg-white/[0.05] rounded-xl px-3 py-1.5 min-w-[48px]">
      <span className="text-2xl font-black text-white leading-none" style={{ fontFamily: "'Syne',sans-serif" }}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[0.55rem] uppercase tracking-wider text-white/30 mt-0.5">{label}</span>
    </div>
  );
}

function useCountdown(initialSeconds) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60];
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [h, m, s] = useCountdown(2 * 3600 + 47 * 60 + 22);

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-[100px] right-[-50px] w-[400px] h-[400px] rounded-full bg-blue-600/[0.07] blur-[80px] pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-violet-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Live Sale
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.05] text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Flash{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Deals
            </span>
            <br />
            Drop Today
          </h1>
          <p className="text-white/30 text-sm font-light tracking-wide">
            Limited stock · Real-time inventory · Instant checkout
          </p>

          <div className="mt-6 inline-flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30">
              Sale ends in
            </p>
            <div className="flex items-center gap-1.5">
              <TimerBlock value={h} label="hrs" />
              <span className="text-xl font-bold text-white/20 mb-3">:</span>
              <TimerBlock value={m} label="min" />
              <span className="text-xl font-bold text-white/20 mb-3">:</span>
              <TimerBlock value={s} label="sec" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-white/10 border-t-violet-500 animate-spin" />
            <p className="text-white/30 text-sm">Loading deals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}