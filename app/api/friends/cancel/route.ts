import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const currentUserId = decoded.id;

    const { recipientId } = await req.json();

    await prisma.friendship.deleteMany({
      where: { requesterId: currentUserId, recipientId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}