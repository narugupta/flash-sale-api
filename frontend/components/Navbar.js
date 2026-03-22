"use client";
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm">
            ⚡
          </div>
          <span
            className="font-black text-2xl tracking-tighter bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            FlashBuy
          </span>
        </a>

        <ul className="hidden sm:flex items-center gap-8 list-none m-0 p-0">
          <li>
            <a href="/" className="text-white/40 hover:text-white/90 text-sm font-medium transition-colors no-underline">
              Live Deals
            </a>
          </li>
          <li>
            <a href="/orders" className="text-white/40 hover:text-white/90 text-sm font-medium transition-colors no-underline">
              My Orders
            </a>
          </li>
          <li>
  <a href="/dashboard" className="text-white/40 hover:text-white/90 text-sm font-medium transition-colors no-underline">
    Dashboard
  </a>
</li>
        </ul>

        <button className="rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white transition-all">
          Sign in
        </button>
      </div>
    </nav>
  );
}
