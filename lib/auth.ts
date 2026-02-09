import jwt from "jsonwebtoken";

export function getUserIdFromRequest(req: Request): number | null {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
    };

    return decoded.id;
  } catch {
    return null;
  }
}
