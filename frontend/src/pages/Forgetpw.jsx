import axios from "axios";
import  { useState } from "react";
import { useLocation,useNavigate } from "react-router-dom";

const Forgetpw = () => {
  const location = useLocation();
  const navigate=useNavigate()
  const email = location.state?.email;
    const BASE_URL=import.meta.env.VITE_BACKEND_API_BASE_URL;
const[loading,setLoading]=useState(false)
  const [code, setCode] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const res = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        {
          email,
          code,
        }
      );
navigate('/reset-password',{
  state:{
    resetToken:res.data.reset_token
  },
})
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }finally{
      setLoading(false)
    }
  };

  return (
    <>

    {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium"> Loading...</span>
          </div>
        </div>
      )}

    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-sm">

        <h2 className="text-2xl font-bold text-center text-gray-800">
          Verify code
        </h2>

        <p className="text-sm text-gray-500 text-center mt-2">
          Enter the 6-digit code sent to your email
        </p>

        <p className="text-xs text-gray-400 text-center mt-1 break-all">
          {email}
        </p>

        <input
          type="text"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter code"
          className="mt-6 w-full px-4 py-3 text-center text-lg tracking-widest border rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
        />

        <button
          onClick={handleSubmit}
          className="mt-5 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition hover:cursor-pointer"
        >
          Verify code
        </button>

      </div>
    </div>
 </> );
};

export default Forgetpw;