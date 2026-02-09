// app/profile/page.tsx
import { prisma } from "@/lib/prisma";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const user = await prisma.user.findFirst({
    include: {
      cards: {
        include: {
          card: true,
        },
      },
    },
  });

  if (!user) {
    return <p className="p-4 text-red-500">No users found</p>;
  }

  return <ProfileClient user={user} />;
}
