import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { senderId: decoded.id },
          { receiverId: decoded.id },
        ],
      },
      include: {
        offeredCard: {
          select: { id: true, name: true, member: true, group: true, album: true, image: true },
        },
        requestedCard: {
          select: { id: true, name: true, member: true, group: true, album: true, image: true },
        },
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = trades.map((t) => {
      const isSender = t.senderId === decoded.id;
      return {
        id: t.id,
        status: t.status,
        createdAt: t.createdAt,
        isSender,
        otherUser: isSender ? t.receiver : t.sender,
        myCard: isSender ? t.offeredCard : t.requestedCard,
        theirCard: isSender ? t.requestedCard : t.offeredCard,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[trades/history]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
