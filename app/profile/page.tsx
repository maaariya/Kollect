// app/profile/page.tsx
import { prisma } from "@/lib/prisma";

// ---------- TYPES ----------
type Card = {
  id: number;
  name: string;
  member: string;
  group: string;
  album: string;
  image: string | null;
};

type UserCard = {
  id: number;
  userId: number;
  cardId: number;
  card: Card;
};

type User = {
  id: number;
  name: string;
  email: string;
  cards: UserCard[];
};

// ---------- PAGE ----------
const ProfilePage = async () => {
  const user: User | null = await prisma.user.findFirst({
    include: {
      cards: {
        include: {
          card: true, // important
        },
      },
    },
  });

  if (!user) {
    return <p className="p-4 text-red-500">No users found in the database</p>;
  }

  const userCards = user.cards; // shorter reference

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-pink-600 drop-shadow-sm">
        {user.name}'s Cards
      </h1>

      {userCards.length === 0 ? (
        <p className="text-pink-400">No cards yet</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto py-4">
          {userCards.map((uc: UserCard) => {
            const card = uc.card;

            return (
              <div
                key={card.id}
                className="flex-shrink-0 w-40 flex flex-col items-center 
                bg-white/70 border border-pink-200 
                rounded-2xl p-3 shadow-md
                hover:scale-[1.05] transition-transform duration-200"
              >
                {card.image && (
                  <img
                    src={card.image}
                    alt={`${card.member} - ${card.album}`}
                    className="w-full h-48 object-cover rounded-xl mb-2 shadow-sm"
                  />
                )}

                <p className="font-semibold text-sm text-center truncate w-full text-pink-700">
                  {card.name}
                </p>

                <p className="text-pink-500 text-xs text-center truncate w-full">
                  {card.member} — {card.group}
                </p>

                <p className="text-pink-400 text-[11px] italic text-center truncate w-full">
                  {card.album}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <a
        href="/add-card"
        className="inline-block bg-pink-500 text-white px-4 py-2 rounded-xl shadow hover:bg-pink-600 transition"
      >
        + Add Card
      </a>
    </div>
  );
};

export default ProfilePage;
