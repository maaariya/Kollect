"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PayPalButtons } from "@paypal/react-paypal-js";

/* ───────────────── TYPES ───────────────── */

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
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
  | "DECLINED"
  | "DISPUTED";

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

/* ───────────────── PAGE ───────────────── */

export default function MessagesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = Number(params.userId);
  const requestedCardId = searchParams.get("card");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<number | null>(null);
  const [me, setMe] = useState<any>(null);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* ───────────────── HELPERS ───────────────── */

  async function safeFetch(url: string, options?: RequestInit) {
    try {
      const res = await fetch(url, { credentials: "include", ...options });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /* ───────────────── LOADERS ───────────────── */

  async function loadMe() {
    const data = await safeFetch("/api/me");
    if (!data) return;
    setMyId(data.id);
    setMe(data);
  }

  async function loadMessages() {
    const data = await safeFetch(`/api/messages/${userId}`);
    if (!data) return;
    setMessages(data);
  }

  async function loadTrade() {
    const data = await safeFetch(`/api/trades/active?withUser=${userId}`);
    setActiveTrade(data?.trade ?? null);
  }

  /* ───────────────── INIT ───────────────── */

  useEffect(() => {
    loadMe();
    loadMessages();
    loadTrade();

    intervalRef.current = setInterval(() => {
      loadMessages();
      loadTrade();
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ───────────────── ACTIONS ───────────────── */

  async function createTrade() {
    if (!selectedCardId || !requestedCardId || busy) return;
    if (myId !== null && userId === myId) {
      setTradeError("You can't trade with yourself.");
      return;
    }
    setBusy(true);
    setTradeError(null);
    try {
      const res = await fetch("/api/trades/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: userId,
          requestedCardId: Number(requestedCardId),
          offeredCardId: selectedCardId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setTradeError(body.error ?? "Could not create trade. Please try again.");
        setBusy(false);
        return;
      }
    } catch {
      setTradeError("Network error. Please try again.");
      setBusy(false);
      return;
    }
    setSelectedCardId(null);
    await loadTrade();
    setBusy(false);
  }

  async function handleAction(action: string) {
    if (!activeTrade || busy) return;
    setBusy(true);
    await safeFetch(`/api/trades/${activeTrade.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadTrade();
    setBusy(false);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await safeFetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId, content: newMessage }),
    });
    setNewMessage("");
    loadMessages();
  }

  /* ───────────────── DERIVED STATE ───────────────── */

  const isSender = activeTrade?.senderId === myId;

  const myDepositPaid = activeTrade
    ? isSender ? activeTrade.senderDepositPaid : activeTrade.receiverDepositPaid
    : false;

  const myCardSent = activeTrade
    ? isSender ? activeTrade.senderCardSent : activeTrade.receiverCardSent
    : false;

  const myConfirmed = activeTrade
    ? isSender ? activeTrade.senderConfirmed : activeTrade.receiverConfirmed
    : false;

  /* ───────────────── UI ───────────────── */

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-screen">

      {/* ── TRADE PROPOSAL (no active trade, came from a card page) ── */}
      {requestedCardId && !activeTrade && me && (
        <div className="p-3 bg-white rounded-xl mb-3 shadow-sm">
          <p className="text-sm font-semibold mb-2">Choose a card to offer:</p>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {me.cards
              .filter((c: any) => !c.isTrading)
              .map((card: any) => (
                <img
                  key={card.id}
                  src={card.image || "/placeholder.jpg"}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-16 h-24 rounded-lg cursor-pointer border-2 flex-shrink-0 ${
                    selectedCardId === card.id ? "border-pink-500" : "border-transparent"
                  }`}
                />
              ))}
          </div>

          <button
            disabled={!selectedCardId || busy}
            onClick={createTrade}
            className="mt-3 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm disabled:opacity-40"
          >
            {busy ? "Sending…" : "Propose Trade"}
          </button>
          {tradeError && (
            <p className="mt-2 text-xs text-red-500">{tradeError}</p>
          )}
        </div>
      )}

      {/* ── ACTIVE TRADE PANEL ── */}
      {activeTrade && (
        <div className="p-4 bg-white rounded-xl mb-3 shadow-sm space-y-4">

          {/* Cards */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <p className="text-[10px] uppercase opacity-50 mb-1">You offer</p>
              <img
                src={activeTrade.offeredCard.image || "/placeholder.jpg"}
                className="w-20 h-28 rounded-lg object-cover mx-auto"
              />
              <p className="text-xs font-medium mt-1">{activeTrade.offeredCard.name}</p>
            </div>

            <span className="text-xl opacity-40">⇄</span>

            <div className="text-center flex-1">
              <p className="text-[10px] uppercase opacity-50 mb-1">You receive</p>
              <img
                src={activeTrade.requestedCard.image || "/placeholder.jpg"}
                className="w-20 h-28 rounded-lg object-cover mx-auto"
              />
              <p className="text-xs font-medium mt-1">{activeTrade.requestedCard.name}</p>
            </div>
          </div>

          {/* ── Step 1: Acceptance ── */}
          {activeTrade.status === "PENDING" && (
            isSender ? (
              <p className="text-sm text-gray-500 text-center">
                Waiting for the other user to accept your trade…
              </p>
            ) : (
              <div className="flex gap-2 justify-center">
                <button
                  disabled={busy}
                  onClick={() => handleAction("accept")}
                  className="px-5 py-2 bg-green-500 text-white rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Accept
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleAction("decline")}
                  className="px-5 py-2 bg-red-400 text-white rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Decline
                </button>
              </div>
            )
          )}

          {/* ── Step 2: Deposit ── */}
          {activeTrade.status === "ACCEPTED" && (
            myDepositPaid ? (
              <p className="text-sm text-gray-500 text-center">
                ✔ Deposit paid — waiting for the other user to pay theirs…
              </p>
            ) : (
              <div>
                <p className="text-sm font-medium mb-2 text-center">
                  Pay your $5 security deposit to proceed:
                </p>
                <PayPalButtons
                  style={{ layout: "vertical", tagline: false }}
                  createOrder={async () => {
                    const res = await fetch("/api/paypal/create-order", {
                      method: "POST",
                      credentials: "include",
                    });
                    const data = await res.json();
                    return data.id;
                  }}
                  onApprove={async (data) => {
                    await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        orderId: data.orderID,
                        tradeId: activeTrade.id,
                      }),
                    });
                    loadTrade();
                  }}
                />
              </div>
            )
          )}

          {/* ── Step 3: Send cards ── */}
          {activeTrade.status === "DEPOSIT_PAID" && (
            <div className="space-y-2">
              {myCardSent ? (
                <p className="text-sm text-gray-500 text-center">
                  ✔ Card sent — waiting for the other user to send theirs…
                </p>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => handleAction("mark_sent")}
                  className="w-full py-2 bg-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Mark My Card as Sent
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => handleAction("dispute")}
                className="w-full py-2 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 border border-red-700"
              >
                Dispute Trade
              </button>
            </div>
          )}

          {/* ── Step 4: Confirm receipt ── */}
          {activeTrade.status === "CARDS_SENT" && (
            myConfirmed ? (
              <p className="text-sm text-gray-500 text-center">
                ✔ Receipt confirmed — waiting for the other user to confirm…
              </p>
            ) : (
              <button
                disabled={busy}
                onClick={() => handleAction("confirm_received")}
                className="w-full py-2 bg-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-40"
              >
                Confirm Card Received
              </button>
            )
          )}

          {/* ── Done ── */}
          {activeTrade.status === "COMPLETED" && (
            <p className="text-green-600 font-semibold text-center">
              Trade complete! You can propose a new trade whenever you like.
            </p>
          )}

          {/* ── Declined ── */}
          {activeTrade.status === "DECLINED" && (
            <p className="text-red-400 text-sm text-center">
              Trade declined. You can propose a new one.
            </p>
          )}

          {/* ── Disputed ── */}
          {activeTrade.status === "DISPUTED" && (
            <p className="text-red-600 font-semibold text-center">
              Trade disputed. An admin will review this trade.
            </p>
          )}

        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-3 rounded-xl">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex mb-2 ${m.senderId === myId ? "justify-end" : "justify-start"}`}
          >
            <div className="px-3 py-2 bg-white rounded-xl shadow-sm max-w-[75%] text-sm">
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div className="flex gap-2 mt-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400"
        />
        <button
          onClick={sendMessage}
          className="bg-pink-500 text-white px-4 rounded-xl text-sm font-medium"
        >
          Send
        </button>
      </div>

    </div>
  );
}
