import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const { cardId } = await req.json();

    const ownsCard = await prisma.userCard.findUnique({
      where: { userId_cardId: { userId: decoded.id, cardId } },
    });

    if (!ownsCard) {
      return NextResponse.json({ error: "You do not own this card" }, { status: 403 });
    }

    const alreadyListed = await prisma.tradingListing.findUnique({
      where: { userId_cardId: { userId: decoded.id, cardId } },
    });

    if (alreadyListed) {
      return NextResponse.json({ error: "Card already listed for trading" }, { status: 400 });
    }

    await prisma.tradingListing.create({
      data: { userId: decoded.id, cardId },
    });

    // Notify anyone who has this card on their wishlist
    const [lister, interestedUsers] = await Promise.all([
      prisma.user.findUnique({ where: { id: decoded.id }, select: { name: true } }),
      prisma.wishlistCard.findMany({
        where: { cardId, userId: { not: decoded.id } },
        select: { userId: true },
      }),
    ]);

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { name: true },
    });

    await Promise.all(
      interestedUsers.map((w) =>
        notify(
          w.userId,
          "RECOMMENDATION",
          "Card on your wishlist is available!",
          `${lister?.name ?? "Someone"} just listed "${card?.name ?? "a card"}" for trade.`,
          "/recommendations",
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
