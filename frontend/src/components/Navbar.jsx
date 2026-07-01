import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Bell,
  User,
  LogOut,
  X,
  Hash,
  Menu,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  MessageSquare,
  Megaphone,
  SearchCheck,
  Plus,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import API from "../utils/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { mobileOpen, toggleSidebar, closeSidebar } = useSidebar();

  // ── Mobile nav drawer ────────────────────────────────────────────────
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [forumExpanded, setForumExpanded] = useState(true);

  const openMobileNav = () => setMobileNavOpen(true);
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    setForumExpanded(true);
  };

  // ── Search state ───────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post("/api/auth/logout", {});
    } catch (error) {
      console.log(error);
    } finally {
      logout();
      navigate("/", { replace: true });
    }
  };

  // ── Debounced search ──────────────────────────────────────────────────
  const doSearch = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await API.get("/search", { params: { q: term.trim(), limit: 5 } });
      setResults(res.data || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  // ── Close dropdown on click outside ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close on Escape ────────────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowDropdown(false);
        setMobileSearchOpen(false);
        closeSidebar();
        closeMobileNav();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeSidebar]);

  // ── Close mobile nav on route change ──────────────────────────────────
  useEffect(() => {
    closeMobileNav();
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // ── Post-type badge colours ────────────────────────────────────────────
  const typeBadgeColor = (type) => {
    const map = {
      discussion: "bg-blue-100 text-blue-700",
      notes: "bg-green-100 text-green-700",
      announcement: "bg-purple-100 text-purple-700",
      lost_found: "bg-amber-100 text-amber-700",
      complaint: "bg-red-100 text-red-700",
      project: "bg-teal-100 text-teal-700",
    };
    return map[type] || "bg-gray-100 text-gray-700";
  };

  // ── Mobile nav items ──────────────────────────────────────────────────
  const forumSubcategories = [
    { name: "Academics", slug: "academics", icon: <FileText size={18} /> },
    { name: "Doubts", slug: "doubts", icon: <MessageSquare size={18} /> },
    { name: "Placements", slug: "placements", icon: <MessageSquare size={18} /> },
    { name: "Events", slug: "events", icon: <Megaphone size={18} /> },
    { name: "Campus Life", slug: "campus-life", icon: <MessageSquare size={18} /> },
    { name: "Complain", slug: "complain", icon: <MessageSquare size={18} /> },
    { name: "Announcements", slug: "announcements", icon: <Megaphone size={18} /> },
    { name: "Lost & Found", slug: "lost-and-found", icon: <SearchCheck size={18} /> },
  ];

  // ── Search results dropdown (shared by desktop and mobile) ────────────
  const searchResultsDropdown = (
    <>
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {searchLoading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            results.map((post) => (
              <button
                key={post.id}
                onClick={() => {
                  setShowDropdown(false);
                  setQuery("");
                  setMobileSearchOpen(false);
                  navigate(`/home?post=${post.id}`);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-start gap-3 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <Hash size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${typeBadgeColor(post.post_type)}`}>
                    {post.post_type?.replace("_", " ")}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results found
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <nav className="flex h-16 items-center justify-between px-4 md:px-6 py-3 bg-white shadow-sm fixed top-0 left-0 w-full z-50">

        {/* Logo */}
        <img
          src="./blackglobe.png"
          alt="logo"
          onClick={() => navigate("/home")}
          className="h-24 w-auto object-contain shrink-0 cursor-pointer"
        />

        {/* ── Desktop nav links (hidden on mobile) ──────────────────────── */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `px-4 py-2 text-base ${
                isActive
                  ? "text-blue-600 underline underline-offset-4 font-semibold"
                  : "text-black hover:text-gray-600"
              }`
            }
          >
            <span>Forum</span>
          </NavLink>

          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `px-4 py-2 text-base ${
                isActive
                  ? "text-blue-600 underline underline-offset-4 font-semibold"
                  : "text-black hover:text-gray-600"
              }`
            }
          >
            <span>Notes</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `px-4 py-2 text-base ${
                isActive
                  ? "text-blue-600 underline underline-offset-4 font-semibold"
                  : "text-black hover:text-gray-600"
              }`
            }
          >
            <span>Projects</span>
          </NavLink>
        </div>

        {/* ── Desktop search bar (hidden on mobile) ──────────────────────── */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search posts..."
            value={query}
            onChange={handleSearchChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            className="w-full px-4 py-2 my-1 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <button className="hover:cursor-pointer hover:bg-gray-100 p-2 rounded-full">
            <Search size={20} />
          </button>
          {searchResultsDropdown}
        </div>

        {/* ── Desktop right-side icons (hidden on mobile) ─────────────────── */}
        <div className="hidden md:flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 cursor-pointer">
            <Bell size={22} />
          </button>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors ${
                isActive ? "text-blue-600 bg-blue-50" : "text-gray-700"
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
        </div>

        {/* ── Mobile right-side buttons ─────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <button
            onClick={openMobileNav}
            className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* ── Mobile search bar (slides down below navbar) ─────────────────── */}
      {mobileSearchOpen && (
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-40 px-4 py-3 md:hidden border-b border-gray-100">
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              name="mobile-search"
              placeholder="Search posts..."
              value={query}
              onChange={handleSearchChange}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              autoFocus
              className="w-full px-4 py-2.5 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm pr-12"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
            <button className="absolute right-3 top-1/2 -translate-y-1/2 hover:cursor-pointer text-gray-500">
              <Search size={18} />
            </button>
            {searchResultsDropdown}
          </div>
        </div>
      )}

      {/* ── Mobile Navigation Drawer ────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMobileNav}
          />
          {/* Drawer panel */}
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-xl font-bold text-orange-500">UniSphere</span>
              <button
                onClick={closeMobileNav}
                className="p-2 rounded-full hover:bg-gray-100 cursor-pointer text-gray-500"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {/* Create Post */}
              <button
                onClick={() => {
                  closeMobileNav();
                  navigate("/home?create=1");
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer touch-manipulation"
              >
                <Plus size={18} />
                <span>Create Post</span>
              </button>

              {/* Forum (expandable) */}
              <div>
                <button
                  onClick={() => setForumExpanded((prev) => !prev)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-base font-semibold text-gray-800 hover:bg-slate-50 cursor-pointer transition touch-manipulation active:bg-slate-100"
                >
                  <span className="flex items-center gap-3">
                    <MessageSquare size={20} className="text-blue-600" />
                    Forum
                  </span>
                  {forumExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {forumExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-2">
                    {forumSubcategories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => {
                          closeMobileNav();
                          navigate(`/home?community=${cat.slug}`);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-slate-100 cursor-pointer transition touch-manipulation active:bg-slate-200"
                      >
                        {cat.icon}
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <NavLink
                to="/notes"
                onClick={closeMobileNav}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold cursor-pointer transition touch-manipulation active:bg-slate-200 ${
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "text-gray-800 hover:bg-slate-50"
                  }`
                }
              >
                <FileText size={20} className="text-green-600" />
                Notes
              </NavLink>

              {/* Projects */}
              <NavLink
                to="/projects"
                onClick={closeMobileNav}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold cursor-pointer transition touch-manipulation active:bg-slate-200 ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-800 hover:bg-slate-50"
                  }`
                }
              >
                <FolderKanban size={20} className="text-teal-600" />
                Projects
              </NavLink>
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              <NavLink
                to="/profile"
                onClick={closeMobileNav}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-slate-50 cursor-pointer transition touch-manipulation"
              >
                <User size={18} />
                Profile
              </NavLink>
              <button
                onClick={() => { closeMobileNav(); handleLogout(); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer transition touch-manipulation"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
