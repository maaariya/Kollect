"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  tradeId?: number | null;
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
  initiatorId: number;
  receiverId: number;
  offeredCard: { id: number; name: string; member: string };
  requestedCard: { id: number; name: string; member: string };
  initiatorDepositPaid: boolean;
  receiverDepositPaid: boolean;
  initiatorCardSent: boolean;
  receiverCardSent: boolean;
  initiatorConfirmed: boolean;
  receiverConfirmed: boolean;
};

type Card = { id: number; name: string; member: string };
type User = { id: number; name: string; email: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STEPS: TradeStatus[] = [
  "PENDING",
  "ACCEPTED",
  "DEPOSIT_PAID",
  "CARDS_SENT",
  "COMPLETED",
];

const STATUS_LABEL: Record<TradeStatus, string> = {
  PENDING: "Awaiting acceptance",
  ACCEPTED: "Pay £5 deposit",
  DEPOSIT_PAID: "Send your card",
  CARDS_SENT: "Confirm receipt",
  COMPLETED: "Trade complete!",
  DECLINED: "Trade declined",
};

const STATUS_COLOR: Record<TradeStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
  DEPOSIT_PAID: "bg-violet-100 text-violet-700 border-violet-200",
  CARDS_SENT: "bg-teal-100 text-teal-700 border-teal-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-100 text-red-700 border-red-200",
};

function stepIndex(s: TradeStatus) {
  return STATUS_STEPS.indexOf(s);
}

// ── Trade Status Panel ───────────────────────────────────────────────────────

