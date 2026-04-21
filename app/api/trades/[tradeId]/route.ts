// app/api/trades/[tradeId]/route.ts
// GET /api/trades/:tradeId
// Returns a single trade with card details (used by inline trade bubbles).

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { tradeId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const tradeId = Number(params.tradeId);

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        offeredCard: { select: { id: true, name: true, member: true } },
        requestedCard: { select: { id: true, name: true, member: true } },
      },
    });

    if (!trade) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only participants can see the trade
    if (trade.senderId !== decoded.id && trade.receiverId !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(trade);
  } catch (err) {
    console.error("[trades/tradeId]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}