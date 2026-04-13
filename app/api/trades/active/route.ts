// app/api/trades/active/route.ts
// GET /api/trades/active?withUser=<userId>
// Returns the active (non-completed, non-declined) trade between the logged-in
// user and the specified user, including card details.

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    const { searchParams } = new URL(req.url);
    const withUser = Number(searchParams.get("withUser"));

    if (!withUser) {
      return NextResponse.json({ error: "withUser is required" }, { status: 400 });
    }

    const trade = await prisma.trade.findFirst({
      where: {
        status: { notIn: ["COMPLETED", "DECLINED"] },
        OR: [
          { senderId: decoded.id,  receiverId: withUser },
          { senderId: withUser,    receiverId: decoded.id },
        ],
      },
      include: {
  offeredCard: {
    select: {
      id: true,
      name: true,
      member: true,
      group: true,
      album: true,
      image: true,
    },
  },
  requestedCard: {
    select: {
      id: true,
      name: true,
      member: true,
      group: true,
      album: true,
      image: true,
    },
  },
},
    });

    return NextResponse.json({ trade: trade ?? null });
  } catch (err) {
    console.error("[trades/active]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}