import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const { cardId } = await req.json();

    // ✅ Check ownership THROUGH UserCard table
    const ownsCard = await prisma.userCard.findUnique({
      where: {
        userId_cardId: {
          userId: decoded.id,
          cardId: cardId,
        },
      },
    });

    if (!ownsCard) {
      return NextResponse.json(
        { error: "You do not own this card" },
        { status: 403 }
      );
    }

    // ✅ Prevent duplicate trading listing
    const alreadyListed = await prisma.tradingListing.findUnique({
      where: {
        userId_cardId: {
          userId: decoded.id,
          cardId: cardId,
        },
      },
    });

    if (alreadyListed) {
      return NextResponse.json(
        { error: "Card already listed for trading" },
        { status: 400 }
      );
    }

    // ✅ Create listing
    await prisma.tradingListing.create({
      data: {
        userId: decoded.id,
        cardId: cardId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}