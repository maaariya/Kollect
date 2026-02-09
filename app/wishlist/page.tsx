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

type WishlistItem = {
  id: number;
  card: Card;
};

const CARDS_PER_PAGE = 12;

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You must be logged in to view your wishlist.");
      return;
    }

    fetch("/api/wishlist", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWishlist(data);
        } else {
          setMessage("Failed to load wishlist.");
        }
      })
      .catch(() => setMessage("Failed to load wishlist."));
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(wishlist.length / CARDS_PER_PAGE)
  );

  const start = (page - 1) * CARDS_PER_PAGE;
  const currentCards = wishlist.slice(start, start + CARDS_PER_PAGE);

  async function moveToCollection(cardId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    await fetch("/api/cards/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

    await fetch(`/api/wishlist/${cardId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    setWishlist((prev) => prev.filter((w) => w.card.id !== cardId));
  }

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">
      <h1 className="text-4xl text-center text-pink-dark mb-6 font-bold">
        My Wishlist
      </h1>

      {message && (
        <p className="text-center text-pink-dark mb-4 font-semibold">
          {message}
        </p>
      )}

      {wishlist.length === 0 && !message ? (
        <p className="text-center text-pink-400">Your wishlist is empty.</p>
      ) : (
        <>
          {/* Cards */}
          <div className="flex flex-wrap gap-x-3 gap-y-6 justify-center">
            {currentCards.map((item) => {
              const card = item.card;

              return (
                <div
                  key={item.id}
                  className="
                    relative w-40 flex flex-col items-center
                    bg-white/70 border border-pink-200
                    rounded-2xl p-3 shadow-md
                    hover:scale-105 transition-transform group
                  "
                >
                  <img
                    src={card.image || "/placeholder.jpg"}
                    alt={card.name}
                    className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                  />

                  <p className="font-semibold text-sm text-center text-pink-700 truncate w-full">
                    {card.name}
                  </p>

                  <p className="text-pink-500 text-xs text-center truncate w-full">
                    {card.member} — {card.group}
                  </p>

                  <p className="text-pink-400 text-[11px] italic text-center truncate w-full">
                    {card.album}
                  </p>

                  {/* Hover action */}
                  <div
                    className="
                      absolute inset-0 bg-black/50 rounded-2xl
                      opacity-0 group-hover:opacity-100
                      flex items-center justify-center transition
                    "
                  >
                    <button
                      onClick={() => moveToCollection(card.id)}
                      className="bg-pink-500 text-white px-4 py-2 rounded-xl shadow"
                    >
                      Move to Collection
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl bg-pink-400 text-white disabled:opacity-40"
            >
              ←
            </button>

            <span className="font-semibold text-pink-700">
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-pink-400 text-white disabled:opacity-40"
            >
              →
            </button>
          </div>
        </>
      )}

      {/* Add to wishlist button */}
      <div className="flex justify-center mt-8">
        <Link
          href="/add-wishlist"
          className="bg-pink-500 text-white px-6 py-2 rounded-xl shadow hover:bg-pink-600 transition"
        >
          Add to Wishlist
        </Link>
      </div>
    </div>
  );
}
