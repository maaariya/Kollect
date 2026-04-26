import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(req: Request): number | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/token=([^;]+)/);
  const token = match?.[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ wishlisted: false });

  const existing = await prisma.wishlistCard.findFirst({
    where: { userId, cardId: Number(cardId) },
  });

  return NextResponse.json({ wishlisted: !!existing });
}