import { Card } from "@prisma/client";

function CardBlock({ card, label }: { card: Card; label: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[10px] uppercase opacity-60 mb-1">{label}</p>

      <img
        src={card.image || "/placeholder.jpg"}
        className="w-20 h-28 object-cover rounded-lg shadow border"
      />

      <p className="text-xs font-bold mt-1">{card.name}</p>
      <p className="text-[10px] opacity-60">{card.member}</p>
      <p className="text-[10px] opacity-40">{card.group}</p>
      <p className="text-[10px] italic opacity-40">{card.album}</p>
    </div>
  );
}