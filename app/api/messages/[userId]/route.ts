import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json([], { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const userId = Number(params.userId);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: decoded.id,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: decoded.id,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}