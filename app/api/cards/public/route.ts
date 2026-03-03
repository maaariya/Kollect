import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      select: {
        image: true,
      },
      take: 30,
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ cards: [] });
  }
}