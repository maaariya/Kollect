import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

  const { tradeId, orderId } = await req.json();

  if (!orderId || !tradeId) {
    return Response.json({ error: "orderId and tradeId required" }, { status: 400 });
  }

  // Get PayPal access token
  const auth = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET
        ).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const authData = await auth.json();

  if (!auth.ok) {
    console.error("PayPal auth error:", authData);
    return Response.json({ error: "Failed to get PayPal token" }, { status: 500 });
  }

  // Capture the order
  const capture = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const captureData = await capture.json();

  if (!capture.ok || captureData.status !== "COMPLETED") {
    console.error("PayPal capture error:", captureData);
    return Response.json({ error: "PayPal capture failed" }, { status: 500 });
  }

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

  const isSender     = trade.senderId === decoded.id;
  const payerName    = isSender ? trade.sender.name : trade.receiver.name;
  const otherUserId  = isSender ? trade.receiverId  : trade.senderId;

  await prisma.trade.update({
    where: { id: tradeId },
    data: isSender ? { senderDepositPaid: true } : { receiverDepositPaid: true },
  });

  // Notify the other user that a deposit was paid
  await notify(
    otherUserId,
    "TRADE_DEPOSIT",
    "Deposit received",
    `${payerName} paid their deposit. Pay yours to proceed.`,
    `/messages/${decoded.id}`,
  );

  const updated = await prisma.trade.findUnique({ where: { id: tradeId } });

  if (updated?.senderDepositPaid && updated.receiverDepositPaid) {
    await prisma.trade.update({
      where: { id: tradeId },
      data: { status: "DEPOSIT_PAID" },
    });
  }

  return Response.json({ success: true });
}
