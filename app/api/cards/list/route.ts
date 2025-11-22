import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cards = await prisma.card.findMany({
    orderBy: { id: "asc" }, // simple and safe
  });

  return NextResponse.json({ cards });
}
