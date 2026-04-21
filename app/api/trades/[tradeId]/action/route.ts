import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(
  req: Request,
  { params }: { params: { tradeId: string } }
) {
  try {
    const tradeId = Number(params.tradeId);
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

    const isSender = trade.senderId === decoded.id;
    const isReceiver = trade.receiverId === decoded.id;

    if (!isSender && !isReceiver) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    /* ───────── ACCEPT ───────── */
    if (action === "accept") {
      if (!isReceiver) {
        return Response.json({ error: "only receiver can accept" }, { status: 403 });
      }
      if (trade.status !== "PENDING") {
        return Response.json({ error: "trade is not pending" }, { status: 400 });
      }
      await prisma.trade.update({ where: { id: tradeId }, data: { status: "ACCEPTED" } });
      return Response.json({ success: true });
    }

    /* ───────── DECLINE ───────── */
    if (action === "decline") {
      if (trade.status !== "PENDING") {
        return Response.json({ error: "trade is not pending" }, { status: 400 });
      }
      await prisma.trade.update({ where: { id: tradeId }, data: { status: "DECLINED" } });
      return Response.json({ success: true });
    }

    /* ───────── MARK CARD SENT ───────── */
    if (action === "mark_sent") {
      await prisma.trade.update({
        where: { id: tradeId },
        data: isSender ? { senderCardSent: true } : { receiverCardSent: true },
      });

      const updated = await prisma.trade.findUnique({ where: { id: tradeId } });
      if (updated?.senderCardSent && updated.receiverCardSent) {
        await prisma.trade.update({ where: { id: tradeId }, data: { status: "CARDS_SENT" } });
      }

      return Response.json({ success: true });
    }

    /* ───────── CONFIRM RECEIVED ───────── */
    if (action === "confirm_received") {
      await prisma.trade.update({
        where: { id: tradeId },
        data: isSender ? { senderConfirmed: true } : { receiverConfirmed: true },
      });

      const updated = await prisma.trade.findUnique({ where: { id: tradeId } });

      if (updated?.senderConfirmed && updated.receiverConfirmed) {
        await prisma.$transaction(async (tx) => {
          // Sender's offered card → receiver
          await tx.userCard.deleteMany({
            where: { userId: trade.senderId, cardId: trade.offeredCardId },
          });
          await tx.userCard.createMany({
            data: [{ userId: trade.receiverId, cardId: trade.offeredCardId }],
            skipDuplicates: true,
          });

          // Receiver's requested card → sender
          await tx.userCard.deleteMany({
            where: { userId: trade.receiverId, cardId: trade.requestedCardId },
          });
          await tx.userCard.createMany({
            data: [{ userId: trade.senderId, cardId: trade.requestedCardId }],
            skipDuplicates: true,
          });

          await tx.trade.update({
            where: { id: tradeId },
            data: { status: "COMPLETED" },
          });
        });
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: "invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[trade/action]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
