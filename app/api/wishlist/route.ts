import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId } = await req.json();

  const exists = await prisma.wishlistCard.findFirst({
    where: { userId, cardId },
  });

  if (exists) {
    return NextResponse.json(
      { error: "Already in wishlist" },
      { status: 400 }
    );
  }

  await prisma.wishlistCard.create({
    data: { userId, cardId },
  });

  return NextResponse.json({ success: true });
}


export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlist = await prisma.wishlistCard.findMany({
    where: { userId },
    include: {
      card: true, // ⭐ fetch full card data
    },
  });

  return NextResponse.json({ wishlist });
}
