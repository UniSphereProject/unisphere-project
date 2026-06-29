
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, User, LogOut, X, Hash } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ── Search state ───────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

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
      if (e.key === "Escape") setShowDropdown(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

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

  return (
    <>
      <nav className="flex h-16 items-center justify-around px-6 py-3 bg-white shadow-sm fixed top-0 left-0 w-full z-50">
        {/* Logo */}
        <img
          src="./blackglobe.png"
          alt="logo"
          className="h-full w-auto object-contain scale-250"
        />

        {/* Nav links — blue active underline */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `px-4 py-2 ${
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
            `px-4 py-2 ${
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
            `px-4 py-2 ${
              isActive
                ? "text-blue-600 underline underline-offset-4 font-semibold"
                : "text-black hover:text-gray-600"
            }`
          }
        >
          <span>Projects</span>
        </NavLink>

        {/* Search bar with dropdown */}
        <div className="flex items-center flex-1 max-w-md mx-8 relative" ref={searchRef}>
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

          {/* Dropdown overlay */}
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
        </div>

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
      </nav>
    </>
  );
};

export default Navbar;
