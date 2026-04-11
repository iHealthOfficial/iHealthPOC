const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

const AUTH_TOKEN_KEY = "ihealth-auth-token-v1";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const headers: Record<string, string> = {
    ...(init?.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}
