
import API from "./api";

// Backend exposes two separate no-body endpoints for verification,
// rather than a single toggle with a body — route accordingly.
export const setNoteVerified = (postId, verified) =>
  verified
    ? API.post(`/posts/${postId}/verify`)
    : API.post(`/posts/${postId}/unverify`);


export const listUsers = () => API.get("/moderator/fetch-users");

// PATCH /moderator/change-role  { id, role }
export const updateUserRole = (userId, role) =>
  API.patch("/moderator/change-role", { id: userId, role });
