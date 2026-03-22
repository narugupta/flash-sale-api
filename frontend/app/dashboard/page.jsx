"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/Navbar";

// const PROMETHEUS = "http://localhost:9090";
// const GRAFANA = "http://localhost:3000";

const PROMETHEUS = "http://18.191.34.49:9090";
const GRAFANA = "http://18.191.34.49:3001";

async function promQuery(query) {
  try {
    const res = await fetch(
      PROMETHEUS + "/api/v1/query?query=" + encodeURIComponent(query)
    );
    const json = await res.json();
    const result = json?.data?.result;
    if (result && result.length > 0) return parseFloat(result[0].value[1]);
    return null;
  } catch {
    return null;
  }
}

async function promRange(query, minutes = 5) {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - minutes * 60;
    const res = await fetch(
      PROMETHEUS +
        "/api/v1/query_range?query=" +
        encodeURIComponent(query) +
        "&start=" + start +
        "&end=" + end +
        "&step=10"
    );
    const json = await res.json();
    const result = json?.data?.result;
    if (result && result.length > 0)
      return result[0].values.map(([t, v]) => ({ t, v: parseFloat(v) }));
    return [];
  } catch {
    return [];
  }
}

function AreaChart({ data, color = "#a78bfa", height = 64 }) {
  if (!data || data.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs font-medium text-white/20 bg-white/5 rounded-b-2xl"
        style={{ height }}
      >
        Waiting for data...
      </div>
    );
  }
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 400;
  const H = height;
  const pad = 4;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y];
  });
  const linePath = "M " + pts.map(([x, y]) => x + " " + y).join(" L ");
  const areaPath =
    linePath +
    " L " + pts[pts.length - 1][0] + " " + H +
    " L 0 " + H + " Z";
  const gradId = "ag" + color.replace(/[^a-z0-9]/gi, "");
  
  return (
    <div style={{ height, width: "100%", overflow: "hidden" }}>
      <svg
        viewBox={"0 0 " + W + " " + H}
        className="w-full drop-shadow-md"
        style={{ height: "100%", width: "100%", display: "block" }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={"url(#" + gradId + ")"} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function MetricCard({ label, value, unit, color, sparkData, sparkColor }) {
  return (
    <div className="group relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-zinc-800/50 rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 group-hover:text-white/60 transition-colors">
          {label}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-3xl md:text-4xl font-black tracking-tighter leading-none"
            style={{ color: color || "#fff", fontFamily: "'Syne', sans-serif" }}
          >
            {value !== null && value !== undefined ? value : "—"}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-white/30">{unit}</span>
          )}
        </div>
      </div>
      <div className="mt-auto opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        {sparkData ? (
          <AreaChart data={sparkData} color={sparkColor || color || "#a78bfa"} height={64} />
        ) : (
          <div className="pb-6" />
        )}
      </div>
    </div>
  );
}

function SimCard({ label, value, color }) {
  return (
    <div className="bg-black/40 border border-white/5 rounded-xl p-4 min-w-0 flex flex-col justify-center items-center text-center">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/40 mb-2 truncate w-full">
        {label}
      </p>
      <p
        className="text-2xl font-black leading-none tabular-nums tracking-tight"
        style={{ color, fontFamily: "'Syne', sans-serif" }}
      >
        {typeof value === "number" ? value.toLocaleString() : (value || "0")}
      </p>
    </div>
  );
}

