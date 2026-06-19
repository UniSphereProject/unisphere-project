import axios from "axios";
import React from "react";
import { useState } from "react";
import{Eye,EyeOff } from 'lucide-react'
import { Link, useNavigate ,Navigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[showPassword,setShowPassword]=useState(false)
  const [loading, setIsLoading] = useState(false);
  const[loadingText,setLoadingText]=useState('Loading...')
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login ,token} = useAuth();
const storedToken = localStorage.getItem("token");

  if (token ||  storedToken) {
    return <Navigate to="/home" replace />;
  }
  
  const BASE_URL=import.meta.env.VITE_BACKEND_API_BASE_URL;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
  setError(null);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      console.log(res.data);

      const backendToken =
        res.data?.token ||
        res.data?.access_token ||
        res.data?.accessToken ||
        res.data?.data?.token;

      if (backendToken) {
        login(backendToken);
      } else {
        throw new Error("Login succeeded but no token was returned.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.")
    } finally{
      setIsLoading(false)
    }
  };

  const handleForgetPw = async (e) => {
    e.preventDefault();
   
    if (!email) {
      alert("Please enter email first!");
      return;
    }
     setIsLoading(true);
     setLoadingText('Sending OTP to your mail...')
    try {
     
      let res = await axios.post(
        `${BASE_URL}/api/auth/forgot-password`,
        { email },
      );
      navigate("/forgetpw", { state: { email } });
    } catch (err) {
     setError(err.response?.data?.message || "Failed to send OTP");
    } finally{
      setIsLoading(false)
      setLoadingText('Loading...')
    }
  };

  return (
    <>

      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">{loadingText}</span>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-10 ">
        <div className="flex min-h-full max-w-md w-full  flex-col justify-center px-6 py-12 lg:px-12 rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm ">
            <img
              src="/blackglobe.png"
              alt="UniSphere"
              className="mx-auto h-50 w-auto"
            />
            <h2 className="mt-5 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
              Log in to your account
            </h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm flex justify-between items-center">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 font-bold ml-4"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Email
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    required
                    autoComplete="email"
                    placeholder="student@pu.edu.np"
                    className="block w-full rounded-xl bg-gray-50 px-3.5 py-2.5 text-base 
                  text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handleForgetPw}
                      className="font-semibold text-unisphere-orange hover:text-unisphere-orange-hover hover:cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="mt-2 relative">

                     <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    required
                    autoComplete="current-password"
                    placeholder="Min. 8 characters"
                    className="block   placeholder:text-gray-400  pr-12 w-full rounded-xl bg-gray-50 px-3.5 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    onChange={(e) => setPassword(e.target.value)}
                   
                  />

                 <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" onClick={()=>setShowPassword(!showPassword)}> 
                 { showPassword ? <EyeOff/> : <Eye />} 
                 </button>  

                  </div>
                 
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-xl bg-unisphere-orange px-3 py-3 text-sm/6 font-semibold text-white shadow-xs hover:bg-unisphere-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:cursor-pointer"
                   disabled={loading}
                >
                  Log in
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm/6 text-gray-500">
              Don't have an account?
              <Link
                to="/register"
                className="font-semibold text-unisphere-orange hover:text-unisphere-orange-hover"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;