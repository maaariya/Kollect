// lib/trade.ts

import { TradeStatus } from "@prisma/client";

export type TradeLike = {
  id: number;
  senderId: number;
  receiverId: number;
  offeredCardId: number;
  requestedCardId: number;
  status: TradeStatus;
  senderDepositPaid: boolean;
  receiverDepositPaid: boolean;
  senderCardSent: boolean;
  receiverCardSent: boolean;
  senderConfirmed: boolean;
  receiverConfirmed: boolean;
};

export type ActionResult =
  | { success: true; nextStatus?: TradeStatus; flagUpdate?: Partial<TradeLike> }
  | { error: string; status: number };

export function applyTradeAction(
  trade: TradeLike,
  userId: number,
  action: string
): ActionResult {
  const isSender = trade.senderId === userId;
  const isReceiver = trade.receiverId === userId;

  if (!isSender && !isReceiver) {
    return { error: "forbidden", status: 403 };
  }

  // ── ACCEPT ──────────────────────────────────────────────────────────
  if (action === "accept") {
    if (!isReceiver) return { error: "only receiver can accept", status: 403 };
    if (trade.status !== "PENDING") return { error: "trade is not pending", status: 400 };
    return { success: true, nextStatus: "ACCEPTED" };
  }

  // ── DECLINE ─────────────────────────────────────────────────────────
  if (action === "decline") {
    if (trade.status !== "PENDING") return { error: "trade is not pending", status: 400 };
    return { success: true, nextStatus: "DECLINED" };
  }

  // ── MARK SENT ───────────────────────────────────────────────────────
  if (action === "mark_sent") {
    const flagUpdate = isSender
      ? { senderCardSent: true }
      : { receiverCardSent: true };

    const updatedSenderSent = isSender ? true : trade.senderCardSent;
    const updatedReceiverSent = isReceiver ? true : trade.receiverCardSent;
    const bothSent = updatedSenderSent && updatedReceiverSent;

    return {
      success: true,
      flagUpdate,
      nextStatus: bothSent ? "CARDS_SENT" : undefined,
    };
  }

  // ── CONFIRM RECEIVED ────────────────────────────────────────────────
  if (action === "confirm_received") {
    const flagUpdate = isSender
      ? { senderConfirmed: true }
      : { receiverConfirmed: true };

    const updatedSenderConfirmed = isSender ? true : trade.senderConfirmed;
    const updatedReceiverConfirmed = isReceiver ? true : trade.receiverConfirmed;
    const bothConfirmed = updatedSenderConfirmed && updatedReceiverConfirmed;

    return {
      success: true,
      flagUpdate,
      nextStatus: bothConfirmed ? "COMPLETED" : undefined,
    };
  }

  // ── DISPUTE ─────────────────────────────────────────────────────────
  if (action === "dispute") {
    if (trade.status !== "DEPOSIT_PAID") {
      return { error: "can only dispute a DEPOSIT_PAID trade", status: 400 };
    }
    return { success: true, nextStatus: "DISPUTED" as TradeStatus };
  }

  return { error: "invalid action", status: 400 };
}