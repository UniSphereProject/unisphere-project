// Small shared helpers used across the forum, comments and notice screens.

export const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// Decode a JWT payload without verifying the signature (verification happens
// server-side). Used only to read the embedded user_id for "is this mine?"
// checks on the client.

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload;
  } catch (e) {
    return null;
  }
};

export const getCurrentUserId = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;
  const id = payload.user_id ?? payload.id ?? null;
  return id !== null ? String(id) : null;
};

export const formatApiError = (err, fallback = "Something went wrong.") => {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  }
  if (typeof detail === "object" && detail.message) return detail.message;
  return fallback;
};
