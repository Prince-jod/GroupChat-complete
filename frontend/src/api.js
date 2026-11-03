// One place for the backend address + helpers
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Login is kept in sessionStorage (separate for every browser tab), so you can
// log in as User A in one tab and User B in another tab of the SAME browser.
export function getToken() {
  return sessionStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

// Full URL for an uploaded file (backend sends "/uploads/abc.png")
export function mediaSrc(url) {
  return url?.startsWith("http") ? url : `${API_URL}${url}`;
}

// fetch() that adds the JWT token and returns the JSON.
// Throws an Error (with .status) if the request fails.
export async function apiFetch(path, options = {}) {
  const isForm = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm || !options.body ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
