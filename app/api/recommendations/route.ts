// app/api/recommendations/route.ts

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { scoreUsers } from "@/lib/matching";

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

  // 3. Find pre-filtered candidate users
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

  // 4. Score, filter and rank using extracted algorithm
  const scoredUsers = scoreUsers(tradingCardIds, myWishlistIds, users);

  return Response.json(scoredUsers);
}