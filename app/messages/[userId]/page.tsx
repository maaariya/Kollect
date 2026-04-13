"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ───────────────────────── TYPES ───────────────────────── */

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

/* ───────────────────────── HELPERS ───────────────────────── */

const STATUS_LABEL: Record<TradeStatus, string> = {
  PENDING: "Awaiting acceptance",
  ACCEPTED: "Deposit required",
  DEPOSIT_PAID: "Cards being sent",
  CARDS_SENT: "Confirm receipt",
  COMPLETED: "Trade complete",
  DECLINED: "Declined",
};

/* ───────────────────────── TRADE PANEL ───────────────────────── */

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

  const myDepositPaid = isSender
    ? trade.senderDepositPaid
    : trade.receiverDepositPaid;

  const myCardSent = isSender
    ? trade.senderCardSent
    : trade.receiverCardSent;

  const myConfirmed = isSender
    ? trade.senderConfirmed
    : trade.receiverConfirmed;

  function CardBlock({ card, label }: { card: Card; label: string }) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] uppercase opacity-60 mb-1">{label}</p>

        <img
          src={card.image || "/placeholder.jpg"}
          className="w-20 h-28 object-cover rounded-lg shadow border"
        />

        <p className="text-xs font-bold mt-1">{card.name}</p>
        <p className="text-[10px] opacity-60">{card.member}</p>
        <p className="text-[10px] opacity-40">{card.group}</p>
        <p className="text-[10px] italic opacity-40">{card.album}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-white shadow-sm mb-4 overflow-hidden">

      {/* HEADER */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-3 bg-pink-50"
      >
        <p className="font-bold text-sm">Active Trade</p>
        <span className="text-xs opacity-60">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="p-4">

          {/* STATUS */}
          <p className="text-xs mb-3 text-pink-500 font-semibold">
            {STATUS_LABEL[trade.status]}
          </p>

          {/* CARDS */}
          <div className="flex justify-between items-center mb-4">
            <CardBlock
              card={isSender ? trade.offeredCard : trade.requestedCard}
              label={isSender ? "You offer" : "You receive"}
            />

            <span className="text-xl font-bold text-pink-300">⇄</span>

            <CardBlock
              card={isSender ? trade.requestedCard : trade.offeredCard}
              label={isSender ? "You receive" : "You offer"}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-2">

            {trade.status === "PENDING" && (
              <button
                onClick={() => onAction(trade.id, "accept")}
                className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm"
              >
                Accept
              </button>
            )}

            {trade.status === "PENDING" && (
              <button
                onClick={() => onAction(trade.id, "decline")}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm"
              >
                Decline
              </button>
            )}

            {trade.status === "ACCEPTED" && !myDepositPaid && (
              <p className="text-sm text-gray-500">
                Waiting for deposit step...
              </p>
            )}

            {trade.status === "DEPOSIT_PAID" && !myCardSent && (
              <button
                onClick={() => onAction(trade.id, "mark_sent")}
                className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm"
              >
                Mark Card Sent
              </button>
            )}

            {trade.status === "CARDS_SENT" && !myConfirmed && (
              <button
                onClick={() => onAction(trade.id, "confirm_received")}
                className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm"
              >
                Confirm Received
              </button>
            )}

            {trade.status === "COMPLETED" && (
              <p className="text-sm font-bold text-green-600">
                🎉 Trade complete
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function MessagesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = Number(params.userId);
  const requestedCardId = searchParams.get("card");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<number | null>(null);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadMe() {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setMyId(data.id);
  }

  async function loadMessages() {
    const res = await fetch(`/api/messages/${userId}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    setMessages(await res.json());
  }

  async function loadTrade() {
    const res = await fetch(`/api/trades/active?withUser=${userId}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setActiveTrade(data.trade);
  }

  useEffect(() => {
    loadMe();
    loadMessages();
    loadTrade();

    const interval = setInterval(() => {
      loadMessages();
      loadTrade();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim()) return;

    await fetch("/api/messages/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: userId,
        content: newMessage,
      }),
    });

    setNewMessage("");
    loadMessages();
  }

  async function handleTradeAction(id: number, action: string) {
    await fetch(`/api/trades/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    loadTrade();
    loadMessages();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-screen">

      {/* TRADE PANEL */}
      {activeTrade && myId && (
        <TradePanel
          trade={activeTrade}
          myId={myId}
          onAction={handleTradeAction}
        />
      )}

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto space-y-2 bg-gray-50 p-3 rounded-xl">
        {messages.map((m) => {
          const isOwn = m.senderId === myId;

          return (
            <div
              key={m.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl text-sm max-w-xs shadow-sm ${
                  isOwn
                    ? "bg-pink-500 text-white rounded-br-sm"
                    : "bg-white border"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="flex gap-2 mt-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 border rounded-xl px-3 py-2"
        />
        <button
          onClick={sendMessage}
          className="bg-pink-500 text-white px-4 rounded-xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}