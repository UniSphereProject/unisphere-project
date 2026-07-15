import { Search, User, LogOut, Loader2, MessageSquare, FileText, X, Menu, ShieldAlert, Megaphone } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import api from '../utils/api'
import { getUserFromToken, ROLES } from '../utils/auth'

const Navbar = () => {
  const navigate = useNavigate()
  const { logout, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const role = getUserFromToken(token)?.role
  const isModerator = role === ROLES.MODERATOR || role === ROLES.ADMIN
  const isTeacher = role === ROLES.TEACHER || isModerator

  const handleLogout = async () => {
    try {
      setLoading(true)
      await api.post('/api/auth/logout', {}, { withCredentials: true })
    } catch (error) {
      console.log(error)
    } finally {
      logout()
      setLoading(false)
      setIsMenuOpen(false)
      navigate('/', { replace: true })
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    let cleanQuery = searchQuery.trim()
    if (!cleanQuery) return
    setIsMenuOpen(false)
    navigate(`/search-result?q=${encodeURIComponent(cleanQuery)}`)
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

      {/* Main Navbar container */}
      <nav className="flex h-16 items-center justify-between px-6 py-3 bg-white shadow-sm fixed top-0 left-0 w-full z-50">
        
        {/* Logo (always visible) */}
        <div className="flex items-center h-full">
          <img
            src="./blackglobe.png"
            alt="logo"
            className="h-full w-auto object-contain scale-230"
          />
        </div>

        {/* Desktop Links & Search (hidden on mobile, visible on md and up) */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-around">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `px-3 py-2 transition-colors ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black hover:text-orange-500"}`
            }
          >
            <span>Forum</span>
          </NavLink>

          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `px-3 py-2 transition-colors ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black hover:text-orange-500"}`
            }
          >
            <span>Notes</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `px-3 py-2 transition-colors ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black hover:text-orange-500"}`
            }
          >
            <span>Projects</span>
          </NavLink>

          {isTeacher && (
            <NavLink
              to="/teacher"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 transition-colors ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black hover:text-orange-500"}`
              }
            >
              <Megaphone size={16} />
              <span>Teacher</span>
            </NavLink>
          )}

          {isModerator && (
            <NavLink
              to="/moderator"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 transition-colors ${isActive ? "text-orange-500 underline underline-offset-4" : "text-black hover:text-orange-500"}`
              }
            >
              <ShieldAlert size={16} />
              <span>Moderator</span>
            </NavLink>
          )}

          <form onSubmit={handleSearch} className="flex items-center flex-1 max-w-md mx-8">
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=" Search "
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="hover:cursor-pointer hover:bg-gray-100 p-2 rounded-full ml-1"
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
        </div>

        {/* Mobile Hamburger Button (hidden on desktop, visible on mobile) */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay / Dropdown (visible only on mobile when open) */}
      {isMenuOpen && (
        <div className="fixed inset-x-0 top-16 bg-white border-b border-gray-200 shadow-lg py-4 px-6 flex flex-col gap-4 z-40 md:hidden animate-fadeIn">
          <form onSubmit={handleSearch} className="flex items-center w-full my-2">
            <input
              type="text"
              name="mobile-search"
              id="mobile-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=" Search "
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="hover:cursor-pointer hover:bg-gray-100 p-2 rounded-full ml-1"
            >
              <Search size={20} />
            </button>
          </form>

          <div className="flex flex-col gap-2">
            <NavLink
              to="/home"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-3 rounded-lg font-medium transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
              }
            >
              Forum
            </NavLink>

            <NavLink
              to="/notes"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-3 rounded-lg font-medium transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
              }
            >
              Notes
            </NavLink>

            <NavLink
              to="/projects"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-3 rounded-lg font-medium transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
              }
            >
              Projects
            </NavLink>

            <NavLink
              to="/profile"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
              }
            >
              <User size={20} />
              <span>Profile</span>
            </NavLink>

            {isTeacher && (
              <NavLink
                to="/teacher"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
                }
              >
                <Megaphone size={20} />
                <span>Teacher</span>
              </NavLink>
            )}

            {isModerator && (
              <NavLink
                to="/moderator"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${isActive ? "text-orange-500 bg-orange-50" : "text-black hover:bg-gray-50"}`
                }
              >
                <ShieldAlert size={20} />
                <span>Moderator</span>
              </NavLink>
            )}
          </div>

          <hr className="border-gray-100" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  )
}

export default Navbar
