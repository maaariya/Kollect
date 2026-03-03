import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const profileId = Number(params.id);
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ status: "none" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const currentUserId = decoded.id;

    if (currentUserId === profileId) return NextResponse.json({ status: "friends" });

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, recipientId: profileId },
          { requesterId: profileId, recipientId: currentUserId },
        ],
      },
    });

    let status: "none" | "pending" | "friends" = "none";
    if (friendship) {
      status = "friends";
      if (friendship.requesterId === currentUserId) status = "pending"; // request sent
    }

    return NextResponse.json({ status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "none" });
  }
}