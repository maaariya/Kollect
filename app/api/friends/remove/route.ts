import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { friendId } = await req.json();

  const token = (await cookies()).get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const currentUserId = decoded.id;

  await prisma.friendship.deleteMany({
    where: {
      status: "accepted",
      OR: [
        { requesterId: currentUserId, recipientId: friendId },
        { requesterId: friendId, recipientId: currentUserId },
      ],
    },
  });

  return NextResponse.json({ success: true });
}