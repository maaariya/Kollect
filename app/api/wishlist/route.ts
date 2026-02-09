import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };
    return decoded.id;
  } catch {
    return null;
  }
}

// Add to wishlist
export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();

  const existing = await prisma.wishlistCard.findFirst({
    where: { userId, cardId },
  });

  if (existing) {
    return NextResponse.json({ success: true });
  }

  await prisma.wishlistCard.create({
    data: { userId, cardId },
  });

  return NextResponse.json({ success: true });
}

// Get wishlist
export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlist = await prisma.wishlistCard.findMany({
    where: { userId },
    include: { card: true },
  });

  return NextResponse.json(wishlist);
}
