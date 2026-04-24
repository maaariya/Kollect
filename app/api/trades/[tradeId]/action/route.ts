import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { notify } from "@/lib/notify";

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

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        sender:   { select: { name: true } },
        receiver: { select: { name: true } },
      },
    });

    if (!trade) {
      return Response.json({ error: "not found" }, { status: 404 });
    }

    const isSender   = trade.senderId   === decoded.id;
    const isReceiver = trade.receiverId === decoded.id;

    if (!isSender && !isReceiver) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const senderName   = trade.sender.name;
    const receiverName = trade.receiver.name;
    const tradeLink    = `/messages/${isSender ? trade.receiverId : trade.senderId}`;

    /* ───────── ACCEPT ───────── */
    if (action === "accept") {
      if (!isReceiver) return Response.json({ error: "only receiver can accept" }, { status: 403 });
      if (trade.status !== "PENDING") return Response.json({ error: "trade is not pending" }, { status: 400 });

      await prisma.trade.update({ where: { id: tradeId }, data: { status: "ACCEPTED" } });

      await notify(
        trade.senderId,
        "TRADE_ACCEPTED",
        "Trade accepted!",
        `${receiverName} accepted your trade proposal. Pay your deposit to proceed.`,
        tradeLink,
      );

      return Response.json({ success: true });
    }

    /* ───────── DECLINE ───────── */
    if (action === "decline") {
      if (trade.status !== "PENDING") return Response.json({ error: "trade is not pending" }, { status: 400 });

      await prisma.trade.update({ where: { id: tradeId }, data: { status: "DECLINED" } });

      // Notify the sender; if the receiver declined, notify sender — if sender cancelled, notify receiver
      const notifyUserId = isSender ? trade.receiverId : trade.senderId;
      const declinerName = isSender ? senderName : receiverName;

      await notify(
        notifyUserId,
        "TRADE_DECLINED",
        "Trade declined",
        `${declinerName} declined the trade proposal.`,
        `/messages/${decoded.id}`,
      );

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

      // Notify the other person that a card is on the way
      const otherUserId  = isSender ? trade.receiverId : trade.senderId;
      const senderOfCard = isSender ? senderName : receiverName;

      await notify(
        otherUserId,
        "TRADE_CARD_SENT",
        "Card on its way!",
        `${senderOfCard} has marked their card as sent. Confirm once yours arrives.`,
        tradeLink,
      );

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
          await tx.userCard.deleteMany({ where: { userId: trade.senderId,   cardId: trade.offeredCardId   } });
          await tx.userCard.createMany({ data: [{ userId: trade.receiverId, cardId: trade.offeredCardId   }], skipDuplicates: true });
          await tx.userCard.deleteMany({ where: { userId: trade.receiverId, cardId: trade.requestedCardId } });
          await tx.userCard.createMany({ data: [{ userId: trade.senderId,   cardId: trade.requestedCardId }], skipDuplicates: true });
          await tx.trade.update({ where: { id: tradeId }, data: { status: "COMPLETED" } });
        });

        // Notify the OTHER user (current user already knows they just confirmed)
        const otherUserId = isSender ? trade.receiverId : trade.senderId;
        await notify(
          otherUserId,
          "TRADE_COMPLETED",
          "Trade complete! 🎉",
          `Your trade with ${isSender ? receiverName : senderName} is done. Enjoy your new card!`,
          `/messages/${decoded.id}`,
        );
      } else {
        // One side confirmed — nudge the other to confirm
        const otherUserId   = isSender ? trade.receiverId : trade.senderId;
        const confirmerName = isSender ? senderName : receiverName;

        await notify(
          otherUserId,
          "TRADE_CONFIRM_PENDING",
          "Confirm your card received",
          `${confirmerName} confirmed receipt — confirm yours to complete the trade.`,
          tradeLink,
        );
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: "invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[trade/action]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
