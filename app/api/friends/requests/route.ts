import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json([]);

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
  const currentUserId = decoded.id;

  const requests = await prisma.friendship.findMany({
    where: {
      recipientId: currentUserId,
      status: "pending",
    },
    include: {
      requester: true,
    },
  });

  return NextResponse.json(requests);
}