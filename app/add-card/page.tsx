"use client";

import { useEffect, useState } from "react";

type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  album: string;
  image: string | null;
};

export default function AddCardPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/cards/list");
      const data = await res.json();
      setCards(data.cards || []);
    }
    load();
  }, []);

  async function addToCollection(cardId: number) {
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You must be logged in!");
      return;
    }

    const res = await fetch("/api/cards/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to add card");
    } else {
      setMessage("Card added to your collection!");
    }
  }

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">

      <h1 className="text-4xl text-center text-pink-dark mb-6 font-bold">
        Add Cards to Your Collection
      </h1>

      {message && (
        <p className="text-center font-bold text-pink-dark mb-4">{message}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="p-4 bg-secondary-light rounded-xl-bubble shadow-xl flex flex-col items-center"
          >
            <img
              src={card.image || "/placeholder.jpg"}
              alt={card.name}
              className="w-32 h-32 object-cover rounded-xl-bubble mb-2"
            />

            <p className="text-lg font-bold text-pink-dark">{card.name}</p>
            <p className="text-sm text-pink-medium">{card.member}</p>
            <p className="text-sm text-pink-medium">{card.group}</p>
            <p className="text-xs text-pink-dark italic">{card.album}</p>

            <button
              className="mt-3 bg-pink-medium text-white px-4 py-2 rounded-xl-bubble shadow-md hover:bg-pink-light transition"
              onClick={() => addToCollection(card.id)}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
