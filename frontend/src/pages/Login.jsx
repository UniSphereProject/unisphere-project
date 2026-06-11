import axios from "axios";
import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", {
        email,
        password,
      });
      console.log(res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        navigate("/home");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleForgetPw = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter email first!");
      return;
    }
    try {
      navigate('/forgetpw',{ state:{email}})
         let res= await axios.post("http://localhost:8000/api/auth/forget-password", {email });
         
    } catch (error) {
        console.log(error)
    }
    
  };


  return (
    <>
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
                  required
                  autoComplete
                  ="email"
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
                    onClick={handleForgetPw}
                    className="font-semibold text-unisphere-orange hover:text-unisphere-orange-hover hover:cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete
                  ="current-password"
                  placeholder="Min. 8 characters"
                  className="block   placeholder:text-gray-400 w-full rounded-xl bg-gray-50 px-3.5 py-2.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl bg-unisphere-orange px-3 py-3 text-sm/6 font-semibold text-white shadow-xs hover:bg-unisphere-orange-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:cursor-pointer"
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
