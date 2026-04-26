"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Listing = {
  id: number;
  card: {
    id: number;
    name: string;
    member: string;
    group: string;
    album: string;
    image: string | null;
  };
  user: {
    id: number;
    name: string;
  };
};

const CARDS_PER_PAGE = 12;

export default function TradingPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadData() {
      const [tradeRes, meRes] = await Promise.all([
        fetch("/api/trading/all"),
        fetch("/api/me", { credentials: "include" }),
      ]);

      const tradeData = await tradeRes.json();

      const wishlistCardIds = meRes.ok
        ? ((await meRes.json())?.wishlist?.map((c: any) => c.id) ?? [])
        : [];

      setListings(tradeData);
      setFiltered(tradeData);
      setWishlistIds(wishlistCardIds);
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const results = listings.filter((l) =>
      `${l.card.name} ${l.card.member} ${l.card.group} ${l.card.album}`
        .toLowerCase()
        .includes(q)
    );

    setFiltered(results);
    setPage(1);
  }, [search, listings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  const currentListings = filtered.slice(
    (page - 1) * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE
  );

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <h1 className="text-4xl text-pink-dark font-bold mb-6">
          Trading Marketplace
        </h1>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by name, member, group, album..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-8 p-3 border border-pink-200 rounded-xl"
        />

        {loading && (
          <p className="text-center text-pink-400">Loading...</p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-pink-400">
            No cards currently listed.
          </p>
        )}

        <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
          {currentListings.map((listing) => {
            const wishlistMatch = wishlistIds.includes(
              listing.card.id
            );

            return (
              <div
                key={listing.id}
                className={`relative w-40 flex flex-col items-center 
                bg-white/70 border rounded-2xl p-3 shadow-md group
                ${
                  wishlistMatch
                    ? "border-pink-400 shadow-pink-200"
                    : "border-pink-200"
                }`}
              >

                {/* TRADING BADGE */}
                <div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-pink-500 text-white shadow">
                  TRADING
                </div>

                {/* WISHLIST MATCH BADGE */}
                {wishlistMatch && (
                  <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-yellow-400 text-white shadow">
                    WISHLIST
                  </div>
                )}

                <img
                  src={listing.card.image ?? "/placeholder.jpg"}
                  alt={listing.card.name}
                  className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                />

                <p className="font-semibold text-sm text-center text-pink-700">
                  {listing.card.name}
                </p>

                <p className="text-pink-500 text-xs text-center">
                  {listing.card.member} — {listing.card.group}
                </p>

                <p className="text-pink-400 text-[11px] italic text-center">
                  {listing.card.album}
                </p>

                <p className="text-pink-400 text-[11px] mt-1 text-center">
                  Listed by {listing.user.name}
                </p>

                {/* HOVER ACTIONS */}
                <div
                  className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 
                  group-hover:opacity-100 flex flex-col gap-3 items-center justify-center transition"
                >
                  <Link
                    href={`/profile/${listing.user.id}`}
                    className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm shadow hover:bg-pink-600"
                  >
                    View Profile
                  </Link>

                  <Link
                    href={`/messages/${listing.user.id}?card=${listing.card.id}`}
                    className="bg-white text-pink-600 px-4 py-2 rounded-xl text-sm shadow"
                  >
                    Message Trader
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-8">
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
      </div>
    </div>
  );
}