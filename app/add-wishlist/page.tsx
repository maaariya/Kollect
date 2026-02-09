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

export default function AddWishlistPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [message, setMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/cards/list");
      const data = await res.json();
      setCards(data.cards || []);
    }
    load();
  }, []);

  async function addToWishlist(cardId: number) {
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("You must be logged in!");
      return;
    }

    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to add to wishlist");
    } else {
      setMessage("Added to wishlist!");
    }
  }

  // --- FILTERED CARDS ---
  const filteredCards = cards.filter((card) => {
    const term = search.toLowerCase();

    if (filterBy === "all") {
      return (
        card.name.toLowerCase().includes(term) ||
        card.member.toLowerCase().includes(term) ||
        card.group.toLowerCase().includes(term) ||
        card.album.toLowerCase().includes(term)
      );
    }

    return card[filterBy as "member" | "group" | "album"]
      .toLowerCase()
      .includes(term);
  });

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">
      <h1 className="text-4xl text-center text-pink-dark mb-6 font-bold">
        Add Cards to Your Wishlist
      </h1>

      {message && (
        <p className="text-center font-bold text-pink-dark mb-4">
          {message}
        </p>
      )}

      {/* --- SEARCH + FILTERS --- */}
      <div className="flex justify-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search group, member, album..."
          className="px-3 py-2 border rounded-xl bg-white shadow text-sm w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-3 py-2 border rounded-xl bg-white shadow text-sm"
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
        >
          <option value="all">All</option>
          <option value="group">Group</option>
          <option value="member">Member</option>
          <option value="album">Album</option>
        </select>
      </div>

      {/* --- CARDS --- */}
      <div className="flex flex-wrap gap-y-6 gap-x-3">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="flex-shrink-0 w-40 flex flex-col items-center 
              bg-white/70 border border-pink-200 
              rounded-2xl p-3 shadow-md
              hover:scale-105 transition-transform duration-200"
            style={{ marginRight: "12px" }}
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
              className="mt-2 bg-pink-400 text-white px-4 py-1.5 rounded-xl shadow 
                hover:bg-pink-500 transition text-sm"
              onClick={() => addToWishlist(card.id)}
            >
              Wishlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
