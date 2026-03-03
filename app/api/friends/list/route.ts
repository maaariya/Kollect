import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json([]);

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const currentUserId = decoded.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [
        { requesterId: currentUserId },
        { recipientId: currentUserId },
      ],
    },
    include: {
      requester: true,
      recipient: true,
    },
  });

  const friends = friendships.map((f) =>
    f.requesterId === currentUserId ? f.recipient : f.requester
  );

  return NextResponse.json(friends);
}