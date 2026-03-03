import jwt from "jsonwebtoken";

export function getUserIdFromToken(authHeader?: string) {
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { id: number };

    return payload.id;
  } catch {
    return null;
  }
}

