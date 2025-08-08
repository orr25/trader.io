import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function CryptoTycoon() {
  const [coins, setCoins] = useState([
    { name: "Bitcoin", price: 30000, holdings: 0 },
    { name: "Ethereum", price: 2000, holdings: 0 },
    { name: "Litecoin", price: 100, holdings: 0 },
  ]);
  const [balance, setBalance] = useState(100000);
  const [history, setHistory] = useState([]);
  const [time, setTime] = useState(0);

  // Simulate price changes
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins((prevCoins) =>
        prevCoins.map((coin) => ({
          ...coin,
          price: parseFloat((coin.price * (0.95 + Math.random() * 0.1)).toFixed(2)),
        }))
      );
      setTime((t) => t + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Track history for chart
  useEffect(() => {
    setHistory((prev) => [
      ...prev,
      {
        time,
        ...coins.reduce((acc, coin) => {
          acc[coin.name] = coin.price;
          return acc;
        }, {}),
      },
    ]);
  }, [coins, time]);

  const buyCoin = (index) => {
    const price = coins[index].price;
    if (balance >= price) {
      setBalance(balance - price);
      setCoins((prev) => {
        const updated = [...prev];
        updated[index].holdings += 1;
        return updated;
      });
    }
  };

  const sellCoin = (index) => {
    if (coins[index].holdings > 0) {
      setBalance(balance + coins[index].price);
      setCoins((prev) => {
        const updated = [...prev];
        updated[index].holdings -= 1;
        return updated;
      });
    }
  };

  return (
    <div className="p-6 text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">💰 Crypto Tycoon</h1>
        <p className="text-lg">Balance: ${balance.toFixed(2)}</p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Market</h2>
          {coins.map((coin, i) => (
            <div
              key={coin.name}
              className="flex justify-between items-center bg-slate-800 p-3 rounded mb-3"
            >
              <div>
                <p className="font-bold">{coin.name}</p>
                <p>${coin.price.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => buyCoin(i)}
                  className="bg-green-600 px-3 py-1 rounded hover:bg-green-500"
                >
                  Buy
                </button>
                <button
                  onClick={() => sellCoin(i)}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-500"
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
          {coins.map((coin) => (
            <div
              key={coin.name}
              className="flex justify-between items-center bg-slate-800 p-3 rounded mb-3"
            >
              <div>
                <p className="font-bold">{coin.name}</p>
                <p>{coin.holdings} coins</p>
              </div>
              <div>
                <p>
                  ${(coin.holdings * coin.price).toFixed(2)} total value
                </p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Market History</h2>
        <div className="h-64 bg-slate-800 p-4 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              {coins.map((coin) => (
                <Line
                  key={coin.name}
                  type="monotone"
                  dataKey={coin.name}
                  stroke={
                    coin.name === "Bitcoin"
                      ? "#facc15"
                      : coin.name === "Ethereum"
                      ? "#60a5fa"
                      : "#34d399"
                  }
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
