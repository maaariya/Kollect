"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  image: string | null;
};

type Recommendation = {
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  score: number;
  matchingCardsTheyWant: Card[];
  matchingCardsYouWant: Card[];
};

export default function RecommendationsPage() {
  const [users, setUsers] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetch("/api/recommendations", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-pink-50 to-white">
      
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-pink-600 mb-8">
        🔍 Best Trade Matches
      </h1>

      {users.length === 0 ? (
        <p className="text-gray-500">
          No good matches yet — add more trading cards!
        </p>
      ) : (
        <div className="space-y-6">

          {users.map((rec) => (
            <div
              key={rec.user.id}
              className="bg-white rounded-2xl shadow-md p-5 hover:shadow-lg transition"
            >
              
              {/* TOP ROW */}
              <div className="flex items-center justify-between mb-4">

                {/* USER */}
                <Link
                  href={`/profile/${rec.user.id}`}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center overflow-hidden">
                    {rec.user.avatarUrl ? (
                      <img
                        src={rec.user.avatarUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-pink-600">
                        {rec.user.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-bold text-lg">
                      {rec.user.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Match Score: {rec.score.toFixed(1)}
                    </p>
                  </div>
                </Link>

                {/* ACTION */}
                <Link
                  href={`/profile/${rec.user.id}`}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-600"
                >
                  View Profile
                </Link>
              </div>

              {/* MATCH DETAILS */}
              <div className="grid grid-cols-2 gap-4">

                {/* THEY WANT */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    🎁 They want from you
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {(rec.matchingCardsTheyWant ?? []).slice(0, 4).map((card) => (
                      <img
                        key={card.id}
                        src={card.image ?? "/placeholder.jpg"}
                        className="w-16 h-20 object-cover rounded-lg border"
                        title={card.name}
                      />
                    ))}
                  </div>
                </div>

                {/* YOU WANT */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    🔄 You want from them
                  </p>

                  <div className="flex gap-2 flex-wrap">
                    {(rec.matchingCardsYouWant ?? []).slice(0, 4).map((card) => (
                      <img
                        key={card.id}
                        src={card.image ?? "/placeholder.jpg"}
                        className="w-16 h-20 object-cover rounded-lg border"
                        title={card.name}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}