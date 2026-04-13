// app/api/trades/[tradeId]/action/route.ts
//
// Handles all trade state transitions:
//   accept           PENDING       → ACCEPTED
//   decline          PENDING       → DECLINED
//   pay_deposit      ACCEPTED      → DEPOSIT_PAID  (advances when both have paid)
//   mark_sent        DEPOSIT_PAID  → CARDS_SENT    (advances when both have sent)
//   confirm_received CARDS_SENT    → COMPLETED     (advances when both confirm)

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

type Action =
  | "accept"
  | "decline"
  | "pay_deposit"
  | "mark_sent"
  | "confirm_received";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tradeId: string }> }
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

    const { tradeId: tradeIdParam } = await params;
    const tradeId = Number(tradeIdParam);
    const { action }: { action: Action } = await req.json();

    const trade = await prisma.trade.findUnique({ where: { id: tradeId } });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const isSender   = trade.senderId   === decoded.id;
    const isReceiver = trade.receiverId === decoded.id;

    if (!isSender && !isReceiver) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Helper: the other participant's id
    const otherId = isSender ? trade.receiverId : trade.senderId;

    // ── accept ───────────────────────────────────────────────────────────────
    if (action === "accept") {
      if (trade.status !== "PENDING") {
        return NextResponse.json({ error: "Trade is not pending" }, { status: 400 });
      }
      if (!isReceiver) {
        return NextResponse.json({ error: "Only the receiver can accept" }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.update({
          where: { id: tradeId },
          data: { status: "ACCEPTED" },
        });
        await tx.message.create({
          data: {
            senderId:   decoded.id,
            receiverId: otherId,
            content:    "Trade accepted! Both users must now pay the £5 deposit.",
            tradeId:    trade.id,
          },
        });
        return t;
      });

      return NextResponse.json(updated);
    }

    // ── decline ──────────────────────────────────────────────────────────────
    if (action === "decline") {
      if (trade.status !== "PENDING") {
        return NextResponse.json({ error: "Trade is not pending" }, { status: 400 });
      }
      if (!isReceiver) {
        return NextResponse.json({ error: "Only the receiver can decline" }, { status: 403 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.update({
          where: { id: tradeId },
          data: { status: "DECLINED" },
        });
        await tx.message.create({
          data: {
            senderId:   decoded.id,
            receiverId: otherId,
            content:    "Trade declined.",
            tradeId:    trade.id,
          },
        });
        return t;
      });

      return NextResponse.json(updated);
    }

    // ── pay_deposit ───────────────────────────────────────────────────────────
    if (action === "pay_deposit") {
      if (trade.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Trade must be accepted first" }, { status: 400 });
      }

      const alreadyPaid = isSender ? trade.senderDepositPaid : trade.receiverDepositPaid;
      if (alreadyPaid) {
        return NextResponse.json({ error: "You have already paid" }, { status: 400 });
      }

      const updateData = isSender
        ? { senderDepositPaid: true }
        : { receiverDepositPaid: true };

      const otherPaid = isSender ? trade.receiverDepositPaid : trade.senderDepositPaid;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.update({
          where: { id: tradeId },
          data: {
            ...updateData,
            ...(otherPaid ? { status: "DEPOSIT_PAID" } : {}),
          },
        });

        if (otherPaid) {
          await tx.message.create({
            data: {
              senderId:   decoded.id,
              receiverId: otherId,
              content:    "Both deposits received! Please post your cards now.",
              tradeId:    trade.id,
            },
          });
        }

        return t;
      });

      return NextResponse.json(updated);
    }

    // ── mark_sent ─────────────────────────────────────────────────────────────
    if (action === "mark_sent") {
      if (trade.status !== "DEPOSIT_PAID") {
        return NextResponse.json({ error: "Deposits must be paid first" }, { status: 400 });
      }

      const alreadySent = isSender ? trade.senderCardSent : trade.receiverCardSent;
      if (alreadySent) {
        return NextResponse.json({ error: "Already marked as sent" }, { status: 400 });
      }

      const updateData = isSender
        ? { senderCardSent: true }
        : { receiverCardSent: true };

      const otherSent = isSender ? trade.receiverCardSent : trade.senderCardSent;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.update({
          where: { id: tradeId },
          data: {
            ...updateData,
            ...(otherSent ? { status: "CARDS_SENT" } : {}),
          },
        });

        if (otherSent) {
          await tx.message.create({
            data: {
              senderId:   decoded.id,
              receiverId: otherId,
              content:    "Both cards are on their way! Confirm when yours arrives.",
              tradeId:    trade.id,
            },
          });
        }

        return t;
      });

      return NextResponse.json(updated);
    }

    // ── confirm_received ──────────────────────────────────────────────────────
    if (action === "confirm_received") {
      if (trade.status !== "CARDS_SENT") {
        return NextResponse.json({ error: "Cards must be sent first" }, { status: 400 });
      }

      const alreadyConfirmed = isSender ? trade.senderConfirmed : trade.receiverConfirmed;
      if (alreadyConfirmed) {
        return NextResponse.json({ error: "Already confirmed" }, { status: 400 });
      }

      const updateData = isSender
        ? { senderConfirmed: true }
        : { receiverConfirmed: true };

      const otherConfirmed = isSender ? trade.receiverConfirmed : trade.senderConfirmed;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trade.update({
          where: { id: tradeId },
          data: {
            ...updateData,
            ...(otherConfirmed ? { status: "COMPLETED" } : {}),
          },
        });

        if (otherConfirmed) {
          // TODO: trigger PayPal deposit refund for both users here
          await tx.message.create({
            data: {
              senderId:   decoded.id,
              receiverId: otherId,
              content:    "Trade complete! Both deposits have been returned. Enjoy your new cards!",
              tradeId:    trade.id,
            },
          });
        }

        return t;
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[trades/action]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}