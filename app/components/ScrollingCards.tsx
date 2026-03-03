"use client";

import { useEffect, useState } from "react";

export default function ScrollingCards() {
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch("/api/cards/public");
        if (!res.ok) return;
        const data = await res.json();
        setCards(data.cards.filter((c: any) => c.image));
      } catch (err) {
        console.log(err);
      }
    }

    loadCards();
  }, []);

  if (!cards.length) return null;

  const columns = 8;

  // 🔥 Function to randomise start point
  const getRandomisedCards = () => {
    const start = Math.floor(Math.random() * cards.length);
    const rotated = [...cards.slice(start), ...cards.slice(0, start)];
    return [...rotated, ...rotated, ...rotated]; // keep infinite loop
  };

  return (
    <div className="absolute inset-0 flex overflow-hidden pointer-events-none z-0 opacity-30">
      {Array.from({ length: columns }).map((_, colIndex) => {
        const columnCards = getRandomisedCards();

        return (
          <div
            key={colIndex}
            className={`flex flex-col gap-6 mx-2 ${
              colIndex % 2 === 0
                ? "animate-scroll-up"
                : "animate-scroll-down"
            }`}
          >
            {columnCards.map((card, i) => (
              <img
                key={`${colIndex}-${i}`}
                src={card.image}
                alt="photocard"
                className="w-40 h-56 object-cover rounded-xl shadow-lg"
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}