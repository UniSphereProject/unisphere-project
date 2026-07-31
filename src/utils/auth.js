/**
 * Shared helpers for reading user info (including role) for the logged-in
 * user, so every page/component gets it the same way.
 *
 * IMPORTANT: the backend does NOT embed a `role` claim in the JWT payload —
 * the JWT only carries `user_id`, `exp`, `type`. The role instead comes back
 * in the top-level `user` object of the /api/auth/login response, e.g.
 *   { access_token, token_type, user: { name, id, role, created_at } }
 * So on login we cache that `user` object in localStorage (see
 * cacheUserInfo/getCachedUserInfo below), and getUserFromToken() falls back
 * to that cache for any field the JWT itself doesn't carry.
 */

const ROLE_CLAIM_KEY = "role";
const USER_INFO_KEY = "userInfo";

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

/** Cache the `user` object returned by the login response (call this from login()). */
export const cacheUserInfo = (user) => {
  if (!user) return;
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to cache user info:", e);
  }
};

/** Read back whatever was cached by cacheUserInfo, or null. */
export const getCachedUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_INFO_KEY) || "null");
  } catch (e) {
    return null;
  }
};

/** Clear the cached user info (call this from logout()). */
export const clearCachedUserInfo = () => {
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * Returns a normalized user object, or null. Prefers claims embedded in the
 * JWT itself, and fills in anything missing (notably `role`) from the user
 * object cached at login time.
 */
export const getUserFromToken = (token) => {
  const payload = decodeToken(token);
  if (!payload) return null;

  const cached = getCachedUserInfo();

  return {
    userId: payload.user_id ?? cached?.id ?? null,
    name: payload.name || cached?.name || null,
    role: payload[ROLE_CLAIM_KEY] || cached?.role || ROLES.STUDENT,
    program: payload.program,
    batch: payload.batch,
    stream: payload.stream,
  };
};

/** Convenience: is this role allowed to verify notes / create announcements, etc. */
export const roleAtLeast = (role, allowed = []) => allowed.includes(role);
