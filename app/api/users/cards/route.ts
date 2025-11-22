import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { cardId } = await req.json();

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 401 }
      );
    }

    // Decode token -> userId
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.userId;

    // Prevent duplicate entries
    const existing = await prisma.userCard.findFirst({
      where: { userId, cardId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Card already in your collection" },
        { status: 400 }
      );
    }

    const add = await prisma.userCard.create({
      data: { userId, cardId },
    });

    return NextResponse.json(add);
  } catch (error) {
    console.error("Add to collection error:", error);
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
  }
}
