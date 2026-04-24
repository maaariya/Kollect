import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const { recipientId } = await req.json();

  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const currentUserId = decoded.id;

  if (currentUserId === recipientId)
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  try {
    await prisma.friendship.create({
      data: { requesterId: currentUserId, recipientId, status: "pending" },
    });

    const requester = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { name: true },
    });

    await notify(
      recipientId,
      "FRIEND_REQUEST",
      "New friend request",
      `${requester?.name ?? "Someone"} sent you a friend request.`,
      "/friends",
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Request already exists" }, { status: 400 });
  }
}