function TradePanel({
  trade,
  myId,
  onAction,
}: {
  trade: Trade;
  myId: number;
  onAction: (tradeId: number, action: string) => void;
}) {
  const isInitiator = trade.initiatorId === myId;
  const isReceiver = trade.receiverId === myId;

  const myDepositPaid = isInitiator
    ? trade.initiatorDepositPaid
    : trade.receiverDepositPaid;
  const myCardSent = isInitiator
    ? trade.initiatorCardSent
    : trade.receiverCardSent;
  const myConfirmed = isInitiator
    ? trade.initiatorConfirmed
    : trade.receiverConfirmed;

  const currentStep = stepIndex(trade.status);

  function ActionButton({
    action,
    label,
    disabled,
    variant,
  }: {
    action: string;
    label: string;
    disabled?: boolean;
    variant?: "primary" | "danger";
  }) {
    const base =
      "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
    const styles =
      variant === "danger"
        ? `${base} bg-red-500 text-white hover:bg-red-600`
        : `${base} bg-pink-500 text-white hover:bg-pink-600`;

    return (
      <button
        className={styles}
        disabled={disabled}
        onClick={() => onAction(trade.id, action)}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 p-4 mb-4 ${STATUS_COLOR[trade.status]}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm tracking-wide uppercase opacity-70">
          Active Trade
        </h3>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-lg border ${STATUS_COLOR[trade.status]}`}
        >
          {STATUS_LABEL[trade.status]}
        </span>
      </div>

      {/* Cards */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-white/60 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
            {isInitiator ? "You offer" : "They offer"}
          </p>
          <p className="font-bold text-sm">{trade.offeredCard.name}</p>
          <p className="text-xs opacity-70">{trade.offeredCard.member}</p>
        </div>

        <span className="text-lg font-black opacity-50">⇄</span>

        <div className="flex-1 bg-white/60 rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
            {isInitiator ? "You receive" : "You offer"}
          </p>
          <p className="font-bold text-sm">{trade.requestedCard.name}</p>
          <p className="text-xs opacity-70">{trade.requestedCard.member}</p>
        </div>
      </div>

      {/* Progress bar */}
      {trade.status !== "DECLINED" && (
        <div className="flex gap-1 mb-4">
          {STATUS_STEPS.map((step, i) => (
            <div
              key={step}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                i <= currentStep ? "bg-current opacity-60" : "bg-current opacity-15"
              }`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* PENDING — receiver can accept or decline */}
        {trade.status === "PENDING" && isReceiver && (
          <>
            <ActionButton action="accept" label="Accept Trade" />
            <ActionButton action="decline" label="Decline" variant="danger" />
          </>
        )}

        {/* ACCEPTED — both must pay deposit */}
        {trade.status === "ACCEPTED" && !myDepositPaid && (
          <ActionButton action="pay_deposit" label="Pay £5 Deposit via PayPal" />
        )}
        {trade.status === "ACCEPTED" && myDepositPaid && (
          <p className="text-sm font-semibold opacity-70">
            ✓ Your deposit paid — waiting for other user
          </p>
        )}

        {/* DEPOSIT_PAID — both must mark card as sent */}
        {trade.status === "DEPOSIT_PAID" && !myCardSent && (
          <ActionButton action="mark_sent" label="Mark Card as Sent" />
        )}
        {trade.status === "DEPOSIT_PAID" && myCardSent && (
          <p className="text-sm font-semibold opacity-70">
            ✓ Card marked as sent — waiting for other user
          </p>
        )}

        {/* CARDS_SENT — both must confirm receipt */}
        {trade.status === "CARDS_SENT" && !myConfirmed && (
          <ActionButton action="confirm_received" label="Confirm Card Received" />
        )}
        {trade.status === "CARDS_SENT" && myConfirmed && (
          <p className="text-sm font-semibold opacity-70">
            ✓ Receipt confirmed — waiting for other user
          </p>
        )}

        {/* COMPLETED */}
        {trade.status === "COMPLETED" && (
          <p className="text-sm font-bold">
            🎉 Trade complete! Deposits have been returned.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Trade Bubble (inline in messages) ───────────────────────────────────────

function TradeBubble({
  trade,
  isOwnMessage,
}: {
  trade: Trade;
  isOwnMessage: boolean;
}) {
  return (
    <div
      className={`max-w-xs rounded-2xl border p-3 ${
        isOwnMessage
          ? "ml-auto bg-pink-50 border-pink-200"
          : "mr-auto bg-white border-gray-200"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-pink-500 font-bold mb-2">
        Trade Proposal
      </p>
      <div className="flex items-center gap-2 text-sm">
        <div className="text-center">
          <p className="font-semibold">{trade.offeredCard.name}</p>
          <p className="text-xs text-gray-500">{trade.offeredCard.member}</p>
        </div>
        <span className="text-pink-400 font-black">⇄</span>
        <div className="text-center">
          <p className="font-semibold">{trade.requestedCard.name}</p>
          <p className="text-xs text-gray-500">{trade.requestedCard.member}</p>
        </div>
      </div>
      <span
        className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          STATUS_COLOR[trade.status]
        }`}
      >
        {STATUS_LABEL[trade.status]}
      </span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = Number(params.userId); // the OTHER user
  const requestedCardId = searchParams.get("card");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [tradesMap, setTradesMap] = useState<Record<number, Trade>>({});
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  async function loadMe() {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setMyId(data.id);
    setMyCards(data.cards || []);
  }

  async function loadChatUser() {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) return;
    setChatUser(await res.json());
  }

  async function loadMessages() {
    const res = await fetch(`/api/messages/${userId}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    setMessages(await res.json());
  }

  async function loadActiveTrade() {
    const res = await fetch(`/api/trades/active?withUser=${userId}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setActiveTrade(data?.trade ?? null);
  }

  async function loadTradeById(tradeId: number) {
    if (tradesMap[tradeId]) return; // already fetched
    const res = await fetch(`/api/trades/${tradeId}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const trade: Trade = await res.json();
    setTradesMap((prev) => ({ ...prev, [tradeId]: trade }));
  }

  // Fetch trade details for any trade bubbles in messages
  useEffect(() => {
    const ids = messages
      .filter((m) => m.tradeId != null)
      .map((m) => m.tradeId as number);
    const unique = [...new Set(ids)];
    unique.forEach(loadTradeById);
  }, [messages]);

  useEffect(() => {
    loadMe();
    loadChatUser();
    loadMessages();
    loadActiveTrade();

    const interval = setInterval(() => {
      loadMessages();
      loadActiveTrade();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    await fetch("/api/messages/send", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, content: newMessage }),
    });

    setNewMessage("");
    setSending(false);
    loadMessages();
  }

  async function sendTradeProposal() {
    if (!selectedCard || !requestedCardId) return;

    const res = await fetch("/api/trades/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offeredCardId: selectedCard,
        requestedCardId: Number(requestedCardId),
        receiverId: userId,
      }),
    });

    if (!res.ok) {
      alert("Trade proposal failed");
      return;
    }

    loadMessages();
    loadActiveTrade();
  }

  async function handleTradeAction(tradeId: number, action: string) {
    const res = await fetch(`/api/trades/${tradeId}/action`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      alert("Action failed — please try again");
      return;
    }

    loadActiveTrade();
    loadMessages();
    // Refresh any inline trade bubbles
    setTradesMap((prev) => {
      const next = { ...prev };
      delete next[tradeId];
      return next;
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-screen">

      {/* ── Chat Header ── */}
      <div className="flex items-center justify-between mb-4 border-b border-pink-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center font-bold text-white shadow-sm">
            {chatUser?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {chatUser?.name ?? "Loading..."}
            </p>
            <p className="text-xs text-pink-400 font-medium">Trading Chat</p>
          </div>
        </div>
        <a
          href={`/profile/${userId}`}
          className="text-sm bg-pink-500 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-pink-600 transition-colors"
        >
          View Profile
        </a>
      </div>

      {/* ── Active Trade Panel ── */}
      {activeTrade && myId && (
        <TradePanel
          trade={activeTrade}
          myId={myId}
          onAction={handleTradeAction}
        />
      )}

      {/* ── Trade Proposal Form (only when browsing another user's card) ── */}
      {requestedCardId && !activeTrade && (
        <div className="border-2 border-pink-200 rounded-2xl p-4 mb-4 bg-pink-50">
          <h3 className="font-bold text-pink-700 mb-1">Propose a Trade</h3>
          <p className="text-sm text-gray-500 mb-3">
            Choose one of your cards to offer in exchange.
          </p>
          <select
            className="border border-pink-200 rounded-xl p-2 w-full mb-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
            onChange={(e) => setSelectedCard(Number(e.target.value))}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a card…
            </option>
            {myCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} — {card.member}
              </option>
            ))}
          </select>
          <button
            onClick={sendTradeProposal}
            disabled={!selectedCard}
            className="bg-pink-500 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send Trade Offer
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 border border-gray-100 rounded-2xl p-4 overflow-y-auto bg-gray-50 shadow-inner mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            No messages yet — say hello!
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = myId !== null && msg.senderId === myId;

          // Trade proposal bubble
          if (msg.tradeId != null) {
            const trade = tradesMap[msg.tradeId];
            if (trade) {
              return (
                <div key={msg.id} className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <TradeBubble trade={trade} isOwnMessage={isOwn} />
                </div>
              );
            }
            // Trade not loaded yet — show placeholder
            return (
              <div key={msg.id} className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className="max-w-xs rounded-2xl border border-gray-200 p-3 bg-white text-xs text-gray-400 animate-pulse">
                  Loading trade…
                </div>
              </div>
            );
          }

          // Regular message bubble
          return (
            <div
              key={msg.id}
              className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  isOwn
                    ? "bg-pink-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.content}
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? "text-pink-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Message Input ── */}
      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="bg-pink-500 text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}