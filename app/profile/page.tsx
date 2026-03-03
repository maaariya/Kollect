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

const CARDS_PER_PAGE = 9;

export default function ProfilePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [wishlist, setWishlist] = useState<Card[]>([]);
  const [message, setMessage] = useState("");

  const [collectionPage, setCollectionPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setMessage("You must be logged in.");
          return;
        }

        const user = await res.json();

        if (!user) {
          setMessage("Failed to load profile.");
          return;
        }

        // Adjust based on your /api/me structure
        setCards(Array.isArray(user.cards) ? user.cards : []);
setWishlist(Array.isArray(user.wishlist) ? user.wishlist : []);
      } catch {
        setMessage("Failed to load profile.");
      }
    }

    loadData();
  }, []);

  async function removeFromCollection(cardId: number) {
    const res = await fetch("/api/cards/remove", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cardId }),
    });

    if (!res.ok) return;

    setCards((prev) => {
      const updated = prev.filter((card) => card.id !== cardId);

      const maxPage = Math.max(
        1,
        Math.ceil(updated.length / CARDS_PER_PAGE)
      );

      if (collectionPage > maxPage) setCollectionPage(maxPage);

      return updated;
    });
  }

  async function removeFromWishlist(cardId: number) {
    const res = await fetch("/api/wishlist/remove", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cardId }),
    });

    if (!res.ok) return;

    setWishlist((prev) => {
      const updated = prev.filter((card) => card.id !== cardId);

      const maxPage = Math.max(
        1,
        Math.ceil(updated.length / CARDS_PER_PAGE)
      );

      if (wishlistPage > maxPage) setWishlistPage(maxPage);

      return updated;
    });
  }

  const collectionTotalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const wishlistTotalPages = Math.ceil(wishlist.length / CARDS_PER_PAGE);

  const collectionStart = (collectionPage - 1) * CARDS_PER_PAGE;
  const wishlistStart = (wishlistPage - 1) * CARDS_PER_PAGE;

  const currentCollection = cards.slice(
    collectionStart,
    collectionStart + CARDS_PER_PAGE
  );

  const currentWishlist = wishlist.slice(
    wishlistStart,
    wishlistStart + CARDS_PER_PAGE
  );

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl text-pink-dark font-bold">
          My Profile
        </h1>

        <Link
          href="/add-card"
          className="bg-pink-500 text-white px-4 py-2 rounded-xl shadow-md hover:bg-pink-600 transition"
        >
          Add Card
        </Link>
      </div>

      {message && (
        <p className="text-center text-pink-dark mb-6 font-semibold">
          {message}
        </p>
      )}

      {/* ================= COLLECTION ================= */}
      <section className="mb-16">
        <h2 className="text-2xl text-pink-dark font-bold mb-6">
          My Collection ({cards.length})
        </h2>

        {cards.length === 0 ? (
          <p className="text-center text-pink-400">
            Your collection is empty.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
              {currentCollection.map((card) => (
                <div
                  key={card.id}
                  className="relative w-40 flex flex-col items-center 
                    bg-white/70 border border-pink-200 
                    rounded-2xl p-3 shadow-md group"
                >
                  <img
                    src={card.image ?? "/placeholder.jpg"}
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

                  <div
                    className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 
                    group-hover:opacity-100 flex items-center justify-center transition"
                  >
                    <button
                      onClick={() => removeFromCollection(card.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {collectionTotalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  disabled={collectionPage === 1}
                  onClick={() => setCollectionPage((p) => p - 1)}
                  className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
                >
                  ←
                </button>

                <span className="text-pink-600 font-semibold">
                  Page {collectionPage} / {collectionTotalPages}
                </span>

                <button
                  disabled={collectionPage === collectionTotalPages}
                  onClick={() => setCollectionPage((p) => p + 1)}
                  className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================= WISHLIST ================= */}
      <section>
        <h2 className="text-2xl text-pink-dark font-bold mb-6">
          My Wishlist ({wishlist.length})
        </h2>

        {wishlist.length === 0 ? (
          <p className="text-center text-pink-400">
            Your wishlist is empty.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
              {currentWishlist.map((card) => (
                <div
                  key={card.id}
                  className="relative w-40 flex flex-col items-center 
                    bg-pink-50 border border-pink-200 
                    rounded-2xl p-3 shadow-md group"
                >
                  <img
                    src={card.image ?? "/placeholder.jpg"}
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

                  <div
                    className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 
                    group-hover:opacity-100 flex items-center justify-center transition"
                  >
                    <button
                      onClick={() => removeFromWishlist(card.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {wishlistTotalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  disabled={wishlistPage === 1}
                  onClick={() => setWishlistPage((p) => p - 1)}
                  className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
                >
                  ←
                </button>

                <span className="text-pink-600 font-semibold">
                  Page {wishlistPage} / {wishlistTotalPages}
                </span>

                <button
                  disabled={wishlistPage === wishlistTotalPages}
                  onClick={() => setWishlistPage((p) => p + 1)}
                  className="px-4 py-2 bg-white/70 border border-pink-200 rounded-xl disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}