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

type WishlistItem = {
  id: number;
  cardId: number;
  card: Card;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
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
      });
  }, []);

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

    await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

    setWishlist((prev) => prev.filter((w) => w.cardId !== cardId));
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
        <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
          {wishlist.map((item) => {
            const card = item.card;

            return (
              <div
                key={item.id}
                className="relative group flex-shrink-0 w-40 flex flex-col items-center 
                  bg-white/70 border border-pink-200 
                  rounded-2xl p-3 shadow-md
                  hover:scale-105 transition-transform duration-200"
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

                <button
                  onClick={() => moveToCollection(card.id)}
                  className="absolute inset-0 bg-black/60 text-white text-sm font-semibold 
                    opacity-0 group-hover:opacity-100 transition-opacity 
                    rounded-2xl flex items-center justify-center"
                >
                  Move to collection
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
