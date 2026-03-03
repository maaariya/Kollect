"use client";

export default function CardScroller({
  items,
  variant,
}: {
  items: any[];
  variant: "collection" | "wishlist";
}) {
  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => {
          const card = item.card;

          return (
            <div
              key={item.id}
              className={`min-w-[180px] rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden ${
                variant === "wishlist"
                  ? "bg-pink-50 border border-pink-200"
                  : "bg-white"
              }`}
            >
              <img
                src={card.image || "/placeholder.jpg"}
                className="w-full h-60 object-cover"
              />

              <div className="p-3">
                <p className="font-semibold text-sm">{card.member}</p>
                <p className="text-xs text-gray-500">
                  {card.group} — {card.album}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}