import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
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
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";


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
    <AuthProvider>
      <Routes>
        {/* public routes - anyone can visit these */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/register" element={<Tryregister />} />
        <Route path="/verify-otp/:id" element={<VerifyOtp/>} /> 
        <Route path="/forgetpw" element={<Forgetpw />} />
        <Route path="/reset-password" element={<ResetPassword/>} />
 
      
        
          <Route element={<ProtectedRoute />}>

	           <Route path="/home" element={<Home />} />
	           <Route path="/profile" element={<Profile />} />
	          <Route path="/notice" element={<Notice />} />
	          <Route path="/notes" element={<Notes />} />
		          <Route path="/projects" element={<Projects />} />
		          <Route path="/post/:id" element={<PostDetail />} />

		           </Route>
        
     
      
         
       
      </Routes>
    </AuthProvider>
  );
};

export default App;