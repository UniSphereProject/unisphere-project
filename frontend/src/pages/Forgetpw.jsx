import axios from "axios";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const Forgetpw = () => {
  const location = useLocation();
  const email = location.state?.email;
    const BASE_URL=import.meta.env.VITE_BACKEND_API_BASE_URL;

  const [otp, setOtp] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        {
          email,
          otp,
        }
      );

      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center text-gray-800">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-500 text-center mt-2">
          Enter the 6-digit code sent to your email
        </p>

        <p className="text-xs text-gray-400 text-center mt-1 break-all">
          {email}
        </p>

        <input
          type="text"
          value={otp}
          maxLength={6}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter OTP"
          className="mt-6 w-full px-4 py-3 text-center text-lg tracking-widest border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
        />

        <button
          onClick={handleSubmit}
          className="mt-5 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition hover:cursor-pointer"
        >
          Verify OTP
        </button>

      </div>
    </div>
  );
};

export default Forgetpw;