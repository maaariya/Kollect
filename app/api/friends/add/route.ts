import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const currentUserId = decoded.id;
    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json({ error: "Missing friendId" }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: currentUserId, recipientId: friendId },
          { requesterId: friendId, recipientId: currentUserId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Friend request already exists" },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: currentUserId,
        recipientId: friendId,
      },
    });

    return NextResponse.json(friendship);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}