"use client";

import { useEffect, useState } from "react";

type Props = {
  cardId: number;
};

export default function WishlistButton({ cardId }: Props) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/wishlist", {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIsWishlisted(data.some((item) => item.cardId === cardId));
        }
      });
  }, [cardId]);

  async function toggleWishlist() {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in");

    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ cardId }),
    });

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
