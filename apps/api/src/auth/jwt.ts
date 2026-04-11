import * as jose from "jose";

const encoder = new TextEncoder();

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) throw new Error("JWT_SECRET is not set");
  return encoder.encode(s);
}

export async function signUserToken(userId: string, email: string, role: string): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export type VerifiedToken = { sub: string; email: string; role: string };

export async function verifyUserToken(token: string): Promise<VerifiedToken | null> {
  try {
    const secret = getSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const role = typeof payload.role === "string" ? payload.role : "user";
    if (!sub || !email) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}
