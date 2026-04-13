"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  tradeId?: number | null;
};

type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  album: string;
  image: string | null;
};

type TradeStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DEPOSIT_PAID"
  | "CARDS_SENT"
  | "COMPLETED"
  | "DECLINED";

type Trade = {
  id: number;
  status: TradeStatus;
  senderId: number;
  receiverId: number;
  offeredCard: Card;
  requestedCard: Card;
  senderDepositPaid: boolean;
  receiverDepositPaid: boolean;
  senderCardSent: boolean;
  receiverCardSent: boolean;
  senderConfirmed: boolean;
  receiverConfirmed: boolean;
};

type User = {
  id: number;
  name: string;
};

// ── UI helpers ─────────────────────────────────────────────

const STATUS_LABEL: Record<TradeStatus, string> = {
  PENDING: "Awaiting acceptance",
  ACCEPTED: "Deposit stage",
  DEPOSIT_PAID: "Cards sent",
  CARDS_SENT: "Confirm receipt",
  COMPLETED: "Trade complete 🎉",
  DECLINED: "Declined",
};

const STATUS_COLOR: Record<TradeStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  DEPOSIT_PAID: "bg-violet-100 text-violet-700",
  CARDS_SENT: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-red-100 text-red-700",
};

// ── Trade Bubble ─────────────────────────────────────────────

function TradeBubble({ trade }: { trade: Trade }) {
  return (
    <div className="max-w-xs p-3 rounded-2xl bg-white border shadow-sm">
      <p className="text-xs font-bold text-pink-500 mb-2">Trade Proposal</p>

      <div className="flex items-center gap-2 text-sm">
        <div className="text-center flex-1">
          <img
            src={trade.offeredCard?.image || "/placeholder.jpg"}
            className="w-24 h-36 object-cover rounded-xl shadow-md mx-auto"
          />
          <p className="font-semibold">{trade.offeredCard?.name}</p>
          <p className="text-[10px] text-gray-500">
            {trade.offeredCard?.member}
          </p>
        </div>

        <span className="text-pink-400 font-bold">⇄</span>

        <div className="text-center flex-1">
          <img
            src={trade.requestedCard?.image || "/placeholder.jpg"}
          className="w-24 h-36 object-cover rounded-xl shadow-md mx-auto"
          />
          <p className="font-semibold">{trade.requestedCard?.name}</p>
          <p className="text-[10px] text-gray-500">
            {trade.requestedCard?.member}
          </p>
        </div>
      </div>

      <p
        className={`mt-2 text-[10px] px-2 py-1 rounded-full inline-block ${STATUS_COLOR[trade.status]}`}
      >
        {STATUS_LABEL[trade.status]}
      </p>
    </div>
  );
}

// ── Trade Panel (RESTORED + CLEAN) ─────────────────────────────

function TradePanel({
  trade,
  myId,
  onAction,
}: {
  trade: Trade;
  myId: number;
  onAction: (id: number, action: string) => void;
}) {
  const [open, setOpen] = useState(true);

  const isSender = trade.senderId === myId;

  return (
    <div className="rounded-2xl border bg-white shadow-sm mb-4 overflow-hidden">

      {/* HEADER (CLICK TO TOGGLE) */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-pink-50 hover:bg-pink-100 transition"
      >
        <h3 className="font-bold text-sm text-pink-700">
          Active Trade
        </h3>

        <span className="text-xs bg-white px-2 py-1 rounded-full border text-gray-600">
          {open ? "Hide ▲" : "Show ▼"}
        </span>
      </div>

      {/* COLLAPSIBLE CONTENT */}
      {open && (
        <div className="p-4">

          {/* CARDS */}
          <div className="flex items-center gap-4 mb-4">

            {/* OFFERED */}
            <div className="flex-1 text-center">
              <img
                src={trade.offeredCard?.image || "/placeholder.jpg"}
                className="w-24 h-36 object-cover rounded-xl shadow-md mx-auto"
              />
              <p className="font-semibold text-sm mt-2">
                {trade.offeredCard?.name}
              </p>
              <p className="text-xs text-gray-500">
                {trade.offeredCard?.member}
              </p>
              <p className="text-[10px] text-gray-400">
                {trade.offeredCard?.group}
              </p>
              <p className="text-[10px] text-gray-400">
                {trade.offeredCard?.album}
              </p>
            </div>

            <span className="text-pink-400 font-black text-xl">⇄</span>

            {/* REQUESTED */}
            <div className="flex-1 text-center">
              <img
                src={trade.requestedCard?.image || "/placeholder.jpg"}
                className="w-24 h-36 object-cover rounded-xl shadow-md mx-auto"
              />
              <p className="font-semibold text-sm mt-2">
                {trade.requestedCard?.name}
              </p>
              <p className="text-xs text-gray-500">
                {trade.requestedCard?.member}
              </p>
              <p className="text-[10px] text-gray-400">
                {trade.requestedCard?.group}
              </p>
              <p className="text-[10px] text-gray-400">
                {trade.requestedCard?.album}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">

            {trade.status === "PENDING" && (
              <>
                <button
                  onClick={() => onAction(trade.id, "accept")}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Accept
                </button>

                <button
                  onClick={() => onAction(trade.id, "decline")}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Decline
                </button>
              </>
            )}

            {trade.status === "ACCEPTED" && (
              <button
                onClick={() => onAction(trade.id, "pay_deposit")}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm"
              >
                Mark Deposit Paid
              </button>
            )}

            {trade.status === "DEPOSIT_PAID" && (
              <button
                onClick={() => onAction(trade.id, "mark_sent")}
                className="bg-violet-500 text-white px-4 py-2 rounded-xl text-sm"
              >
                Mark Card Sent
              </button>
            )}

            {trade.status === "CARDS_SENT" && (
              <button
                onClick={() => onAction(trade.id, "confirm_received")}
                className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm"
              >
                Confirm Received
              </button>
            )}

            {trade.status === "COMPLETED" && (
              <p className="text-sm font-bold text-emerald-600">
                🎉 Trade complete!
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────

export default function MessagesPage() {
  const { userId } = useParams();
  const searchParams = useSearchParams();

  const otherUserId = Number(userId);
  const requestedCardId = searchParams.get("card");

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<number | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const me = await fetch("/api/me").then((r) => r.json());
    setMyId(me.id);

    const msgs = await fetch(`/api/messages/${otherUserId}`).then((r) =>
      r.json()
    );
    setMessages(msgs);

    const trade = await fetch(
      `/api/trades/active?withUser=${otherUserId}`
    ).then((r) => r.json());

    setActiveTrade(trade?.trade ?? null);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [otherUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim()) return;

    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: otherUserId,
        content: newMessage,
      }),
    });

    setNewMessage("");
    load();
  }

  async function handleTrade(id: number, action: string) {
    await fetch(`/api/trades/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    load();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-screen">

      {/* TRADE PANEL */}
      {activeTrade && myId && (
        <TradePanel
          trade={activeTrade}
          myId={myId}
          onAction={handleTrade}
        />
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((m) => {
          const isOwn = m.senderId === myId;

          if (m.tradeId && activeTrade) {
            return (
              <div
                key={m.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <TradeBubble trade={activeTrade} />
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-xs text-sm ${
                  isOwn
                    ? "bg-pink-500 text-white"
                    : "bg-white border"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-pink-500 text-white px-4 py-2 rounded-xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}