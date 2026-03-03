import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(null, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        cards: {
          include: {
            card: true, // ✅ include actual card data
          },
        },
        wishlist: {
          include: {
            card: true, // ✅ include actual card data
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(null, { status: 404 });
    }

    // ✅ flatten cards + wishlist so frontend receives clean Card[]
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bio: user.bio,
      cards: user.cards.map((c) => c.card),
      wishlist: user.wishlist.map((w) => w.card),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("ME ROUTE ERROR:", error);
    return NextResponse.json(null, { status: 401 });
  }
}