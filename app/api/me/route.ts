import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(null, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        cards: {
          include: { card: true },
        },
        wishlist: {
          include: { card: true },
        },
        tradingListings: true,
      },
    });

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    const tradingCardIds = user.tradingListings.map(
      (t) => t.cardId
    );

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      cards: user.cards.map((uc) => ({
        ...uc.card,
        isTrading: tradingCardIds.includes(uc.card.id),
      })),
      wishlist: user.wishlist.map((w) => w.card),
    });
  } catch (error) {
    console.error("ME ROUTE ERROR:", error);
    return NextResponse.json(null, { status: 401 });
  }
}