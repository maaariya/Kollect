import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // ── Extract token from cookies ──
    const cookieHeader = req.headers.get("cookie") || "";

    const token = cookieHeader
      .split("; ")
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Get userId from token ──
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Get all messages involving user ──
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Build conversations map ──
    const conversationsMap = new Map<number, any>();

    for (const msg of messages) {
      const otherUserId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;

      // Only store latest message per user
      if (!conversationsMap.has(otherUserId)) {
        const user = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (!user) continue;

        conversationsMap.set(otherUserId, {
          user,
          lastMessage: msg,
        });
      }
    }

    return NextResponse.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error("Conversations API error:", error);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}