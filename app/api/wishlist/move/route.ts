import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  try {
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
  if (!cardId) {
    return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
  }

  const id = Number(cardId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  }

  try {
    // Remove from wishlist if exists
    await prisma.wishlistCard.deleteMany({
      where: { userId, cardId: id },
    });

    // Add to user collection
    const userCard = await prisma.userCard.create({
      data: { userId, cardId: id },
    });

    return NextResponse.json({ success: true, userCard });
  } catch (error: any) {
    if (error.code === "P2002") {
      // already in collection
      return NextResponse.json({
        error: "Card is already in your collection",
        status: 400,
      });
    }
    console.error("MOVE CARD ERROR:", error);
    return NextResponse.json({ error: "Failed to move card", status: 500 });
  }
}