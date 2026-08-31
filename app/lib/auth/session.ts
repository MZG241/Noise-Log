import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/app/dbConfig/db";
import { users } from "@/app/schema/schema";
import { eq } from "drizzle-orm";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "elizee_worship_super_secret_key_2026"
);

export async function createSession(payload: { userId: string; email: string; role: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    // 1. Décodage et vérification de la signature JWT
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as string;

    if (!userId) return null;

    // 2. Vérification d'existence en Base de Données
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId));

    // Si l'utilisateur n'existe plus en BDD, la session est invalide
    if (!user) {
      await destroySession();
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

