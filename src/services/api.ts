// En producción (Vercel) el frontend y backend comparten dominio → URL vacía
// En desarrollo local, Vite hace proxy de /api/* → http://127.0.0.1:8000
export const API_URL = import.meta.env.VITE_API_URL ?? "";

// ── Tokens ────────────────────────────────────────────────────────────────
const getAccessToken  = () => localStorage.getItem("token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

export const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem("token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
};

// ── Refresh ───────────────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/api/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.href = "/login";
    return null;
  }

  const data = await res.json();
  saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

// ── apiFetch ──────────────────────────────────────────────────────────────
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return res;

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
  }

  return res;
};

// ── Logout ────────────────────────────────────────────────────────────────
export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }
  clearTokens();
  window.location.href = "/login";
}