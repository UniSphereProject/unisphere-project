import { Search, Bell, User, LogOut, Loader2 } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import api from '../lib/api'

const Navbar = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    try {
      setLoading(true)
      await api.post('/api/auth/logout', {}, { withCredentials: true })
    } catch (error) {
      console.log(error)
    } finally {
      logout()
      setLoading(false)
      navigate('/', { replace: true })
    }
  }

  const handleSearch = async(e) => {
    e.preventDefault()
    let cleanQuery=searchQuery.trim()
    try {
       if (cleanQuery.length >= 1) {
      const res=await api.get('/search',{params:{q:cleanQuery}})
      console.log(res.data)
       }

      if(res.data){
        navigate(`/search-result?q=${encodeURIComponent(cleanQuery)}`)
      }
    
    } catch (error) {
      console.log(error.message)
    }
   
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white px-8 py-6 rounded-xl flex items-center gap-3 shadow-lg">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            <span className="text-gray-700 font-medium"> Logging Out... </span>
          </div>
        </div>
      )}
      <nav className='flex h-16 items-center justify-around px-6 py-3 bg-white shadow-sm fixed top-0 left-0 w-full z-50'>

        <img
          src="./blackglobe.png"
          alt="logo"
          className="h-full w-auto object-contain scale-250"
        />

        <NavLink
          to="/home"
          className={({ isActive }) =>
            `px-4 py-2 ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black"}`
          }
        >
          <span>Forum</span>
        </NavLink>

        <NavLink
          to="/notes"
          className={({ isActive }) =>
            `px-4 py-2 ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black"}`
          }
        >
          <span>Notes</span>
        </NavLink>


        <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-md mx-8">
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder=" Search "
            className="w-full px-2 py-2 my-1 border rounded-full focus:outline-none"
          />
          <button
            type="submit"
            className='hover:cursor-pointer hover:bg-gray-100 p-2 rounded-full'
          >
            <Search size={20} />
          </button>
        </form>

       

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-gray-700"}`
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
