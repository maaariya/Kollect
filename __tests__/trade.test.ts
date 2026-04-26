// __tests__/trade.test.ts

import { applyTradeAction, TradeLike } from "../lib/trade";
import { TradeStatus } from "@prisma/client";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTrade(overrides: Partial<TradeLike> = {}): TradeLike {
  return {
    id: 1,
    senderId: 10,
    receiverId: 20,
    offeredCardId: 100,
    requestedCardId: 200,
    status: "PENDING" as TradeStatus,
    senderDepositPaid: false,
    receiverDepositPaid: false,
    senderCardSent: false,
    receiverCardSent: false,
    senderConfirmed: false,
    receiverConfirmed: false,
    ...overrides,
  };
}

// ── authorisation ─────────────────────────────────────────────────────────────

describe("applyTradeAction — authorisation", () => {

  test("returns forbidden if user is neither sender nor receiver", () => {
    const trade = makeTrade();
    const result = applyTradeAction(trade, 999, "accept");
    expect(result).toEqual({ error: "forbidden", status: 403 });
  });

  test("allows sender to perform actions", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 10, "decline");
    expect("success" in result).toBe(true);
  });

  test("allows receiver to perform actions", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 20, "accept");
    expect("success" in result).toBe(true);
  });

});

// ── accept ────────────────────────────────────────────────────────────────────

describe("applyTradeAction — accept", () => {

  test("receiver can accept a PENDING trade", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 20, "accept");
    expect(result).toEqual({ success: true, nextStatus: "ACCEPTED" });
  });

  test("sender cannot accept their own trade", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 10, "accept");
    expect(result).toEqual({ error: "only receiver can accept", status: 403 });
  });

  test("cannot accept a non-PENDING trade", () => {
    const trade = makeTrade({ status: "ACCEPTED" });
    const result = applyTradeAction(trade, 20, "accept");
    expect(result).toEqual({ error: "trade is not pending", status: 400 });
  });

  test("cannot accept a DECLINED trade", () => {
    const trade = makeTrade({ status: "DECLINED" });
    const result = applyTradeAction(trade, 20, "accept");
    expect(result).toEqual({ error: "trade is not pending", status: 400 });
  });

  test("cannot accept a COMPLETED trade", () => {
    const trade = makeTrade({ status: "COMPLETED" });
    const result = applyTradeAction(trade, 20, "accept");
    expect(result).toEqual({ error: "trade is not pending", status: 400 });
  });

});

// ── decline ───────────────────────────────────────────────────────────────────

describe("applyTradeAction — decline", () => {

  test("receiver can decline a PENDING trade", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 20, "decline");
    expect(result).toEqual({ success: true, nextStatus: "DECLINED" });
  });

  test("sender can also decline their own PENDING trade", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 10, "decline");
    expect(result).toEqual({ success: true, nextStatus: "DECLINED" });
  });

  test("cannot decline a non-PENDING trade", () => {
    const trade = makeTrade({ status: "ACCEPTED" });
    const result = applyTradeAction(trade, 20, "decline");
    expect(result).toEqual({ error: "trade is not pending", status: 400 });
  });

});

// ── mark_sent ─────────────────────────────────────────────────────────────────

describe("applyTradeAction — mark_sent", () => {

  test("sender marking sent sets senderCardSent flag", () => {
    const trade = makeTrade({ status: "DEPOSIT_PAID" });
    const result = applyTradeAction(trade, 10, "mark_sent");
    expect("success" in result && result.flagUpdate).toEqual({ senderCardSent: true });
  });

  test("receiver marking sent sets receiverCardSent flag", () => {
    const trade = makeTrade({ status: "DEPOSIT_PAID" });
    const result = applyTradeAction(trade, 20, "mark_sent");
    expect("success" in result && result.flagUpdate).toEqual({ receiverCardSent: true });
  });

  test("does NOT transition to CARDS_SENT if only sender has sent", () => {
    const trade = makeTrade({ senderCardSent: false, receiverCardSent: false });
    const result = applyTradeAction(trade, 10, "mark_sent");
    expect("success" in result && result.nextStatus).toBeUndefined();
  });

  test("does NOT transition to CARDS_SENT if only receiver has sent", () => {
    const trade = makeTrade({ senderCardSent: false, receiverCardSent: false });
    const result = applyTradeAction(trade, 20, "mark_sent");
    expect("success" in result && result.nextStatus).toBeUndefined();
  });

  test("transitions to CARDS_SENT when both have sent", () => {
    // sender already sent, now receiver marks sent
    const trade = makeTrade({ senderCardSent: true, receiverCardSent: false });
    const result = applyTradeAction(trade, 20, "mark_sent");
    expect("success" in result && result.nextStatus).toBe("CARDS_SENT");
  });

  test("transitions to CARDS_SENT when sender is last to mark sent", () => {
    const trade = makeTrade({ senderCardSent: false, receiverCardSent: true });
    const result = applyTradeAction(trade, 10, "mark_sent");
    expect("success" in result && result.nextStatus).toBe("CARDS_SENT");
  });

});

