import React, { useState } from "react";
import axios from "axios";
import { User ,Eye,EyeOff} from "lucide-react";
import { Link } from "react-router-dom";


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
      className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm
                 outline-none transition
                 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:bg-white"
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
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  const emailRegex = /^[A-Za-z0-9._%+-]+@(student\.)?pu\.edu\.np$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErr("");
    setSuccess(false);

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

      console.log(res.data);
      setSuccess(true);

      // optional reset
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Register</h1>
          <p className="text-gray-500 mt-2">Be a part of Unisphere</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Avatar placeholder (no upload anymore) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-orange-100 flex items-center justify-center bg-gray-50">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">
              Profile picture will be added later
            </span>
          </div>

          <Field
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hari Bahadur Dhungana"
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
            placeholder="Min 8 characters"
            required
          />

           <button type="button " className="absolute right-3 top-1/2 -translate-y-1/8 text-sm text-gray-500" onClick={()=>setShowPassword(!showPassword)}> 
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

           <button type="button " className="absolute right-3 top-1/2 -translate-y-1/8 text-sm text-gray-500" onClick={()=>setShowCpassword(!showCpassword)}> 
                 { showCpassword ? <EyeOff/> : <Eye />} 
                 </button>  

</div>
        

          {/* Error */}
          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {err}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              Account created successfully! OTP sent to email.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold transition
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
  );
};

export default Tryregister;