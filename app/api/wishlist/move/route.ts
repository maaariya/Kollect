import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function getUserId(req: Request): number | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();

  if (!cardId) {
    return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
  }

  try {
    // 1. Add to collection (ignore if already exists)
    await prisma.userCard.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
      update: {},
      create: {
        userId,
        cardId,
      },
    });

    // 2. REMOVE from wishlist
    await prisma.wishlistCard.delete({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to move card" },
      { status: 500 }
    );
  }
}
