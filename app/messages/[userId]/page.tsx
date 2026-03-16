"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
};

type Card = {
  id: number;
  name: string;
  member: string;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function MessagesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = Number(params.userId);
  const requestedCardId = searchParams.get("card");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const [myCards, setMyCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const [chatUser, setChatUser] = useState<User | null>(null);

  // Load messages
  async function loadMessages() {
    const res = await fetch(`/api/messages/${userId}`, {
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();
    setMessages(data);
  }

  // Load my cards
  async function loadCards() {
    const res = await fetch("/api/me", {
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();
    setMyCards(data.cards || []);
  }

  // Load user you're chatting with
  async function loadChatUser() {
    const res = await fetch(`/api/users/${userId}`);

    if (!res.ok) return;

    const data = await res.json();
    setChatUser(data);
  }

  useEffect(() => {
    loadMessages();
    loadCards();
    loadChatUser();

    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, []);

  // Send message
  async function sendMessage() {
    if (!newMessage.trim()) return;

    await fetch("/api/messages/send", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId: userId,
        content: newMessage,
      }),
    });

    setNewMessage("");
    loadMessages();
  }

  // Send trade proposal
  async function sendTradeProposal() {
    if (!selectedCard || !requestedCardId) return;

    const res = await fetch("/api/trades/create", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
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

    alert("Trade proposal sent!");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* Chat Header */}
      <div className="flex items-center justify-between mb-4 border-b pb-3">

        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-700">
            {chatUser?.name?.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div>
            <p className="font-semibold text-pink-700">
              {chatUser?.name || "Loading..."}
            </p>

            <p className="text-xs text-gray-400">
              Trading Chat
            </p>
          </div>

        </div>

        {/* Profile Button */}
        <a
          href={`/profile/${userId}`}
          className="text-sm bg-pink-500 text-white px-3 py-1 rounded-lg"
        >
          View Profile
        </a>

      </div>

      {/* Trade Proposal */}
      {requestedCardId && (
        <div className="border border-pink-200 rounded-xl p-4 mb-4 bg-pink-50">

          <h3 className="font-semibold text-pink-700 mb-2">
            Propose a Trade
          </h3>

          <p className="text-sm mb-3">
            Select a card from your collection to offer.
          </p>

          <select
            className="border rounded p-2 w-full mb-3"
            onChange={(e) =>
              setSelectedCard(Number(e.target.value))
            }
          >
            <option value="">Choose a card</option>

            {myCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} — {card.member}
              </option>
            ))}
          </select>

          <button
            onClick={sendTradeProposal}
            className="bg-pink-500 text-white px-4 py-2 rounded-xl"
          >
            Send Trade Offer
          </button>

        </div>
      )}

      {/* Messages */}
      <div className="border rounded-xl p-4 h-96 overflow-y-auto mb-4 bg-white">

        {messages.length === 0 && (
          <p className="text-gray-400 text-sm">
            No messages yet
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 ${
              msg.senderId === userId
                ? "text-left"
                : "text-right"
            }`}
          >

            <span className="inline-block bg-pink-100 px-3 py-2 rounded-xl">
              {msg.content}
            </span>

          </div>
        ))}

      </div>

      {/* Message Input */}
      <div className="flex gap-2">

        <input
          value={newMessage}
          onChange={(e) =>
            setNewMessage(e.target.value)
          }
          placeholder="Type a message..."
          className="flex-1 border rounded-xl p-2"
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