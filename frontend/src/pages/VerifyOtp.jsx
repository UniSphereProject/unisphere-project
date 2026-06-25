import axios from "axios";
import { useState } from "react";
import { useLocation, useParams,NavLink } from "react-router-dom";
import { ToastContainer,toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyOtp = () => {
  const location = useLocation();
  const { id } = useParams(); 

  const email = location.state?.email;
  const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;
const [success,setSuccess]=useState(false)
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setSuccess(false)

      const res = await axios.post(
        `${BASE_URL}/api/auth/verify/${id}`,
        {
          otp,
        }
      );

      setMessage(res.data.message);
      setSuccess(true)
      toast.success('Registered')
      console.log(res.data);
    } catch (err) {
      console.error(err);
      toast.error('OTP verification failed.')
      setMessage(
        err.response?.data?.detail?.[0]?.msg ||
          "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
 <ToastContainer  toastStyle={{
    width: "400px",
    fontSize: "18px",
    padding: "16px",
  }}/>

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
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
          placeholder="Enter OTP"
          className="mt-6 w-full px-4 py-3 text-center text-lg tracking-widest border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {message && (
          <>
          <p className="mt-4 text-center text-sm text-gray-600">
            {message}
          </p>
        
         { success ? (<NavLink  to='/' className={'text-orange-500 underline mt-4 text-center font-bold text-lg'} >Log in</NavLink>): null}
          </>
        )}

     

      </div>
    </div>
 </> );
};

export default VerifyOtp;