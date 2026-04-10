import {
  CONSENT_RESOURCE_TYPES,
  type ConsentResourceType,
} from "./consentTypes";

export const CONSENT_STORAGE_KEY = "ihealth-consent-scopes-v1";

const STORAGE_VERSION = 1;

export type ConsentStoredPayload = {
  version: number;
  scopes: Record<ConsentResourceType, boolean>;
};

function defaultScopes(): Record<ConsentResourceType, boolean> {
  return Object.fromEntries(CONSENT_RESOURCE_TYPES.map((t) => [t, true])) as Record<
    ConsentResourceType,
    boolean
  >;
}

/** All resource types permitted until the user restricts them (backward compatible). */
export function loadConsentScopes(): Record<ConsentResourceType, boolean> {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return defaultScopes();
    const parsed = JSON.parse(raw) as Partial<ConsentStoredPayload>;
    if (parsed.version !== STORAGE_VERSION || !parsed.scopes || typeof parsed.scopes !== "object") {
      return defaultScopes();
    }
    const out = defaultScopes();
    for (const t of CONSENT_RESOURCE_TYPES) {
      if (typeof parsed.scopes[t] === "boolean") out[t] = parsed.scopes[t];
    }
    return out;
  } catch {
    return defaultScopes();
  }
}

export function saveConsentScopes(scopes: Record<ConsentResourceType, boolean>): void {
  const payload: ConsentStoredPayload = {
    version: STORAGE_VERSION,
    scopes: { ...scopes },
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

export function countPermitted(scopes: Record<ConsentResourceType, boolean>): number {
  return CONSENT_RESOURCE_TYPES.filter((t) => scopes[t]).length;
}

export function countRestricted(scopes: Record<ConsentResourceType, boolean>): number {
  return CONSENT_RESOURCE_TYPES.length - countPermitted(scopes);
}
