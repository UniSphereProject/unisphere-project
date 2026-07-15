/**
 * Shared helpers for reading user info (including role) out of the JWT
 * access token, so every page/component decodes the token the same way.
 *
 * NOTE: This assumes the backend embeds a `role` claim in the JWT payload
 * (alongside `user_id`, `program`, `batch`, `stream`, which are already
 * relied on elsewhere — see pages/Profile.jsx). If the real claim name
 * differs, update ROLE_CLAIM_KEY below.
 */

const ROLE_CLAIM_KEY = "role";

export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  MODERATOR: "moderator",
  ADMIN: "admin",
};

/** Decode a JWT's payload without verifying the signature (display-only). */
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch (e) {
    console.error("Token decoding error:", e);
    return null;
  }
};

/** Returns a normalized user object derived from the token, or null. */
export const getUserFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;
  return {
    userId: payload.user_id,
    name: payload.name || null,
    role: payload[ROLE_CLAIM_KEY] || ROLES.STUDENT,
    program: payload.program,
    batch: payload.batch,
    stream: payload.stream,
  };
};

/** Convenience: is this role allowed to verify notes / create announcements, etc. */
export const roleAtLeast = (role, allowed = []) => allowed.includes(role);