function LoadTestPanel({ onSimulate }) {
  const [users, setUsers] = useState(50);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const intervalRef = useRef(null);
  const logRef = useRef(null);

  const addLog = useCallback((msg, type = "info") => {
    const time = new Date().toLocaleTimeString("en-IN", { hour12: false });
    // Increased the slice from -99 to -500 so you can keep more history to scroll through!
    setLog((prev) => [...prev.slice(-500), { time, msg, type }]);
  }, []);

  const startSimulation = () => {
    setRunning(true);
    addLog("Load test started — " + users + " simulated users", "success");
    addLog("Target: POST http://localhost:8000/purchase", "info");

    let count = 0, success = 0, failed = 0, rateLimited = 0;

    intervalRef.current = setInterval(async () => {
      const batchSize = Math.max(1, Math.ceil(users / 10));
      const promises = Array.from({ length: batchSize }, async () => {
        const userId = Math.floor(Math.random() * 10000) + 1;
        const productId = Math.floor(Math.random() * 8) + 1;
        try {
          const res = await fetch((process.env.NEXT_PUBLIC_API || "http://localhost:8000") + "/purchase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({ user_id: userId, product_id: productId }),
          });
          count++;
          if (res.status === 200) {
            success++;
            if (success % 5 === 0)
              addLog("[OK]  u=" + userId + " p=" + productId, "success");
          } else if (res.status === 429) {
            rateLimited++;
            if (rateLimited % 8 === 0)
              addLog("[429] rate limited u=" + userId, "warn");
          } else {
            failed++;
            if (failed % 5 === 0)
              addLog("[" + res.status + "] failed u=" + userId, "error");
          }
          onSimulate && onSimulate({ count, success, failed, rateLimited });
        } catch {
          failed++;
          count++;
          addLog("[ERR] network error u=" + userId, "error");
          onSimulate && onSimulate({ count, success, failed, rateLimited });
        }
      });
      await Promise.all(promises);
    }, 1000);
  };

  const stopSimulation = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    addLog("Load test stopped.", "warn");
  };

  // Auto-scroll to the bottom whenever a new log is added
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const logColors = {
    info: "text-blue-300",
    success: "text-emerald-400",
    warn: "text-amber-400",
    error: "text-rose-400",
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-6 h-full shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Load Test Control
            <span style={{ fontSize: "1.25rem" }}>🚀</span>
          </h2>
          <p className="text-xs text-white/40 mt-1 font-medium">Stress test your API endpoints</p>
        </div>
        <div
          className={
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border shadow-inner " +
            (running
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-black/50 text-white/40 border-white/10")
          }
        >
          <span
            className={
              "w-2 h-2 rounded-full flex-shrink-0 " +
              (running ? "bg-emerald-400 animate-pulse" : "bg-white/20")
            }
          />
          {running ? "TESTING ACTIVE" : "IDLE"}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <label className="text-sm font-semibold text-white/60 uppercase tracking-wider">Target Load</label>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-black text-violet-400 tracking-tighter"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {users}
            </span>
            <span className="text-xs font-medium text-white/30">users/sec</span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={200}
          step={1}
          value={users}
          onChange={(e) => setUsers(Number(e.target.value))}
          disabled={running}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-xs font-medium text-white/20 px-1">
          <span>1</span><span>50</span><span>100</span><span>150</span><span>200</span>
        </div>
      </div>

      <button
        onClick={running ? stopSimulation : startSimulation}
        className={
          "w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 shadow-lg " +
          (running
            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-white/10")
        }
      >
        {running ? "Stop Simulation" : "Initialize Load Test"}
      </button>

      <div className="flex flex-col flex-1 border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a] shadow-inner mt-2">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border-b border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          <span className="ml-2 text-[0.6rem] font-medium text-white/20 uppercase tracking-widest">
            test-runner.log
          </span>
        </div>
        
        {/* 🔥 THE FIX IS HERE: Added custom scrollbar classes */}
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-1 text-xs [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace", minHeight: "14rem", maxHeight: "18rem" }}
        >
          {log.length === 0 && (
            <div className="flex items-center gap-2 text-white/20 italic">
              <span className="animate-pulse">_</span>
              Waiting for execution...
            </div>
          )}
          {log.map((entry, i) => (
            <div key={i} className="flex gap-3 min-w-0 w-full hover:bg-white/5 px-1 rounded transition-colors">
              <span className="text-white/30 flex-shrink-0 tabular-nums">
                [{entry.time}]
              </span>
              <span
                className={
                  "leading-relaxed min-w-0 break-words overflow-hidden font-medium " +
                  (logColors[entry.type] || "text-white/40")
                }
                style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
              >
                {entry.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalRequests: null,
    rps: null,
    latencyP99: null,
    ordersProcessed: null,
    paymentSuccess: null,
    paymentFailure: null,
    queueDepth: null,
  });
  const [sparklines, setSparklines] = useState({});
  const [simStats, setSimStats] = useState(null);
  const [promOk, setPromOk] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    const totalReq = await promQuery("http_requests_total");
    setPromOk(totalReq !== null);

    const [rps, latency, orders, success, failure, queue] = await Promise.all([
      promQuery("rate(http_requests_total[1m])"),
      promQuery("histogram_quantile(0.99, rate(http_request_latency_seconds_bucket[1m]))"),
      promQuery("orders_processed_total"),
      promQuery("order_payment_success_total"),
      promQuery("order_payment_failure_total"),
      promQuery("rabbitmq_queue_depth"),
    ]);

    setMetrics({
      totalRequests: totalReq !== null ? Math.round(totalReq) : null,
      rps: rps !== null ? rps.toFixed(2) : null,
      latencyP99: latency !== null ? (latency * 1000).toFixed(0) : null,
      ordersProcessed: orders !== null ? Math.round(orders) : null,
      paymentSuccess: success !== null ? Math.round(success) : null,
      paymentFailure: failure !== null ? Math.round(failure) : null,
      queueDepth: queue !== null ? Math.round(queue) : null,
    });

    const [rpsRange, latencyRange, ordersRange] = await Promise.all([
      promRange("rate(http_requests_total[1m])"),
      promRange("histogram_quantile(0.99, rate(http_request_latency_seconds_bucket[1m]))"),
      promRange("orders_processed_total"),
    ]);
    setSparklines({ rps: rpsRange, latency: latencyRange, orders: ordersRange });
    setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour12: false }));
  }, []);

  useEffect(() => {
    fetchMetrics();
    const t = setInterval(fetchMetrics, 5000);
    return () => clearInterval(t);
  }, [fetchMetrics]);

  const successRate =
    metrics.paymentSuccess !== null && metrics.ordersProcessed
      ? ((metrics.paymentSuccess / metrics.ordersProcessed) * 100).toFixed(1)
      : null;

  const latencyColor =
    metrics.latencyP99 === null ? "#fff"
    : Number(metrics.latencyP99) > 500 ? "#f43f5e"
    : Number(metrics.latencyP99) > 200 ? "#f59e0b"
    : "#10b981";

  const successRateColor =
    successRate === null ? "#fff"
    : Number(successRate) >= 90 ? "#10b981"
    : Number(successRate) >= 70 ? "#f59e0b"
    : "#f43f5e";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* Background Grid - Hardcoded opacity so it doesn't blow out */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: 0.02,
        }}
      />
      
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] rounded-full bg-violet-600 blur-[120px] pointer-events-none z-0" style={{ width: 500, height: 500, opacity: 0.15 }} />
      <div className="fixed bottom-[-10%] right-[-5%] rounded-full bg-blue-600 blur-[120px] pointer-events-none z-0" style={{ width: 400, height: 400, opacity: 0.1 }} />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[0.65rem] font-bold uppercase tracking-widest">
                System Monitor
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/40">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                Auto-refresh 5s
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight drop-shadow-sm"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Live Telemetry
            </h1>
            {lastUpdated && (
              <p className="text-white/30 text-sm font-medium mt-1 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Last sync: {lastUpdated}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div
              className={
                "flex-1 md:flex-none inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border shadow-sm transition-colors " +
                (promOk === null
                  ? "bg-white/5 text-white/40 border-white/10"
                  : promOk
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20")
              }
            >
              <span
                className={
                  "w-2 h-2 rounded-full flex-shrink-0 " +
                  (promOk === null ? "bg-white/30" : promOk ? "bg-emerald-400 animate-pulse" : "bg-rose-400")
                }
              />
              {promOk === null ? "Connecting..." : promOk ? "Prometheus Online" : "Prometheus Offline"}
            </div>

            <a
              href={GRAFANA}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Grafana
            </a>
          </div>
        </div>

        {/* Traffic Section */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-white/10 flex-1"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Core Traffic</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Total Requests" value={metrics.totalRequests !== null ? metrics.totalRequests.toLocaleString() : null} color="#a855f7" sparkData={sparklines.rps} sparkColor="#a855f7" />
            <MetricCard label="Throughput" value={metrics.rps} unit="req/s" color="#3b82f6" sparkData={sparklines.rps} sparkColor="#3b82f6" />
            <MetricCard label="P99 Latency" value={metrics.latencyP99} unit="ms" color={latencyColor} sparkData={sparklines.latency} sparkColor={latencyColor} />
            <MetricCard label="RabbitMQ Queue" value={metrics.queueDepth} unit="msgs" color="#f59e0b" />
          </div>
        </section>

        {/* Orders Section */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-white/10 flex-1"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Transaction Health</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard label="Orders Processed" value={metrics.ordersProcessed !== null ? metrics.ordersProcessed.toLocaleString() : null} color="#a855f7" sparkData={sparklines.orders} sparkColor="#a855f7" />
            <MetricCard label="Payments Verified" value={metrics.paymentSuccess !== null ? metrics.paymentSuccess.toLocaleString() : null} color="#10b981" />
            <MetricCard label="Payments Failed" value={metrics.paymentFailure !== null ? metrics.paymentFailure.toLocaleString() : null} color="#f43f5e" />
            <MetricCard label="Success Rate" value={successRate} unit="%" color={successRateColor} />
          </div>
        </section>

        {/* Load Test & Grafana Grid */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-white/10 flex-1"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">System Stress & Visualization</h2>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2">
              <LoadTestPanel onSimulate={setSimStats} />
            </div>

            <div className="flex flex-col gap-6">
              {/* Simulation Results Mini-Dashboard */}
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-5 flex items-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  Live Run Metrics
                </h3>
                {simStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <SimCard label="Requests Sent" value={simStats.count} color="#fff" />
                    <SimCard label="200 OK" value={simStats.success} color="#34d399" />
                    <SimCard label="429 Limit" value={simStats.rateLimited} color="#fbbf24" />
                    <SimCard label="5xx Failed" value={simStats.failed} color="#f43f5e" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center bg-black/20 rounded-xl border border-dashed border-white/10">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">⏳</div>
                    <p className="text-sm font-medium text-white/30 px-4">
                      Initialize load test for real-time metrics.
                    </p>
                  </div>
                )}
              </div>

              {/* Grafana Embed */}
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                    Grafana Panel
                  </h3>
                  <a href={GRAFANA} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline">
                    Expand
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#111217] relative" style={{ height: 220 }}>
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-mono">
                    Loading dashboard...
                  </div>
                  <iframe src={GRAFANA + "/d/flash-sale/flash-sale-dashboard?orgId=1&refresh=5s&kiosk=tv&theme=dark"} className="w-full h-full relative z-10" style={{ border: "none" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}