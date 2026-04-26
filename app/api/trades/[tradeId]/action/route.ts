// app/api/trades/[tradeId]/action/route.ts

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { applyTradeAction } from "@/lib/trade";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId: tradeIdStr } = await params;
    const tradeId = Number(tradeIdStr);
    const { action } = await req.json();

    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
    if (!trade) {
      return Response.json({ error: "not found" }, { status: 404 });
    }

    // Apply pure state machine logic
    const result = applyTradeAction(trade, decoded.id, action);

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    // Apply flag update if any
    if (result.flagUpdate) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: result.flagUpdate,
      });
    }

    // Apply status transition if triggered.
    // DISPUTED lands here too — no card transfer, no escrow release, status update only.
    if (result.nextStatus && result.nextStatus !== "COMPLETED") {
      await prisma.trade.update({
        where: { id: tradeId },
        data: { status: result.nextStatus },
      });
    }

    // COMPLETED requires atomic card transfer transaction
    if (result.nextStatus === "COMPLETED") {
      await prisma.$transaction(async (tx) => {
        // Transfer offeredCard: sender → receiver
        await tx.userCard.deleteMany({
          where: { userId: trade.senderId, cardId: trade.offeredCardId },
        });
        await tx.userCard.createMany({
          data: [{ userId: trade.receiverId, cardId: trade.offeredCardId }],
          skipDuplicates: true,
        });

        // Transfer requestedCard: receiver → sender
        await tx.userCard.deleteMany({
          where: { userId: trade.receiverId, cardId: trade.requestedCardId },
        });
        await tx.userCard.createMany({
          data: [{ userId: trade.senderId, cardId: trade.requestedCardId }],
          skipDuplicates: true,
        });

        // Remove both cards from the marketplace for their previous owners
        await tx.tradingListing.deleteMany({
          where: { userId: trade.senderId, cardId: trade.offeredCardId },
        });
        await tx.tradingListing.deleteMany({
          where: { userId: trade.receiverId, cardId: trade.requestedCardId },
        });

        await tx.trade.update({
          where: { id: tradeId },
          data: { status: "COMPLETED" },
        });

        await tx.message.create({
          data: {
            senderId: trade.senderId,
            receiverId: trade.receiverId,
            content: "Your deposits have been released. Trade complete!",
            tradeId,
          },
        });
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[trade/action]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}