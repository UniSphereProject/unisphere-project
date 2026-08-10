import ProjectDetails from "./pages/ProjectDetails";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ProjectProvider } from "./context/ProjectContext";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Forgetpw from "./pages/Forgetpw";
import Notice from "./pages/Notice";
import Notes from "./pages/Notes";
import Projects from "./pages/Projects";
import Tryregister from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import PostDetail from "./pages/PostDetail";
import SearchResult from "./pages/SearchResult";
import Moderator from "./pages/Moderator";
import Teacher from "./pages/Teacher";

import { ROLES } from "./utils/auth";

const RootRoute = () => {
  const { token } = useAuth();
  const storedToken = localStorage.getItem("token");

  if (token || storedToken) {
    return <Navigate to="/home" replace />;
  }

  return <Login />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <SidebarProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/register" element={<Tryregister />} />
              <Route path="/verify-otp/:id" element={<VerifyOtp />} />
              <Route path="/forgetpw" element={<Forgetpw />} />
              <Route
                path="/reset-password"
                element={<ResetPassword />}
              />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notice" element={<Notice />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/projects" element={<Projects />} />
                <Route
                  path="/projects/:id"
                  element={<ProjectDetails />}
                />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route
                  path="/search-result"
                  element={<SearchResult />}
                />
              </Route>

              {/* Moderator */}
              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={[ROLES.MODERATOR, ROLES.ADMIN]}
                  />
                }
              >
                <Route
                  path="/moderator"
                  element={<Moderator />}
                />
              </Route>

              {/* Teacher */}
              <Route
                element={
                  <RoleProtectedRoute
                    allowedRoles={[
                      ROLES.TEACHER,
                      ROLES.MODERATOR,
                      ROLES.ADMIN,
                    ]}
                  />
                }
              >
                <Route
                  path="/teacher"
                  element={<Teacher />}
                />
              </Route>
            </Routes>
          </SidebarProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;