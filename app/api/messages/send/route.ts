import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const { receiverId, content } = await req.json();

    const message = await prisma.message.create({
      data: {
        senderId: decoded.id,
        receiverId,
        content,
      },
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}