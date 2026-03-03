import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  if (!search) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      name: { contains: search },
    },
    take: 10,
  });

  return NextResponse.json(users);
}