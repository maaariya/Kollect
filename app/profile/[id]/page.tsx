import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import AddFriendButton from "@/app/components/AddFriendButton";
import CardScroller from "@/app/components/CardScroller";

export const dynamic = "force-dynamic";

export default async function PublicProfile({
  params,
}: {
  params: { id: string };
}) {
  const profileId = Number(params.id);

  // Fetch the user with cards, wishlist, and friendship info
  const user = await prisma.user.findUnique({
    where: { id: profileId },
    include: {
      cards: { include: { card: true } },
      wishlist: { include: { card: true } },
      receivedFriendRequests: true,
      sentFriendRequests: true,
    },
  });

  if (!user) return <div className="p-10">User not found</div>;

  // Get current logged-in user from cookies
  const token = (await cookies()).get("token")?.value;
  let currentUserId: number | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
      };
      currentUserId = decoded.id;
    } catch {}
  }

  // Calculate friend count
  const friendCount =
    user.receivedFriendRequests.length +
    user.sentFriendRequests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">

      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-pink-400 to-pink-600" />

      {/* Profile Card */}
      <div className="max-w-5xl mx-auto px-6 -mt-20">

        <div className="bg-pink-200 rounded-3xl shadow-xl p-8 relative">

          {/* Avatar */}
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className="w-full h-full object-cover"
                  alt={user.name}
                />
              ) : (
                <span className="text-4xl font-bold text-pink-500">
                  {user.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div className="ml-40">
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>

            {user.bio && <p className="text-gray-600 mt-2">{user.bio}</p>}

            {/* Stats */}
            <div className="flex gap-8 mt-6 text-center">
              <div>
                <p className="text-2xl font-bold text-pink-600">
                  {user.cards.length}
                </p>
                <p className="text-sm text-gray-500">Cards</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-pink-600">
                  {user.wishlist.length}
                </p>
                <p className="text-sm text-gray-500">Wishlist</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-pink-600">{friendCount}</p>
                <p className="text-sm text-gray-500">Friends</p>
              </div>
            </div>

            {/* Action Buttons */}
            {currentUserId && currentUserId !== user.id && (
              <div className="mt-6 flex gap-4">
                <AddFriendButton
                  currentUserId={currentUserId}
                  profileUserId={user.id}
                />

                <a
                  href={`/messages/${user.id}`}
                  className="px-4 py-2 rounded-xl border border-pink-400 text-pink-600 hover:bg-pink-50 transition"
                >
                  Message
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Collection Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Collection ({user.cards.length})
          </h2>

          {user.cards.length === 0 ? (
            <p className="text-gray-500">No cards yet.</p>
          ) : (
            <CardScroller items={user.cards} variant="collection" />
          )}
        </div>

        {/* Wishlist Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Wishlist ({user.wishlist.length})
          </h2>

          {user.wishlist.length === 0 ? (
            <p className="text-gray-500">Wishlist is empty.</p>
          ) : (
            <CardScroller items={user.wishlist} variant="wishlist" />
          )}
        </div>
      </div>
    </div>
  );
}