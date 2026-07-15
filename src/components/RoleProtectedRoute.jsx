import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserFromToken } from "../utils/auth";

/**
 * Wraps routes that require both authentication AND a specific role
 * (e.g. teacher, moderator). Usage:
 *
 *   <Route element={<RoleProtectedRoute allowedRoles={["moderator", "admin"]} />}>
 *     <Route path="/moderator" element={<Moderator />} />
 *   </Route>
 */
const RoleProtectedRoute = ({ allowedRoles = [] }) => {
  const { token, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const user = getUserFromToken(token);
  const role = user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
