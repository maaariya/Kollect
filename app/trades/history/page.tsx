"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  album: string;
  image: string | null;
};

type TradeHistory = {
  id: number;
  status: string;
  createdAt: string;
  isSender: boolean;
  otherUser: { id: number; name: string; avatarUrl: string | null };
  myCard: Card;
  theirCard: Card;
};

const STATUS_STYLES: Record<string, string> = {
  COMPLETED:   "bg-green-100 text-green-700",
  PENDING:     "bg-yellow-100 text-yellow-700",
  ACCEPTED:    "bg-blue-100 text-blue-700",
  DEPOSIT_PAID:"bg-blue-100 text-blue-700",
  CARDS_SENT:  "bg-purple-100 text-purple-700",
  DECLINED:    "bg-red-100 text-red-500",
  DISPUTED:    "bg-orange-100 text-orange-600",
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED:    "Completed",
  PENDING:      "Pending",
  ACCEPTED:     "Accepted",
  DEPOSIT_PAID: "Deposit paid",
  CARDS_SENT:   "Cards sent",
  DECLINED:     "Declined",
  DISPUTED:     "Disputed",
};

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trades/history", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTrades(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-400">
        <p className="text-lg font-medium">No trades yet.</p>
        <Link href="/trading" className="mt-3 inline-block text-pink-500 text-sm">
          Browse trading listings →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <h1 className="text-2xl font-bold mb-4">Trade History</h1>

      {trades.map((trade) => (
        <div key={trade.id} className="bg-white rounded-2xl shadow-sm p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/messages/${trade.otherUser.id}`}
              className="flex items-center gap-2 text-sm font-medium hover:text-pink-500 transition"
            >
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs overflow-hidden">
                {trade.otherUser.avatarUrl ? (
                  <img src={trade.otherUser.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  trade.otherUser.name.charAt(0).toUpperCase()
                )}
              </div>
              {trade.otherUser.name}
            </Link>

            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_STYLES[trade.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {STATUS_LABELS[trade.status] ?? trade.status}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(trade.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="flex items-center gap-4">
            <CardThumb card={trade.myCard} label="You gave" />
            <span className="text-gray-300 text-2xl">⇄</span>
            <CardThumb card={trade.theirCard} label="You got" />
          </div>

        </div>
      ))}
    </div>
  );
}

function CardThumb({ card, label }: { card: Card; label: string }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <img
        src={card.image || "/placeholder.jpg"}
        className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
      />
      <div className="min-w-0">
        <p className="text-[10px] uppercase opacity-50">{label}</p>
        <p className="text-xs font-semibold truncate">{card.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{card.member} · {card.group}</p>
      </div>
    </div>
  );
}
