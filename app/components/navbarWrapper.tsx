import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import Navbar from "./Navbar";

export const dynamic = "force-dynamic";

export default async function NavbarWrapper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
      };

      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
        },
      });
    } catch {
      user = null;
    }
  }

  return <Navbar user={user} />;
}