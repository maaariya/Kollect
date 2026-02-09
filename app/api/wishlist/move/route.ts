import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();

  try {
    // Add to collection (safe if already exists)
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

    // Remove from wishlist
    await prisma.wishlistCard.deleteMany({
      where: {
        userId,
        cardId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to move card" },
      { status: 500 }
    );
  }
}