// ── confirm_received ──────────────────────────────────────────────────────────

describe("applyTradeAction — confirm_received", () => {

  test("sender confirming sets senderConfirmed flag", () => {
    const trade = makeTrade({ status: "CARDS_SENT" });
    const result = applyTradeAction(trade, 10, "confirm_received");
    expect("success" in result && result.flagUpdate).toEqual({ senderConfirmed: true });
  });

  test("receiver confirming sets receiverConfirmed flag", () => {
    const trade = makeTrade({ status: "CARDS_SENT" });
    const result = applyTradeAction(trade, 20, "confirm_received");
    expect("success" in result && result.flagUpdate).toEqual({ receiverConfirmed: true });
  });

  test("does NOT transition to COMPLETED if only sender confirmed", () => {
    const trade = makeTrade({ senderConfirmed: false, receiverConfirmed: false });
    const result = applyTradeAction(trade, 10, "confirm_received");
    expect("success" in result && result.nextStatus).toBeUndefined();
  });

  test("does NOT transition to COMPLETED if only receiver confirmed", () => {
    const trade = makeTrade({ senderConfirmed: false, receiverConfirmed: false });
    const result = applyTradeAction(trade, 20, "confirm_received");
    expect("success" in result && result.nextStatus).toBeUndefined();
  });

  test("transitions to COMPLETED when both confirm receipt", () => {
    const trade = makeTrade({ senderConfirmed: true, receiverConfirmed: false });
    const result = applyTradeAction(trade, 20, "confirm_received");
    expect("success" in result && result.nextStatus).toBe("COMPLETED");
  });

  test("transitions to COMPLETED when sender is last to confirm", () => {
    const trade = makeTrade({ senderConfirmed: false, receiverConfirmed: true });
    const result = applyTradeAction(trade, 10, "confirm_received");
    expect("success" in result && result.nextStatus).toBe("COMPLETED");
  });

});

// ── dispute ───────────────────────────────────────────────────────────────────

describe("applyTradeAction — dispute", () => {

  test("sender can dispute a DEPOSIT_PAID trade", () => {
    const trade = makeTrade({ status: "DEPOSIT_PAID" });
    const result = applyTradeAction(trade, 10, "dispute");
    expect(result).toEqual({ success: true, nextStatus: "DISPUTED" });
  });

  test("receiver can dispute a DEPOSIT_PAID trade", () => {
    const trade = makeTrade({ status: "DEPOSIT_PAID" });
    const result = applyTradeAction(trade, 20, "dispute");
    expect(result).toEqual({ success: true, nextStatus: "DISPUTED" });
  });

  test("cannot dispute a PENDING trade", () => {
    const trade = makeTrade({ status: "PENDING" });
    const result = applyTradeAction(trade, 10, "dispute");
    expect(result).toEqual({ error: "can only dispute a DEPOSIT_PAID trade", status: 400 });
  });

  test("cannot dispute a COMPLETED trade", () => {
    const trade = makeTrade({ status: "COMPLETED" });
    const result = applyTradeAction(trade, 10, "dispute");
    expect(result).toEqual({ error: "can only dispute a DEPOSIT_PAID trade", status: 400 });
  });

  test("cannot dispute a DECLINED trade", () => {
    const trade = makeTrade({ status: "DECLINED" });
    const result = applyTradeAction(trade, 20, "dispute");
    expect(result).toEqual({ error: "can only dispute a DEPOSIT_PAID trade", status: 400 });
  });

});

// ── invalid action ────────────────────────────────────────────────────────────

describe("applyTradeAction — invalid action", () => {

  test("returns 400 for an unrecognised action string", () => {
    const trade = makeTrade();
    const result = applyTradeAction(trade, 10, "do_something_weird");
    expect(result).toEqual({ error: "invalid action", status: 400 });
  });

  test("returns 400 for empty action string", () => {
    const trade = makeTrade();
    const result = applyTradeAction(trade, 10, "");
    expect(result).toEqual({ error: "invalid action", status: 400 });
  });

});