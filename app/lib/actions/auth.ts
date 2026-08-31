"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { LoginDTOSchema, RegisterDTOSchema } from "@/app/dto/auth.dto";
import { db } from "@/app/dbConfig/db";
import { users } from "@/app/schema/schema";
import { createSession, destroySession, getSession } from "../auth/session";
import { revalidatePath } from "next/cache";

export async function registerAction(prevState: any, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validation via le DTO
  const validation = RegisterDTOSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { name, email, password } = validation.data;

  const [existingUser] = await db.select().from(users).where(eq(users.email, email));

  if (existingUser) {
    return { error: "An account already exists with this email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "user",
    })
    .returning();

  await createSession({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  redirect("/dashboard");
}

export async function loginAction(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Validation via le DTO
  const validation = LoginDTOSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { email, password } = validation.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });


redirect(user.role === "admin" ? "/admin" : "/dashboard");

  
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function updateUserProfile(formData: FormData) {

  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const newPassword = formData.get("newPassword") as string;

  const updateData: { 
    name?: string; 
    email?: string; 
    passwordHash?: string; 
    updatedAt: Date 
  } = {
    name,
    email,
    updatedAt: new Date(),
  };

  if (newPassword && newPassword.trim() !== "") {
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, session.userId));

  // Mettre à jour la session avec le nouvel email/nom si besoin
  await createSession({
    userId: session.userId,
    email: email,
    role: session.role,
  });

  revalidatePath("/admin/profile");
  revalidatePath("/dashboard/profile");
}