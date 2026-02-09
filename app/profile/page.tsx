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

type UserCard = {
  id: number;
  card: Card;
};

const CARDS_PER_PAGE = 9; // 3 rows x 3 cards

export default function ProfilePage() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You must be logged in.");
      return;
    }

    fetch("/api/users/me", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.user?.cards)) {
          setCards(data.user.cards);
        } else {
          setMessage("Failed to load collection.");
        }
      })
      .catch(() => setMessage("Failed to load collection."));
  }, []);

  async function removeFromCollection(cardId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/cards/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

    if (!res.ok) return;

    // instant UI update (same pattern as wishlist)
    setCards((prev) => prev.filter((uc) => uc.card.id !== cardId));
  }

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const start = (page - 1) * CARDS_PER_PAGE;
  const currentCards = cards.slice(start, start + CARDS_PER_PAGE);

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-pink-dark font-bold">
          My Collection
        </h1>

        {/* Add Card button restored */}
        <Link
          href="/add-card"
          className="bg-pink-500 text-white px-4 py-2 rounded-xl shadow-md hover:bg-pink-600 transition"
        >
          Add Card
        </Link>
      </div>

      {message && (
        <p className="text-center text-pink-dark mb-4 font-semibold">
          {message}
        </p>
      )}

      {cards.length === 0 && !message ? (
        <p className="text-center text-pink-400">
          Your collection is empty.
        </p>
      ) : (
        <>
          {/* Card grid — SAME spacing as wishlist */}
          <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
            {currentCards.map((item) => {
              const card = item.card;

              return (
                <div
                  key={item.id}
                  className="relative flex-shrink-0 w-40 flex flex-col items-center 
                    bg-white/70 border border-pink-200 
                    rounded-2xl p-3 shadow-md group"
                >
                  <img
                    src={card.image || "/placeholder.jpg"}
                    alt={card.name}
                    className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                  />

                  <p className="font-semibold text-sm text-center text-pink-700">
                    {card.name}
                  </p>

                  <p className="text-pink-500 text-xs text-center">
                    {card.member} — {card.group}
                  </p>

                  <p className="text-pink-400 text-[11px] italic text-center">
                    {card.album}
                  </p>

                  {/* Hover overlay — identical behavior to wishlist */}
                  <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 
                    group-hover:opacity-100 flex items-center justify-center transition">
                    <button
                      onClick={() => removeFromCollection(card.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      Remove from collection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
              >
                ←
              </button>

              <span className="text-pink-600 font-semibold">
                Page {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
