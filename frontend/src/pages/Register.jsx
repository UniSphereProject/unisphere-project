import React, { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link ,useNavigate} from "react-router-dom";


const Field = ({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700">
      {label}
    </label>

    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      required={required}
      placeholder={placeholder}
      className="px-3.5 py-2.5 rounded-xl border border-orange-100/80 bg-white/85 text-sm
                 shadow-sm outline-none transition placeholder:text-gray-400
                 focus:border-unisphere-orange focus:ring-4 focus:ring-orange-100 focus:bg-white"
    />
  </div>
);

const Tryregister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const [showPassword,setShowPassword]=useState(false)
const [showCpassword,setShowCpassword]=useState(false)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const emailRegex = /^[A-Za-z0-9._%+-]+@(student\.)?pu\.edu\.np$/;

  const navigate=useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErr("");
   

    // validation
    if (!name || !email || !password || !confirmPassword) {
      setErr("All fields are required");
      return;
    }

    if (!emailRegex.test(email)) {
      setErr("Email must be user@student.pu.edu.np or @pu.edu.np");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    const data = {
      name,
      email,
      password,
    };
        const BASE_URL=import.meta.env.VITE_BACKEND_API_BASE_URL;

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/auth/register`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(res.data)

      const registeredEmail = email;
     
        navigate(`/verify-otp/${res.data.id}` ,{
        state:{registeredEmail}
      })
    

      //reset
setName("");
setEmail("");
setPassword("");
setConfirmPassword("");

     

    } catch (error) {
      console.log(error.response?.data);

      const backendError =
        error.response?.data?.detail;

      if (Array.isArray(backendError)) {
        setErr(backendError.map((e) => e.msg).join(", "));
      } else {
        setErr(backendError || "Something went wrong");
      }

    } finally {
      setLoading(false);
    }
  };

  return (

<>


      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium"> Creating Your Account...</span>
          </div>
        </div>
      )}


    <div className="relative min-h-screen overflow-hidden px-4 py-10">
      <img
        src="/UniSphere_Login_Background.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-white/45"></div>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-3xl shadow-2xl shadow-orange-950/10 p-8 border border-white/70 ring-1 ring-orange-100/70">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-unisphere-orange">Register</h1>
          <p className="text-gray-500 mt-2">Be a part of Unisphere</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

        

          <Field
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="eg. Balendra Shah"
            required
          />

          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@student.pu.edu.np or user@pu.edu.np"
            required
          />
<div className="mt-2 relative">
   <Field
            id="password"
            label="Password"
            type={showPassword? 'text': 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
          />

           <button type="button" className="absolute right-3 top-1/2 -translate-y-1/8 text-sm text-gray-500" onClick={()=>setShowPassword(!showPassword)}> 
                 { showPassword ? <EyeOff/> : <Eye />} 
                 </button>  
          </div>
         
<div className="mt-2 relative">
    <Field
            id="confirmPassword"
            label="Confirm Password"
            type={showCpassword? 'text': 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            required
          />

           <button type="button" className="absolute right-3 top-1/2 -translate-y-1/8 text-sm text-gray-500" onClick={()=>setShowCpassword(!showCpassword)}> 
                 { showCpassword ? <EyeOff/> : <Eye />} 
                 </button>  

</div>
        

          {/* Error */}
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {err}
            </p>
          )}


          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold shadow-lg shadow-orange-500/25 transition cursor-pointer
              ${loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 active:scale-95"
              }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>
        

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-orange-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

      </div>
      </div>
    </div>
 </> );
};

export default Tryregister;
