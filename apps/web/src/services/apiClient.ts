const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

function getAuthToken() {
  try {
    const raw = localStorage.getItem("hm-auth");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token;
  } catch {
    return undefined;
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 401) {
      localStorage.removeItem("hm-auth");
    }
    throw new Error(message || `API request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
