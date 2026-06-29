
import { Search,Bell,User,LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
const Navbar = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [loading,setLoading]=useState(false)
  const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL

  const handleLogout = async () => {
    try {
      setLoading(true)
      await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true })
    } catch (error) {
      console.log(error)
    } finally {
      logout()
      setLoading(false)
      navigate("/", { replace: true })
    }
  }

  return (
   <>
   {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium"> Logging Out... </span>
          </div>
        </div>
      )}
   <nav className='flex  h-16 items-center justify-around px-6 py-3 bg-white shadow-sm fixed top-0 left-0 w-full z-50'>

   <img
  src="./blackglobe.png"
  alt="logo"
  className="h-full w-auto object-contain scale-250"
/>

<NavLink
  to="/home"
 className={({ isActive }) =>
  `px-4 py-2 ${
    isActive
      ? "text-orange-500 underline underline-offset-4 "
      : "text-black"
  }`
}
>
  <span>Forum</span>
</NavLink>

<NavLink
  to="/notes"
 className={({ isActive }) =>
  `px-4 py-2 ${
    isActive
      ? "text-orange-500 underline underline-offset-4 "
      : "text-black"
  }`
}
>
  <span>Notes</span>
</NavLink>



<div className="flex items-center flex-1 max-w-md mx-8 ">
    <input type="text" name="search" id="search"  placeholder=' Search '  className="  w-full px-2 py-2 my-1 border rounded-full focus:outline-none "/>
    <button className='hover:cursor-pointer hover:bg-gray-100 p-2 rounded-full' ><Search size={20}/></button>
</div>
    <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer" > <Bell size={22}/></button>

     <NavLink
      to="/profile"
      className={({ isActive }) =>
        `p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors ${
          isActive ? "text-orange-500 bg-orange-50" : "text-gray-700"
        }`
      }
    >
      <User size={22} />
    </NavLink>

    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
    >
      <LogOut size={18} />
      <span>Logout</span>
    </button>
   
   </nav>

   </>
  )
}

export default Navbar