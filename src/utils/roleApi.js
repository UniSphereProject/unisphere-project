
import API from "./api";


export const setNoteVerified = (postId, verified) =>
  API.post(`/posts/${postId}/verify`, { verified });


export const listUsers = (search = "") =>
  API.get("/moderator/fetch-users", { params: search ? { search } : {} });

// Best guess: PATCH /admin/users/{id}/role  { role: "teacher" }
export const updateUserRole = (userId, role) =>
  API.patch(`/moderator/change-role/${userId}/role`, { role });
