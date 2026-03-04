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

export default function TradingPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const res = await fetch("/api/trading/all");
      const data = await res.json();
      setListings(data);
      setLoading(false);
    }

    fetchListings();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-primary-light font-cute">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl text-pink-dark font-bold mb-10">
          Trading Marketplace
        </h1>

        {loading && (
          <p className="text-center text-pink-400">Loading...</p>
        )}

        {!loading && listings.length === 0 && (
          <p className="text-center text-pink-400">
            No cards currently listed for trading.
          </p>
        )}

        <div className="flex flex-wrap gap-y-6 gap-x-3 justify-center">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="relative w-40 flex flex-col items-center 
                bg-white/70 border border-pink-200 
                rounded-2xl p-3 shadow-md group"
            >
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

              {/* Hover Overlay */}
              <div
                className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 
                group-hover:opacity-100 flex items-center justify-center transition"
              >
                <Link
                  href={`/profile/${listing.user.id}`}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm shadow-md hover:bg-pink-600 transition"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}