import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const listings = await prisma.tradingListing.findMany({
      include: {
        card: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch trading listings" },
      { status: 500 }
    );
  }
}