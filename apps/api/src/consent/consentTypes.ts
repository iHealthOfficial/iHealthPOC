/** Mirrors web consent resource types (server-side filtering). */
export const CONSENT_RESOURCE_TYPES = [
  "Encounter",
  "Observation",
  "Condition",
  "DiagnosticReport",
  "Procedure",
  "AllergyIntolerance",
  "MedicationRequest",
  "MedicationAdministration",
  "MedicationDispense",
  "MedicationStatement",
  "Medication",
  "Immunization",
  "Coverage",
  "FamilyMemberHistory",
] as const;

export type ConsentResourceType = (typeof CONSENT_RESOURCE_TYPES)[number];

export function defaultConsentScopes(): Record<ConsentResourceType, boolean> {
  return Object.fromEntries(CONSENT_RESOURCE_TYPES.map((t) => [t, true])) as Record<
    ConsentResourceType,
    boolean
  >;
}

export function parseConsentScopesJson(raw: string | null | undefined): Record<ConsentResourceType, boolean> {
  const base = defaultConsentScopes();
  if (!raw?.trim()) return base;
  try {
    const o = JSON.parse(raw) as Record<string, boolean>;
    for (const t of CONSENT_RESOURCE_TYPES) {
      if (typeof o[t] === "boolean") base[t] = o[t];
    }
    return base;
  } catch {
    return base;
  }
}

/** Intersection: a type is visible only if every user has it allowed. */
export function mergeConsentIntersection(
  users: { consentScopesJson: string | null }[],
): Record<ConsentResourceType, boolean> {
  if (users.length === 0) return defaultConsentScopes();
  const parsed = users.map((u) => parseConsentScopesJson(u.consentScopesJson));
  const out = defaultConsentScopes();
  for (const t of CONSENT_RESOURCE_TYPES) {
    out[t] = parsed.every((p) => p[t] !== false);
  }
  return out;
}
