import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: number;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };
    userId = decoded.id;
  } catch {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // 1. My trading cards
  const myTrading = await prisma.tradingListing.findMany({
    where: { userId },
    select: { cardId: true },
  });

  const tradingCardIds = myTrading.map(t => t.cardId);

  // 2. My wishlist
  const myWishlist = await prisma.wishlistCard.findMany({
    where: { userId },
    select: { cardId: true },
  });

  const myWishlistIds = myWishlist.map(w => w.cardId);

  // 3. Find matching users
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      wishlist: {
        some: {
          cardId: { in: tradingCardIds },
        },
      },
    },
    include: {
      wishlist: true,
      tradingListings: true,
    },
  });

  // 4. Score users
  const scoredUsers = users
  .map(user => {
    const theirWishlistIds = user.wishlist.map(w => w.cardId);
    const theirTradingIds = user.tradingListings.map(t => t.cardId);

    const iHaveWhatTheyWant = theirWishlistIds.filter(id =>
      tradingCardIds.includes(id)
    ).length;

    const theyHaveWhatIWant = theirTradingIds.filter(id =>
      myWishlistIds.includes(id)
    ).length;

    const score =
      (iHaveWhatTheyWant * 1) +
      (theyHaveWhatIWant * 3) +
      (theirTradingIds.length * 0.2);

    return {
      user,
      score,
      iHaveWhatTheyWant,
      theyHaveWhatIWant,
    };
  })
  .filter(u => u.theyHaveWhatIWant > 0)
  .filter(u => u.score >= 2)
  .sort((a, b) => b.score - a.score);

  // 5. Sort best matches first
  scoredUsers.sort((a, b) => b.score - a.score);

  return Response.json(scoredUsers);
}