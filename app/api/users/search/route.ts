import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search")?.trim();
    const currentUserId = Number(req.nextUrl.searchParams.get("currentUserId"));

    if (!search) return NextResponse.json([]);

    // Search users by name or email, excluding current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
      take: 20,
    });

    // Fetch existing friend requests for current user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId },
          { recipientId: currentUserId },
        ],
      },
      select: {
        requesterId: true,
        recipientId: true,
      },
    });

    // Mark each user if a friend request exists
    const results = users.map((user) => {
      const pending = friendships.some(
        (f) =>
          (f.requesterId === currentUserId && f.recipientId === user.id) ||
          (f.requesterId === user.id && f.recipientId === currentUserId)
      );
      return { ...user, pending };
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}