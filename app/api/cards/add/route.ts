import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { cardId } = await req.json();

    if (!cardId) {
      return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
    }

    const id = Number(cardId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    // Read token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/token=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    // Check card exists
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Add card to user's collection
    const userCard = await prisma.userCard.create({
      data: { userId, cardId: id },
    });

    return NextResponse.json({ success: true, userCard });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "You already own this card!" },
        { status: 400 }
      );
    }

    console.error("ADD CARD ERROR:", error);
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
  }
}