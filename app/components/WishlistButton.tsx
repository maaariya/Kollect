"use client";

import { useEffect, useState } from "react";

type Props = {
  cardId: number;
};

export default function WishlistButton({ cardId }: Props) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetch("/api/wishlist")
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) {
          setIsWishlisted(data.some((item) => item.card?.id === cardId));
        }
      });
  }, [cardId]);

  async function toggleWishlist() {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });

    if (res.status === 401) return alert("Please log in");

    const data = await res.json();
    setIsWishlisted(data.wishlisted);
  }

  return (
    <button
      onClick={toggleWishlist}
      className={`mt-2 px-3 py-1 rounded-xl text-sm ${
        isWishlisted
          ? "bg-red-500 text-white"
          : "bg-gray-200 text-gray-800"
      }`}
    >
      {isWishlisted ? "Wishlisted" : "Wishlist"}
    </button>
  );
}
