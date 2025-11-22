import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET all cards
export async function GET() {
  try {
    const cards = await prisma.card.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("❌ Error loading cards:", error);
    return NextResponse.json(
      { error: "Failed to load cards" },
      { status: 500 }
    );
  }
}
