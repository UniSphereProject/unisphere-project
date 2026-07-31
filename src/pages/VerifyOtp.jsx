import axios from "axios";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Backend error `detail` can be either a plain string (HTTPException(detail="..."))
// or a list of Pydantic validation errors ([{ msg, ... }, ...]) — handle both,
// the same way Register.jsx does, instead of assuming it's always an array.
const extractErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  if (typeof detail === "string") return detail;
  return fallback;
};

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // Register.jsx passes state as `{ registeredEmail }`, not `{ email }`.
  const email = location.state?.registeredEmail;
  const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        `${BASE_URL}/api/auth/verify/${id}`,
        {
          otp,
        }
      );

      // res.data is a JSON object (e.g. { message, access_token, user, ... }),
      // never a plain string — rendering it directly as `{message}` in JSX
      // throws "Objects are not valid as a React child" and crashes the page.
      // Pull out a human-readable string instead.
      const successText =
        (typeof res.data === "string" ? res.data : res.data?.message) ||
        "Email verified successfully! You can now log in.";

      setMessage(successText);
      setSuccess(true);

      // Give the user a moment to see the confirmation, then send them on.
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      console.error(err);
      setSuccess(false);
      setMessage(extractErrorMessage(err, "OTP verification failed."));
    } finally {
      setLoading(false);
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

        {email && (
          <p className="text-xs text-gray-400 text-center mt-1 break-all">
            {email}
          </p>
        )}

        <input
          type="text"
          value={otp}
          maxLength={6}
          disabled={success}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
          placeholder="Enter OTP"
          className="mt-6 w-full px-4 py-3 text-center text-lg tracking-widest border rounded-lg outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || success}
          className="mt-5 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : success ? "Verified" : "Verify OTP"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center text-sm ${
              success ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

      </div>
    </div>
  );
};

export default VerifyOtp;