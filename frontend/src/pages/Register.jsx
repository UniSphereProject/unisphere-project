import React from "react";
import { useState } from "react";
import axios from "axios";
import { User } from "lucide-react";
import {Link} from'react-router-dom'

{
  /* 
      yo euta custom component ho input lina lai
      input lai multiple choti type garda redundant hunxa so euta
      common reusuable component banaideko
  */
}

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
    <label
      htmlFor={id}
      className="text-sm font-semibold text-gray-700 tracking-wide"
    >
      {label}
    </label>
    <input
      id={id}
      name={id}
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      required={required}
      placeholder={placeholder}
      className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                 outline-none transition
                 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:bg-white
                 placeholder:text-gray-400"
    />
  </div>
);


const Tryregister = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

 
   const handleSubmit=async(e)=>{
    e.preventDefault()
    setErr('')

if(password !== confirmPassword){
  setErr('Passwords must match!')
  return
}
if(password.length < 8){
setErr('Password must be atleast 8 characters')
return
}


    const formData=new FormData()
    if(profilePic) formData.append("profilepic",profilePic)
    formData.append("username",username)
    formData.append("email",email)
    formData.append("password",password)

    try {
      setLoading(true)
       const res=await axios.post("http://localhost:8000/api/auth/register",formData, { headers: { "Content-Type": "multipart/form-data" } })
      setSuccess(true)
      console.log(res)
      
    } catch (error) {
       setErr(error.response?.data?.message || "Something went wrong. Please try again.");
       setSuccess(false)
    } finally{
      setLoading(false)
    }
   


}

const handleImageChange=(e)=>{
const file=e.target.files[0]
if(file){
setProfilePic(file)
setPreview(URL.createObjectURL(file)) // yesko kam vaneko img ,server ma pathauna aghi nai ui ma image dekhaune[before the image is stored in db.]
}


}

  
  return (
    <>
    
  <div className="min-h-screen  flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Register</h1>
        <p className="text-gray-500 mt-2">
          Be a part of Unisphere
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-3">
          <label
            htmlFor="profilepic"
            className="cursor-pointer"
          >
            <div className="w-24 h-24 rounded-full border-4 border-orange-100 overflow-hidden flex items-center justify-center bg-gray-50 hover:border-orange-300 transition">
              {preview ? (
                <img
                  src={preview}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </label>

          <input
            type="file"
            id="profilepic"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <span className="text-sm text-gray-500">
            Upload Profile Picture
          </span>
        </div>

        <Field
          id="username"
          label="Username"
          type="text"
          value={username}
          placeholder="eg. Hari Bahadur Dhungana"
          required
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@pu.edu.np"
          required
          autoComplete="email"
        />

        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required
          autoComplete="new-password"
        />

        <Field
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          required
          autoComplete="new-password"
        />

        {err && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {err}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            Account created successfully!
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition-all
            ${
              loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 active:scale-95"
            }`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link
          to="/"
          className="text-orange-600 font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  </div>

    </>
  );
};

export default Tryregister;
