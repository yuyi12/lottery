import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
const TOKEN_EXPIRY = "7d";

export async function signToken(userId: number, email: string): Promise<string> {
  return new SignJWT({ sub: String(userId), email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: Number(payload.sub),
      email: String(payload.email),
    };
  } catch {
    return null;
  }
}
