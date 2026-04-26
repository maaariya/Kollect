import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // Next 15 requires await
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    const { name, phone, bio } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name,
        phone,
        bio,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}