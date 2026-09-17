
"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/app/dbConfig/db";
import { events, exposureLogs, safetyStandards, users } from "@/app/schema/schema";
import { getSession } from "../auth/session";

/**
 * 1. CREATE EVENT ACTION
 */
export async function createEventAction(formData: FormData) {
  try {
    const session = await getSession();

    if (!session) {
      return { error: "You are not allowed" };
    }

    const title = formData.get("title") as string;
    const userId = formData.get("userId") as string;
    const location = formData.get("location") as string;
    let standardCodeUsed = formData.get("standardCodeUsed") as string;

    if (!title || !userId) {
      return { error: "Title and user are required." };
    }

    // Verify that the user (engineer) exists in the database using select()
    const targetUsers = await db
      .select({
        id: users.id,
        preferredStandardCode: users.preferredStandardCode,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const targetUser = targetUsers[0];

    if (!targetUser) {
      return { error: "Selected user does not exist in the database." };
    }

    // Fallback to user's preferred standard if none is provided
    if (!standardCodeUsed || standardCodeUsed.trim() === "") {
      standardCodeUsed = targetUser.preferredStandardCode || "NIOSH";
    }

    // Verify standard exists in safetyStandards using select()
    const matchingStandards = await db
      .select({ code: safetyStandards.code })
      .from(safetyStandards)
      .where(eq(safetyStandards.code, standardCodeUsed))
      .limit(1);

    if (matchingStandards.length === 0) {
      return { error: "Invalid safety standard selected." };
    }

    // Insert new event into the database
    await db.insert(events).values({
      title,
      userId,
      location: location || null,
      standardCodeUsed,
      totalDosePercentage: 0,
      twaDb: 0,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/events");
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating event:", error);
    return { error: error.message || "Failed to record event." };
  }
}

/**
 * 2. UPDATE EVENT ACTION
 */
export async function updateEventAction(id: string, formData: FormData) {
  try {
    const session = await getSession();

    if (!session) {
      return { error: "You are not allowed" };
    }

    if (!id) {
      return { error: "Event ID is required." };
    }

    const title = formData.get("title") as string;
    const userId = formData.get("userId") as string;
    const location = formData.get("location") as string;
    let standardCodeUsed = formData.get("standardCodeUsed") as string;

    if (!title || !userId) {
      return { error: "Title and user are required." };
    }

    // Verify that the user exists
    const targetUsers = await db
      .select({
        id: users.id,
        preferredStandardCode: users.preferredStandardCode,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const targetUser = targetUsers[0];

    if (!targetUser) {
      return { error: "Selected user does not exist in the database." };
    }

    // Fallback to user's preferred standard if none is provided
    if (!standardCodeUsed || standardCodeUsed.trim() === "") {
      standardCodeUsed = targetUser.preferredStandardCode || "NIOSH";
    }

    // Verify standard exists
    const matchingStandards = await db
      .select({ code: safetyStandards.code })
      .from(safetyStandards)
      .where(eq(safetyStandards.code, standardCodeUsed))
      .limit(1);

    if (matchingStandards.length === 0) {
      return { error: "Invalid safety standard selected." };
    }

    // Update the event in the database
    await db
      .update(events)
      .set({
        title,
        userId,
        location: location || null,
        standardCodeUsed,
      })
      .where(eq(events.id, id));

    revalidatePath("/dashboard/events");
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating event:", error);
    return { error: error.message || "Failed to update event." };
  }
}

/**
 * 3. DELETE EVENT ACTION
 */
export async function deleteEventAction(id: string) {
  try {
    const session = await getSession();

    if (!session) {
      return { error: "You are not allowed" };
    }

    if (!id) {
      return { error: "Event ID is required." };
    }

    await db.delete(events).where(eq(events.id, id));

    revalidatePath("/dashboard/events");
    revalidatePath("/admin/events");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return { error: error.message || "Failed to delete event." };
  }
}


export async function createExposureLogAction(formData: FormData) {
  try {
    const session = await getSession();

    if (!session) {
      return { error: "Unauthorized" };
    }

    // =========================================
    // 1. RÉCUPÉRER LES DONNÉES
    // =========================================

    const eventId = formData.get("eventId") as string;
    const decibelsStr = formData.get("decibels") as string;
    const durationMinutesStr =
      formData.get("durationMinutes") as string;

    const peakDbStr = formData.get("peakDb") as string | null;

    if (!eventId || !decibelsStr || !durationMinutesStr) {
      return {
        error: "Missing required measurement fields.",
      };
    }

    const decibelLevel = Number(decibelsStr);
    const durationMinutes = Number(durationMinutesStr);

    const peakFromClient =
      peakDbStr && peakDbStr.trim() !== ""
        ? Number(peakDbStr)
        : decibelLevel;

    // =========================================
    // 2. VALIDATION
    // =========================================

    if (
      !Number.isFinite(decibelLevel) ||
      decibelLevel < 0 ||
      decibelLevel > 140
    ) {
      return {
        error: "Invalid sound level. Expected 0-140 dBA.",
      };
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      return {
        error: "Invalid exposure duration.",
      };
    }

    if (
      !Number.isFinite(peakFromClient) ||
      peakFromClient < 0 ||
      peakFromClient > 140
    ) {
      return {
        error: "Invalid peak sound level.",
      };
    }

    // =========================================
    // 3. RÉCUPÉRER L'ÉVÉNEMENT
    // =========================================

    const eventList = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    const event = eventList[0];

    if (!event) {
      return {
        error: "Event not found.",
      };
    }

    // =========================================
    // 4. RÉCUPÉRER LE STANDARD
    // =========================================

    const standardList = await db
      .select()
      .from(safetyStandards)
      .where(
        eq(
          safetyStandards.code,
          event.standardCodeUsed
        )
      )
      .limit(1);

    const standard = standardList[0];

    if (!standard) {
      return {
        error: "Safety standard not found.",
      };
    }

    const criterionLevel =
      Number(standard.criterionLevelDb);

    const exchangeRate =
      Number(standard.exchangeRateDb);

    const referenceDurationMinutes =
      Number(standard.referenceDurationHours) * 60;

    // =========================================
    // 5. RÉCUPÉRER LES ANCIENS LOGS
    // =========================================

    const previousLogs = await db
      .select()
      .from(exposureLogs)
      .where(
        eq(exposureLogs.eventId, eventId)
      );

    // =========================================
    // 6. CALCUL GLOBAL
    // =========================================

    let totalDose = 0;
    let totalMinutes = 0;
    let energySum = 0;

    let globalPeakDb = peakFromClient;

    // Fonction interne pour traiter une mesure
    const processMeasurement = (
      dbVal: number,
      duration: number,
      peak: number
    ) => {
      if (
        !Number.isFinite(dbVal) ||
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        return;
      }

      totalMinutes += duration;

      // =======================================
      // TEMPS D'EXPOSITION AUTORISÉ
      // =======================================

      const allowableMinutes =
        referenceDurationMinutes /
        Math.pow(
          2,
          (dbVal - criterionLevel) /
            exchangeRate
        );

      // =======================================
      // DOSE
      // =======================================

      const doseContribution =
        (duration / allowableMinutes) * 100;

      totalDose += doseContribution;

      // =======================================
      // ÉNERGIE ACOUSTIQUE
      // =======================================

      energySum +=
        duration *
        Math.pow(10, dbVal / 10);

      // =======================================
      // PEAK
      // =======================================

      if (peak > globalPeakDb) {
        globalPeakDb = peak;
      }
    };

    // =========================================
    // 7. TRAITER LES ANCIENS LOGS
    // =========================================

    for (const log of previousLogs) {
      processMeasurement(
        Number(log.decibelLevel),
        Number(log.durationMinutes),
        Number(log.peakDb ?? log.decibelLevel)
      );
    }

    // =========================================
    // 8. TRAITER LA NOUVELLE MESURE
    // =========================================

    processMeasurement(
      decibelLevel,
      durationMinutes,
      peakFromClient
    );

    // =========================================
    // 9. CALCUL LEQ
    // =========================================

    const leqDb =
      totalMinutes > 0
        ? 10 *
          Math.log10(
            energySum / totalMinutes
          )
        : decibelLevel;

    // =========================================
    // 10. CALCUL TWA NIOSH
    // =========================================

    const twaDb =
      totalDose > 0
        ? criterionLevel +
          exchangeRate *
            Math.log2(totalDose / 100)
        : 0;

    // =========================================
    // 11. INSERTION DU NOUVEAU LOG
    // =========================================

    await db.insert(exposureLogs).values({
      eventId,

      // Niveau moyen de cette session
      decibelLevel,

      // Leq calculé après ajout de cette mesure
      leqDb,

      // Peak de cette session
      peakDb: peakFromClient,

      durationMinutes,

      recordedAt: new Date(),
    });

    // =========================================
    // 12. UPDATE EVENT
    // =========================================

    await db
      .update(events)
      .set({
        totalDosePercentage:
          Number(totalDose.toFixed(2)),

        twaDb:
          Number(twaDb.toFixed(1)),
      })
      .where(
        eq(events.id, eventId)
      );

    // =========================================
    // DEBUG
    // =========================================

    console.log(
      "========== EXPOSURE DEBUG =========="
    );

    console.log(
      "Nouvelle mesure:",
      decibelLevel,
      "dBA"
    );

    console.log(
      "Durée:",
      durationMinutes,
      "minutes"
    );

    console.log(
      "Peak:",
      peakFromClient,
      "dBA"
    );

    console.log(
      "Standard:",
      event.standardCodeUsed
    );

    console.log(
      "Criterion:",
      criterionLevel,
      "dBA"
    );

    console.log(
      "Exchange:",
      exchangeRate,
      "dB"
    );

    console.log(
      "Nombre anciens logs:",
      previousLogs.length
    );

    console.log(
      "Total durée:",
      totalMinutes,
      "minutes"
    );

    console.log(
      "Dose:",
      totalDose,
      "%"
    );

    console.log(
      "Leq:",
      leqDb,
      "dBA"
    );

    console.log(
      "TWA:",
      twaDb,
      "dBA"
    );

    console.log(
      "Global Peak:",
      globalPeakDb,
      "dBA"
    );

    console.log(
      "===================================="
    );

    // =========================================
    // 13. REVALIDATION
    // =========================================

    revalidatePath("/dashboard/events");
    revalidatePath("/admin/events");

    return {
      success: true,

      measurement: {
        decibelLevel: Number(
          decibelLevel.toFixed(1)
        ),

        peakDb: Number(
          peakFromClient.toFixed(1)
        ),

        durationMinutes: Number(
          durationMinutes.toFixed(2)
        ),
      },

      results: {
        dose: Number(
          totalDose.toFixed(2)
        ),

        twa: Number(
          twaDb.toFixed(1)
        ),

        leq: Number(
          leqDb.toFixed(1)
        ),

        peak: Number(
          globalPeakDb.toFixed(1)
        ),
      },
    };
  } catch (error: any) {
    console.error(
      "Error creating exposure log:",
      error
    );

    return {
      error:
        error.message ||
        "Failed to record exposure measurement.",
    };
  }
}