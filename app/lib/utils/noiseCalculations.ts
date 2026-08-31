export interface StandardParams {
  criterionLevelDb: number;      // Lc (ex: 85 dBA pour NIOSH, 90 dBA pour OSHA)
  exchangeRateDb: number;        // q (ex: 3 dBA pour NIOSH, 5 dBA pour OSHA)
  referenceDurationHours: number; // Tref (ex: 8h)
}

/**
 * Durée maximale permise T (en heures) pour un niveau de décibels donné.
 * Formule : T = Tref / 2^((L - Lc) / q)
 */
export function calculatePermissibleTime(dbLevel: number, standard: StandardParams): number {
  if (dbLevel < 40) return 24;
  const exponent = (dbLevel - standard.criterionLevelDb) / standard.exchangeRateDb;
  return standard.referenceDurationHours / Math.pow(2, exponent);
}

/**
 * Calcul de la dose partielle D (%) d'une mesure.
 * Formule : D = (Durée_en_heures / Durée_permise_T) * 100
 */
export function calculateDoseContribution(
  dbLevel: number,
  durationMinutes: number,
  standard: StandardParams
): number {
  const durationHours = durationMinutes / 60;
  const permissibleTimeHours = calculatePermissibleTime(dbLevel, standard);
  return (durationHours / permissibleTimeHours) * 100;
}

/**
 * Calcul du TWA (Time-Weighted Average / Niveau moyen équivalent sur 8h) à partir de la dose totale.
 * Formule : TWA = Lc + [ (q / log10(2)) * log10(Dose_totale / 100) ]
 */
export function calculateTwaFromTotalDose(totalDosePercentage: number, standard: StandardParams): number {
  if (totalDosePercentage <= 0) return 0;
  const k = standard.exchangeRateDb / Math.log10(2);
  const twa = standard.criterionLevelDb + k * Math.log10(totalDosePercentage / 100);
  return Math.max(0, parseFloat(twa.toFixed(2)));
}