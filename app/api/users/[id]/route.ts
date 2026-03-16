import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(params.id),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error(err);
    return NextResponse.json(null, { status: 500 });
  }
}