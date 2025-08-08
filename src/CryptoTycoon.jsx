import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ===== Game Config =====
const COINS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "ADA", name: "Cardano" },
];
const STARTING_CASH = 10000;
const TICK_MS = 900;

// ===== Utils =====
function useClockTick(intervalMs) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}

function randomWalkPrice(prev, drift = 0.0005, vol = 0.012) {
  const shock = (Math.random() * 2 - 1) * vol;
  const step = 1 + drift + shock;
  return parseFloat(Math.max(0.01, prev * step).toFixed(2));
}

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

// ===== Improved Avatar Art (clickable) =====
function PlayerAvatar({ name = "Guest", onClick }) {
  const hue = hashToHue(name || "Guest");
  const shirt = `hsl(${(hue + 210) % 360} 70% 55%)`;
  const chair = `hsl(${(hue + 30) % 360} 15% 35%)`;
  const hair = `hsl(${(hue + 300) % 360} 25% 20%)`;
  return (
    <div
      role="button"
      onClick={onClick}
      className="relative w-[18rem] h-[18rem] mx-auto select-none cursor-pointer group"
      title="Click to continue"
    >
      {/* SVG avatar art */}
      <svg viewBox="0 0 220 220" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
        <defs>
          <radialGradient id="glow" cx="60%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.35" />
          </filter>
        </defs>
        <rect x="0" y="0" width="220" height="220" fill="url(#glow)" />
        <rect x="0" y="170" width="220" height="18" fill="#cbd5e1" />
        <g filter="url(#shadow)">
          <rect x="120" y="76" width="78" height="52" rx="7" fill="#1f2937" />
          <rect x="125" y="81" width="68" height="42" rx="5" className="fill-slate-900 animate-pulse" />
          <rect x="38" y="84" width="70" height="44" rx="6" fill="#111827" />
          <rect x="42" y="88" width="62" height="36" rx="4" className="fill-slate-900 animate-pulse" />
        </g>
        <rect x="25" y="112" width="18" height="48" rx="4" fill={chair} />
        <path d="M66 56 q18 -18 36 0 v10 h-36 z" fill={hair} />
        <circle cx="84" cy="68" r="20" fill="#fcd34d" />
        <g>
          <rect x="74" y="66" width="6" height="2" className="fill-slate-900 animate-[blink_4s_infinite]" />
          <rect x="92" y="66" width="6" height="2" className="fill-slate-900 animate-[blink_4s_infinite_0.2s]" />
        </g>
        <path d="M78 77 q6 5 12 0" stroke="#7c2d12" strokeWidth="2" fill="none" />
        <rect x="64" y="88" width="40" height="46" rx="10" fill={shirt} />
        <g className="origin-[84px_122px] animate-[tap_0.6s_ease-in-out_infinite]">
          <rect x="56" y="112" width="28" height="10" rx="5" fill="#fcd34d" />
        </g>
        <g className="origin-[98px_122px] animate-[tap2_0.6s_ease-in-out_infinite]">
          <rect x="84" y="112" width="28" height="10" rx="5" fill="#fcd34d" />
        </g>
        <rect x="102" y="156" width="60" height="10" rx="4" fill="#94a3b8" />
        <g>
          <rect x="168" y="156" width="14" height="10" rx="2" fill="#e5e7eb" />
          <rect x="180" y="158" width="4" height="6" rx="1" fill="#e5e7eb" />
          <path d="M172 152 q2 -6 6 0" stroke="#e5e7eb" strokeWidth="1.5" fill="none" className="animate-[steam_2.5s_ease-in-out_infinite]" />
        </g>
      </svg>
      <div className="absolute -bottom-4 inset-x-0 text-center text-xs tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">Click your trader to continue</div>
      <style>{`
        @keyframes tap { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
        @keyframes tap2 { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-12deg); } }
        @keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 94%, 98% { transform: scaleY(0.1); } }
        @keyframes steam { 0% { opacity: .3; transform: translateY(0); } 50% { opacity: .8; } 100% { opacity: 0; transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}

// ===== Main App =====
export default function CryptoTycoon() {
  const [screen, setScreen] = useState("start");
  const [name, setName] = useState("");
  const tick = useClockTick(TICK_MS);

  const [player, setPlayer] = useState({
    id: Math.random().toString(36).slice(2, 9),
    cash: STARTING_CASH,
    holdings: {},
    history: [],
  });

  const [market, setMarket] = useState(() => {
    const m = {};
    for (const c of COINS) {
      const start = parseFloat((100 + Math.random() * 1000).toFixed(2));
      m[c.symbol] = { price: start, series: [{ t: 0, p: start }] };
    }
    return m;
  });

  useEffect(() => {
    if (screen !== "market") return;
    setMarket((prev) => {
      const next = { ...prev };
      for (const sym of Object.keys(next)) {
        const price = randomWalkPrice(next[sym].price);
        const series = next[sym].series.slice(-60);
        series.push({ t: tick, p: price });
        next[sym] = { price, series };
      }
      return next;
    });
  }, [tick, screen]);

  const netWorth = useMemo(() => {
    const holdingsValue = Object.entries(player.holdings).reduce((sum, [sym, units]) => sum + units * (market[sym]?.price || 0), 0);
    return parseFloat((player.cash + holdingsValue).toFixed(2));
  }, [player.cash, player.holdings, market]);

  useEffect(() => {
    if (screen !== "market") return;
    setPlayer((p) => ({ ...p, history: [...p.history.slice(-200), { t: Date.now(), value: netWorth }] }));
  }, [netWorth, screen]);

  const qtyRefs = useRef({});
  function buy(sym) {
    const qty = parseFloat(qtyRefs.current[sym]?.value || "0");
    if (!qty || qty <= 0) return;
    const price = market[sym].price;
    const cost = qty * price;
    setPlayer((p) => {
      if (p.cash < cost) return p;
      const units = (p.holdings[sym] || 0) + qty;
      return { ...p, cash: parseFloat((p.cash - cost).toFixed(2)), holdings: { ...p.holdings, [sym]: parseFloat(units.toFixed(6)) } };
    });
  }
  function sell(sym) {
    const qty = parseFloat(qtyRefs.current[sym]?.value || "0");
    if (!qty || qty <= 0) return;
    setPlayer((p) => {
      const owned = p.holdings[sym] || 0;
      const sellQty = Math.min(owned, qty);
      if (sellQty <= 0) return p;
      const price = market[sym].price;
      const proceeds = sellQty * price;
      const newUnits = parseFloat((owned - sellQty).toFixed(6));
      const newHoldings = { ...p.holdings };
      if (newUnits <= 0) delete newHoldings[sym]; else newHoldings[sym] = newUnits;
      return { ...p, cash: parseFloat((p.cash + proceeds).toFixed(2)), holdings: newHoldings };
    });
  }
  function resetGame() {
    setPlayer({ id: Math.random().toString(36).slice(2, 9), cash: STARTING_CASH, holdings: {}, history: [] });
  }

  // Start screen
  if (screen === "start") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4">
        <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-3xl font-semibold text-center mb-1">Crypto Tycoon .io</h1>
          <p className="text-center text-sm opacity-80 mb-6">Enter a name to begin</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name && setScreen('avatar')}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
          />
          <button
            disabled={!name}
            onClick={() => setScreen("avatar")}
            className="w-full px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Play
          </button>
          <div className="mt-4 text-xs opacity-70 text-center">Prototype build · prices simulated</div>
        </div>
      </div>
    );
  }

  // Avatar screen
  if (screen === "avatar") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4">
        <div className="text-lg opacity-90 mb-3">Welcome, <span className="font-semibold">{name}</span></div>
        <PlayerAvatar name={name} onClick={() => setScreen("market")} />
      </div>
    );
  }

  // Market screen
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Market — Player: <span className="font-mono">{name}</span></h1>
        <div className="flex items-center gap-3">
          <div className="text-sm opacity-80">ID <span className="font-mono">{player.id}</span></div>
          <button onClick={resetGame} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700">Reset</button>
        </div>
      </header>

      <main className="grid md:grid-cols-3 gap-4 mt-4">
        {/* Market & Charts */}
        <section className="md:col-span-1 bg-slate-900/50 rounded-2xl p-3 shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Market</h2>
          <div className="space-y-3">
            {COINS.map((c) => (
              <div key={c.symbol} className="rounded-xl p-3 bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name} <span className="opacity-70">({c.symbol})</span></div>
                    <div className="text-sm opacity-80">${market[c.symbol]?.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={(el) => (qtyRefs.current[c.symbol] = el)}
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="Qty"
                      className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right"
                    />
                    <button onClick={() => buy(c.symbol)} className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500">Buy</button>
                    <button onClick={() => sell(c.symbol)} className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500">Sell</button>
                  </div>
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={market[c.symbol]?.series || []} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip formatter={(v) => `$${v}`} />
                      <Line type="monotone" dataKey="p" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Avatar + Stats */}
        <section className="md:col-span-1 bg-slate-900/50 rounded-2xl p-3 flex flex-col items-center justify-between shadow-lg">
          <div className="text-lg font-semibold">Your Station</div>
          <PlayerAvatar name={name} onClick={() => {}} />
          <div className="w-full grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-800/60 p-3">
              <div className="opacity-80">Cash</div>
              <div className="text-xl font-mono">${player.cash.toFixed(2)}</div>
            </div>
            <div className="rounded-xl bg-slate-800/60 p-3">
              <div className="opacity-80">Net Worth</div>
              <div className="text-xl font-mono">${netWorth.toFixed(2)}</div>
            </div>
          </div>
        </section>

        {/* Portfolio */}
        <section className="md:col-span-1 bg-slate-900/50 rounded-2xl p-3 shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Portfolio</h2>
          {Object.keys(player.holdings).length === 0 ? (
            <div className="text-sm opacity-80">No holdings yet. Buy something on the left!</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(player.holdings).map(([sym, units]) => (
                <div key={sym} className="flex items-center justify-between bg-slate-800/60 rounded-xl p-3">
                  <div>
                    <div className="font-medium">{sym}</div>
                    <div className="text-xs opacity-70">{units} units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-80">@ ${market[sym]?.price.toFixed(2)}</div>
                    <div className="font
                    <div className="font-mono">
                      ${(units * (market[sym]?.price || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
export default CryptoTycoon;
