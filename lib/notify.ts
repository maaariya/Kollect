import { prisma } from "@/lib/prisma";

export async function notify(
  userId: number,
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  } catch (err) {
    // Never let a notification failure break the main action
    console.error("[notify]", err);
  }
}
