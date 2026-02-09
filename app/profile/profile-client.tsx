"use client";

import { useState } from "react";
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

type User = {
  name: string;
  cards: UserCard[];
};

const CARDS_PER_PAGE = 12;

export default function ProfileClient({ user }: { user: User }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(user.cards.length / CARDS_PER_PAGE)
  );

  const start = (page - 1) * CARDS_PER_PAGE;
  const currentCards = user.cards.slice(start, start + CARDS_PER_PAGE);

  return (
    <div className="p-6 font-cute bg-primary-light min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-pink-600 text-center">
        {user.name}'s Collection
      </h1>

      {user.cards.length === 0 ? (
        <p className="text-center text-pink-400">No cards yet</p>
      ) : (
        <>
          {/* Cards – SAME layout as wishlist */}
          <div className="flex flex-wrap gap-x-3 gap-y-6 justify-center">
            {currentCards.map((uc) => {
              const card = uc.card;

              return (
                <div
                  key={card.id}
                  className="
                    w-40 flex flex-col items-center
                    bg-white/70 border border-pink-200
                    rounded-2xl p-3 shadow-md
                    hover:scale-105 transition-transform
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

      {/* Add Card button */}
      <div className="flex justify-center mt-8">
        <Link
          href="/add-card"
          className="bg-pink-500 text-white px-6 py-2 rounded-xl shadow hover:bg-pink-600 transition"
        >
          Add Card
        </Link>
      </div>
    </div>
  );
}
