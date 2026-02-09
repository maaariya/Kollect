"use client";

import { useEffect, useState } from "react";
import WishlistButton from "@/app/components/WishlistButton";

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
  userId: number;
  cardId: number;
  card: Card;
};

type WishlistCard = {
  id: number;
  card: Card;
};

type User = {
  id: number;
  name: string;
  email: string;
  cards: UserCard[];
};

type Props = {
  user: User;
};

export default function ProfilePageClient({ user }: Props) {
  const [wishlist, setWishlist] = useState<WishlistCard[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch user's wishlist
    fetch("/api/wishlist", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const array = Array.isArray(data) ? data : [];
        setWishlist(array);
      })
      .catch(console.error);

    // Fetch all cards for “Add to Wishlist” section
    fetch("/api/cards") // ✅ create this API route to return all cards
      .then((res) => res.json())
      .then((data) => {
        const array = Array.isArray(data) ? data : [];
        setAllCards(array);
      })
      .catch(console.error);
  }, []);

  // IDs for filtering
  const ownedCardIds = new Set(user.cards.map((uc) => uc.card.id));
  const wishlistedCardIds = new Set(wishlist.map((wc) => wc.card.id));

  // Cards available to add to wishlist
  const availableForWishlist = allCards.filter(
    (card) => !ownedCardIds.has(card.id) && !wishlistedCardIds.has(card.id)
  );

  return (
    <div className="p-6 font-cute bg-primary-light min-h-screen">
      {/* -------- Owned Cards Section -------- */}
      <h1 className="text-3xl font-bold mb-6 text-pink-600 drop-shadow-sm">
        {user.name}'s Cards
      </h1>

      {user.cards.length === 0 ? (
        <p className="text-pink-400">No cards yet</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto py-4">
          {user.cards.map((uc) => {
            const card = uc.card;
            return (
              <div
                key={card.id}
                className="flex-shrink-0 w-40 flex flex-col items-center 
                  bg-white/70 border border-pink-200 
                  rounded-2xl p-3 shadow-md
                  hover:scale-105 transition-transform duration-200"
              >
                {card.image && (
                  <img
                    src={card.image}
                    alt={`${card.member} - ${card.album}`}
                    className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                  />
                )}

                <p className="font-semibold text-sm text-center truncate w-full text-pink-700">
                  {card.name}
                </p>

                <p className="text-pink-500 text-xs text-center truncate w-full">
                  {card.member} — {card.group}
                </p>

                <p className="text-pink-400 text-[11px] italic text-center truncate w-full">
                  {card.album}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <a
        href="/add-card"
        className="inline-block bg-pink-500 text-white px-4 py-2 mt-4 rounded-xl shadow hover:bg-pink-600 transition"
      >
        + Add Card
      </a>

      {/* -------- Wishlist Section -------- */}
      <h2 className="text-2xl font-bold mt-10 mb-4 text-pink-600">
        ❤️ My Wishlist
      </h2>

      {wishlist.length === 0 ? (
        <p className="text-pink-400">Your wishlist is empty</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {wishlist.map((wc) => {
            const card = wc.card;
            return (
              <div
                key={wc.id}
                className="relative flex flex-col items-center 
                  bg-white/70 border border-pink-200 
                  rounded-2xl p-3 shadow-md
                  hover:scale-105 transition-transform duration-200"
              >
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton cardId={card.id} />
                </div>

                {card.image && (
                  <img
                    src={card.image}
                    alt={`${card.member} - ${card.album}`}
                    className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                  />
                )}

                <p className="font-semibold text-sm text-center truncate w-full text-pink-700">
                  {card.name}
                </p>

                <p className="text-pink-500 text-xs text-center truncate w-full">
                  {card.member} — {card.group}
                </p>

                <p className="text-pink-400 text-[11px] italic text-center truncate w-full">
                  {card.album}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* -------- Add to Wishlist Section -------- */}
      <h2 className="text-2xl font-bold mt-10 mb-4 text-pink-600">
        ➕ Add to Wishlist
      </h2>

      {availableForWishlist.length === 0 ? (
        <p className="text-pink-400">
          No new cards to add — you own or have wishlisted all cards!
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableForWishlist.map((card) => (
            <div
              key={card.id}
              className="relative flex flex-col items-center 
                bg-white/70 border border-pink-200 
                rounded-2xl p-3 shadow-md
                hover:scale-105 transition-transform duration-200"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={`${card.member} - ${card.album}`}
                  className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                />
              )}

              <p className="font-semibold text-sm text-center truncate w-full text-pink-700">
                {card.name}
              </p>

              <p className="text-pink-500 text-xs text-center truncate w-full">
                {card.member} — {card.group}
              </p>

              <p className="text-pink-400 text-[11px] italic text-center truncate w-full">
                {card.album}
              </p>

              {/* Add to wishlist button */}
              <div className="mt-2 w-full flex justify-center">
                <WishlistButton cardId={card.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
