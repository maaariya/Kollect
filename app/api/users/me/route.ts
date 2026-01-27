import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        cards: {
          include: {
            card: true, // ⭐ IMPORTANT: load the actual card data
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("ME ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load user" },
      { status: 500 }
    );
  }
}
