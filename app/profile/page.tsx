// app/profile/page.tsx
import { prisma } from "@/lib/prisma";

type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  album: string;
  image: string | null;
};

type User = {
  id: number;
  name: string;
  email: string;
  cards: Card[];
};

const ProfilePage = async () => {
  // Fetch the first user from the database
  const user: User | null = await prisma.user.findFirst({
    include: { cards: true },
  });

  if (!user) {
    return <p className="p-4 text-red-500">No users found in the database</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{user.name}'s Cards</h1>

      {user.cards.length === 0 ? (
        <p className="text-gray-400">No cards yet</p>
      ) : (
        // Horizontal scrollable container
        <div className="flex gap-2 overflow-x-auto py-2">
          {user.cards.map((card) => (
            <div
              key={card.id}
              className="flex-shrink-0 w-24 flex flex-col items-center border rounded-md p-1 shadow-sm"
            >
              {card.image && (
                <img
                  src={card.image}
                  alt={`${card.member} - ${card.album}`}
                  className="w-24 h-24 object-cover rounded-md mb-1"
                />
              )}
              <p className="font-semibold text-xs text-center truncate w-full">
                {card.name}
              </p>
              <p className="text-gray-600 text-[10px] text-center truncate w-full">
                {card.member} — {card.group}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
