// app/api/trades/create/route.ts

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const { offeredCardId, requestedCardId, receiverId } = await req.json();

    if (!offeredCardId || !requestedCardId || !receiverId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify the offered card belongs to the current user (via UserCard join table)
    const offeredCard = await prisma.userCard.findFirst({
      where: {
        cardId: Number(offeredCardId),
        userId: decoded.id,
      },
    });

    if (!offeredCard) {
      return NextResponse.json(
        { error: "You don't own that card" },
        { status: 403 }
      );
    }

    // Verify the requested card belongs to the receiver
    const requestedCard = await prisma.userCard.findFirst({
      where: {
        cardId: Number(requestedCardId),
        userId: Number(receiverId),
      },
    });

    if (!requestedCard) {
      return NextResponse.json(
        { error: "Requested card not found" },
        { status: 404 }
      );
    }

    // Block if there is already an active trade between these two users
    const existingTrade = await prisma.trade.findFirst({
      where: {
        status: { notIn: ["COMPLETED", "DECLINED"] },
        OR: [
          { senderId: decoded.id,        receiverId: Number(receiverId) },
          { senderId: Number(receiverId), receiverId: decoded.id },
        ],
      },
    });

    if (existingTrade) {
      return NextResponse.json(
        { error: "There is already an active trade between you two" },
        { status: 409 }
      );
    }

    // Create trade + linked system message atomically
    const trade = await prisma.$transaction(async (tx) => {
      const newTrade = await tx.trade.create({
        data: {
          senderId:        decoded.id,
          receiverId:      Number(receiverId),
          offeredCardId:   Number(offeredCardId),
          requestedCardId: Number(requestedCardId),
          status: "PENDING",
        },
      });

      await tx.message.create({
        data: {
          senderId:   decoded.id,
          receiverId: Number(receiverId),
          content:    "📦 A trade proposal was sent.",
          tradeId:    newTrade.id,
        },
      });

      return newTrade;
    });

    return NextResponse.json(trade, { status: 201 });
  } catch (err) {
    console.error("[trades/create]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}