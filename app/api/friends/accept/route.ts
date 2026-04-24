import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const { requesterId } = await req.json();

  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const currentUserId = decoded.id;

  await prisma.friendship.updateMany({
    where: { requesterId, recipientId: currentUserId, status: "pending" },
    data: { status: "accepted" },
  });

  const accepter = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { name: true },
  });

  await notify(
    requesterId,
    "FRIEND_ACCEPTED",
    "Friend request accepted",
    `${accepter?.name ?? "Someone"} accepted your friend request.`,
    `/profile/${currentUserId}`,
  );

  return NextResponse.json({ success: true });
}
