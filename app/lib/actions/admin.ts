"use server";

import { db } from "@/app/dbConfig/db";
import { users, safetyStandards, events } from "@/app/schema/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "../auth/session";
import bcrypt from "bcryptjs"; 

export async function createUserAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = (formData.get("role") as "user" | "admin") || "user";
    const preferredStandardCode = (formData.get("preferredStandardCode") as string) || "NIOSH_REL";
    
    // Récupérer le mot de passe du formulaire ou en générer un temporaire
    const rawPassword = (formData.get("password") as string) || "ChangeMe123!";

    if (!name || !email) {
      return { error: "Name and email are required." };
    }

    
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await db.insert(users).values({
      name,
      email,
      passwordHash, 
      role,
      preferredStandardCode,
    });

    revalidatePath("/admin/users");
    return { success: "User created successfully." };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "Failed to create user." };
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as "user" | "admin";
    const preferredStandardCode = formData.get("preferredStandardCode") as string;

    await db
      .update(users)
      .set({ name, email, role, preferredStandardCode })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");
    return { success: "User updated successfully." };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: "Failed to update user." };
  }
}

// 1. UPDATE USER ROLE (ADMIN ONLY)
export async function updateUserRoleAction(userId: string, newRole: "user" | "admin") {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    revalidatePath("/admin/users");
    return { success: "User role updated successfully." };
  } catch (err) {
    return { error: "Failed to update user role." };
  }
}

// 2. DELETE SOUND ENGINEER ACCOUNT (ADMIN ONLY)
export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    await db.delete(events).where(eq(events.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    
    revalidatePath("/admin/users");
    return { success: "User account and associated logs deleted successfully." };
  } catch (err) {
    return { error: "Failed to delete user account." };
  }
}

// 3. CREATE SAFETY STANDARD (ADMIN ONLY)
export async function createSafetyStandardAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  const code = (formData.get("code") as string)?.toUpperCase().trim();
  const name = (formData.get("name") as string)?.trim();
  const criterionLevelDb = parseFloat(formData.get("criterionLevelDb") as string);
  const exchangeRateDb = parseFloat(formData.get("exchangeRateDb") as string);
  const referenceDurationHours = parseFloat(formData.get("referenceDurationHours") as string) || 8;
  const isDefault = formData.get("isDefault") === "true";

  if (!code || !name || isNaN(criterionLevelDb) || isNaN(exchangeRateDb)) {
    return { error: "All configuration fields are required." };
  }

  try {
    await db.insert(safetyStandards).values({
      code,
      name,
      criterionLevelDb,
      exchangeRateDb,
      referenceDurationHours,
      isDefault,
    });

    revalidatePath("/admin/standards");
    return { success: `Safety standard ${code} created successfully.` };
  } catch (err) {
    return { error: "Failed to create safety standard. Code might already exist." };
  }
}

// 4. UPDATE USER PREFERRED SAFETY STANDARD
export async function updatePreferredStandardAction(standardCode: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Unauthorized access." };

  try {
    await db
      .update(users)
      .set({ preferredStandardCode: standardCode })
      .where(eq(users.id, session.userId));

    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    return { success: "Preferred standard updated successfully." };
  } catch (err) {
    return { error: "Failed to update preferred standard." };
  }
}


// 2. TOGGLE DEFAULT STANDARD
export async function setDefaultStandardAction(code: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    await db.update(safetyStandards).set({ isDefault: false });
    await db.update(safetyStandards).set({ isDefault: true }).where(eq(safetyStandards.code, code));

    revalidatePath("/admin/standards");
    return { success: `Standard ${code} set as system default.` };
  } catch (err) {
    return { error: "Failed to update system default standard." };
  }
}

// 3. DELETE SAFETY STANDARD
export async function deleteSafetyStandardAction(code: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    // Check if standard is assigned as preferred to any active users
    const assignedUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.preferredStandardCode, code))
      .limit(1);

    if (assignedUsers.length > 0) {
      return { error: `Cannot delete standard ${code}. It is currently assigned to active users.` };
    }

    await db.delete(safetyStandards).where(eq(safetyStandards.code, code));

    revalidatePath("/admin/standards");
    return { success: `Standard ${code} deleted successfully.` };
  } catch (err) {
    return { error: "Failed to delete safety standard." };
  }
}


export async function updateSafetyStandardAction(
  code: string,
  formData: FormData
) {
  try {
    const name = formData.get("name") as string;
    const criterionLevelDb = parseFloat(formData.get("criterionLevelDb") as string);
    const exchangeRateDb = parseFloat(formData.get("exchangeRateDb") as string);
    const referenceDurationHours = parseFloat(
      formData.get("referenceDurationHours") as string
    ) || 8;

    // Validation basique
    if (!name || isNaN(criterionLevelDb) || isNaN(exchangeRateDb)) {
      return { error: "Please fill in all required fields with valid numbers." };
    }

    // Mise à jour de la norme basée sur son code unique
    await db
      .update(safetyStandards)
      .set({
        name,
        criterionLevelDb,
        exchangeRateDb,
        referenceDurationHours,
      })
      .where(eq(safetyStandards.code, code));

    // Rafraîchissement de la page pour recharger les données mises à jour
    revalidatePath("/admin/standards");

    return { success: `Standard '${code}' updated successfully.` };
  } catch (error) {
    console.error("Error updating safety standard:", error);
    return { error: "Failed to update safety standard." };
  }
}