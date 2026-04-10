import { useCallback, useEffect, useState } from "react";
import type { ConsentResourceType } from "./consentTypes";
import { loadConsentScopes } from "./consentStorage";

/**
 * Live consent map for patient UI. Refreshes when the patient id changes, the window gains focus,
 * or the tab becomes visible (so returning from Consent portal picks up saved preferences).
 */
export function useConsentScopes(patientContextKey: string): Record<ConsentResourceType, boolean> {
  const [scopes, setScopes] = useState(loadConsentScopes);

  const refresh = useCallback(() => {
    setScopes(loadConsentScopes());
  }, []);

  useEffect(() => {
    refresh();
  }, [patientContextKey, refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return scopes;
}
