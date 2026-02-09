import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ wishlisted: false });
  }

  const existing = await prisma.wishlistCard.findFirst({
    where: {
      userId,
      cardId: Number(params.cardId),
    },
  });

  return NextResponse.json({ wishlisted: !!existing });
}
