"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollingCards() {
  const [cards, setCards] = useState<any[]>([]);
  const [columns, setColumns] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function calculate() {
      const cardWidth = 160; // w-40
      const gap = 16;        // mx-2 × 2
      const totalCardWidth = cardWidth + gap;
      const screenWidth = window.innerWidth;
      setColumns(Math.max(1, Math.floor(screenWidth / totalCardWidth)));
    }

    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, []);

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

  if (!cards.length || columns === null) return null;

  const getRandomisedCards = () => {
    const start = Math.floor(Math.random() * cards.length);
    const rotated = [...cards.slice(start), ...cards.slice(0, start)];
    return [...rotated, ...rotated, ...rotated];
  };

  return (
    <div ref={containerRef} className="absolute inset-0 flex overflow-hidden pointer-events-none z-0 opacity-30">
      {Array.from({ length: columns }).map((_, colIndex) => {
        const columnCards = getRandomisedCards();

        return (
          <div
            key={colIndex}
            className={`flex flex-col gap-6 mx-2 ${
              colIndex % 2 === 0 ? "animate-scroll-up" : "animate-scroll-down"
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