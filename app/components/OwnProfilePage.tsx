"use client";

import { useState } from "react";

const CARDS_PER_PAGE = 8;

export default function OwnProfilePages({ user }: any) {
  const [collectionPage, setCollectionPage] = useState(0);
  const [wishlistPage, setWishlistPage] = useState(0);

  const collectionPages = Math.ceil(user.cards.length / CARDS_PER_PAGE);
  const wishlistPages = Math.ceil(user.wishlist.length / CARDS_PER_PAGE);

  const paginatedCollection = user.cards.slice(
    collectionPage * CARDS_PER_PAGE,
    (collectionPage + 1) * CARDS_PER_PAGE
  );

  const paginatedWishlist = user.wishlist.slice(
    wishlistPage * CARDS_PER_PAGE,
    (wishlistPage + 1) * CARDS_PER_PAGE
  );

  return (
    <div className="mt-16 space-y-20">

      {/* COLLECTION */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Collection ({user.cards.length})
        </h2>

        {user.cards.length === 0 ? (
          <p className="text-gray-500">No cards yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {paginatedCollection.map((uc: any) => (
                <div
                  key={uc.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <img
                    src={uc.card.image || "/placeholder.jpg"}
                    className="w-full h-60 object-cover"
                  />
                  <div className="p-3">
                    <p className="font-semibold text-sm">
                      {uc.card.member}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uc.card.group} — {uc.card.album}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {collectionPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  disabled={collectionPage === 0}
                  onClick={() => setCollectionPage((p) => p - 1)}
                  className="px-4 py-2 bg-pink-200 rounded-xl disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="font-medium text-gray-700">
                  Page {collectionPage + 1} of {collectionPages}
                </span>

                <button
                  disabled={collectionPage === collectionPages - 1}
                  onClick={() => setCollectionPage((p) => p + 1)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* WISHLIST */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Wishlist ({user.wishlist.length})
        </h2>

        {user.wishlist.length === 0 ? (
          <p className="text-gray-500">Wishlist is empty.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {paginatedWishlist.map((w: any) => (
                <div
                  key={w.id}
                  className="bg-pink-50 border border-pink-200 rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <img
                    src={w.card.image || "/placeholder.jpg"}
                    className="w-full h-60 object-cover"
                  />
                  <div className="p-3">
                    <p className="font-semibold text-sm">
                      {w.card.member}
                    </p>
                    <p className="text-xs text-gray-500">
                      {w.card.group} — {w.card.album}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {wishlistPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  disabled={wishlistPage === 0}
                  onClick={() => setWishlistPage((p) => p - 1)}
                  className="px-4 py-2 bg-pink-200 rounded-xl disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="font-medium text-gray-700">
                  Page {wishlistPage + 1} of {wishlistPages}
                </span>

                <button
                  disabled={wishlistPage === wishlistPages - 1}
                  onClick={() => setWishlistPage((p) => p + 1)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-xl disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}