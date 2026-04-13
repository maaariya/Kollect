import { NextResponse } from "next/server";
import { getPayPalAccessToken } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { orderId, tradeId, userId } = await req.json();

  const accessToken = await getPayPalAccessToken();

  const res = await fetch(
    `${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();

  if (data.status !== "COMPLETED") {
    return NextResponse.json({ error: "Payment failed" }, { status: 400 });
  }

  // 🔥 Update trade
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
  });

  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const isSender = trade.senderId === userId;

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      ...(isSender
        ? { senderDepositPaid: true }
        : { receiverDepositPaid: true }),
    },
  });

  // If both paid → move status
  if (
    updated.senderDepositPaid &&
    updated.receiverDepositPaid
  ) {
    await prisma.trade.update({
      where: { id: tradeId },
      data: { status: "DEPOSIT_PAID" },
    });
  }

  return NextResponse.json({ success: true });
}