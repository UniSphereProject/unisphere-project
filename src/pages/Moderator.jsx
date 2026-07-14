import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Search, Loader2, ShieldAlert, Users, Save } from "lucide-react";
import { toast } from "react-toastify";
import { listUsers, updateUserRole } from "../utils/roleApi";
import { ROLES } from "../utils/auth";

const ROLE_OPTIONS = [ROLES.STUDENT, ROLES.TEACHER, ROLES.MODERATOR, ROLES.ADMIN];

const Moderator = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingRoles, setPendingRoles] = useState({}); // { [userId]: role } for unsaved dropdown changes
  const [savingId, setSavingId] = useState(null);

  const fetchUsers = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers(query);
      const list = res.data?.items || res.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError(
        err.response?.status === 404
          ? "User management endpoint not found. The backend route in utils/roleApi.js may need updating."
          : "Failed to load users. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(search.trim());
  };

  const handleRoleSelect = (userId, role) => {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (user) => {
    const newRole = pendingRoles[user.id];
    if (!newRole || newRole === user.role) return;
    setSavingId(user.id);
    try {
      await updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setPendingRoles((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      toast.success(`${user.name || "User"}'s role updated to ${newRole}.`);
    } catch (err) {
      console.error("Failed to update role:", err);
      const detail = err.response?.data?.detail;
      toast.error(detail || "Failed to update role.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen m-0 py-2">
      <Navbar />
      <div className="flex">
        <Sidebar
          onCommunitySelect={(slug) => navigate(`/home?community=${slug}`)}
          onCreatePost={() => navigate("/home?create=1")}
        />

        <div className="mt-16 flex-1 px-3 sm:px-6 py-4 ml-0 md:ml-64">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="text-orange-500" size={26} />
              <h1 className="text-2xl font-bold text-gray-800">Moderator Panel</h1>
            </div>

            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg cursor-pointer transition active:scale-95"
              >
                Search
              </button>
            </form>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={36} className="animate-spin text-orange-500" />
                  <p className="text-gray-400 mt-3">Loading users...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Users size={40} className="text-gray-300 mb-2" />
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users size={40} className="text-gray-300 mb-2" />
                  <p className="text-gray-400">No users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Current Role</th>
                        <th className="px-4 py-3">Assign Role</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const pending = pendingRoles[user.id];
                        const hasChange = pending && pending !== user.role;
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition"
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {user.name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {user.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 capitalize">
                                {user.role || "student"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={pending ?? user.role ?? ROLES.STUDENT}
                                onChange={(e) => handleRoleSelect(user.id, e.target.value)}
                                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 capitalize"
                              >
                                {ROLE_OPTIONS.map((r) => (
                                  <option key={r} value={r} className="capitalize">
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleSaveRole(user)}
                                disabled={!hasChange || savingId === user.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition active:scale-95"
                              >
                                {savingId === user.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Save size={14} />
                                )}
                                <span>Save</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Moderator;
