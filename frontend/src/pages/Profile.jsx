import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { User, Camera, Save, Edit2, Loader2, Award, BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const getUserDataFromToken = (token) => {
  const fallback = { userId: "guest", program: "", batch: "", stream: "" };
  if (!token) return fallback;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return {
        userId: payload.user_id || "guest",
        program: payload.program || "",
        batch: payload.batch || "",
        stream: payload.stream || "",
      };
    }
  } catch (e) {
    console.error("Token decoding error:", e);
  }
  return fallback;
};

const formatErrorMsg = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || "An error occurred.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.join(".") || "Error"}: ${d.msg}`).join("; ");
  }
  if (typeof detail === "object" && detail.message) return detail.message;
  return JSON.stringify(detail);
};

const Profile = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const userData = getUserDataFromToken(token);
  const stream = userData.stream;
  const program = userData.program;
  const batch = userData.batch;
  const BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState({ stream: stream, program: program, batch: batch });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const setAndRevokeImageUrl = (newUrl) => {
    setImageUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return newUrl;
    });
  };

  const setAndRevokePreviewUrl = (newUrl) => {
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return newUrl;
    });
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({
        stream: res.data.stream || "",
        program: res.data.program || "",
        batch: res.data.batch || "",
      });
      setHasProfile(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasProfile(false);
        setProfile({
          stream: stream || "",
          program: program || "",
          batch: batch || "",
        });
      } else {
        setError(formatErrorMsg(err));
      }
    } finally {
      setLoading(false);
    }
  }, [token, BASE_URL, stream, program, batch]);

  const fetchProfileImage = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/student/image`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      if (res.data) {
        if (res.data.type === "application/json") {
          const text = await res.data.text();
          try {
            const json = JSON.parse(text);
            if (typeof json === "string") {
              setAndRevokeImageUrl(json);
            } else {
              const url = json.image_url || json.profile_image_url || json.url || json.file_url || json.image || json.image_path;
              if (url) {
                setAndRevokeImageUrl(url);
              } else {
                setAndRevokeImageUrl("");
              }
            }
          } catch (e) {
            if (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/")) {
              setAndRevokeImageUrl(text);
            } else {
              setAndRevokeImageUrl("");
            }
          }
        } else {
          const url = URL.createObjectURL(res.data);
          setAndRevokeImageUrl(url);
        }
      }
    } catch (err) {
      console.log("No profile image set or failed to load image:", err);
      setAndRevokeImageUrl("");
    }
  }, [token, BASE_URL]);

  useEffect(() => {
    if (token) {
      Promise.resolve().then(() => {
        setLoading(true);
        setError(null);
        fetchProfile();
        fetchProfileImage();
      });
    }
    return () => {
      // Cleanup blob URLs on unmount
      setImageUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return "";
      });
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    };
  }, [token, fetchProfile, fetchProfileImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg("");
    setLoading(true);
    try {
      if (hasProfile) {
        await axios.put(`${BASE_URL}/student/profile`, profile, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } else {
        await axios.post(`${BASE_URL}/student/profile`, profile, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setHasProfile(true);
      }
      setSuccessMsg("Profile saved successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(formatErrorMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // reset so same file can be re-selected
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError(null);
    setSuccessMsg("");
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setAndRevokePreviewUrl(url);
  };

  const handleImageConfirm = async () => {
    if (!pendingFile) return;
    setUploadingImage(true);
    setError(null);
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("file", pendingFile);
    try {
      await axios.post(`${BASE_URL}/student/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccessMsg("Profile picture updated!");
      setAndRevokePreviewUrl(null);
      setPendingFile(null);
      await fetchProfileImage();
    } catch (err) {
      setError(formatErrorMsg(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageCancel = () => {
    setAndRevokePreviewUrl(null);
    setPendingFile(null);
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="mt-16 flex-1 ml-16 md:ml-64 p-4 md:p-8">
          <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-6 border-l-4 border-orange-600">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-gray-500 hover:text-gray-700 cursor-pointer transition"
                >
                  <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Student Profile</h1>
              </div>
              {!isEditing && (
                <button
                  onClick={() => { setIsEditing(true); setSuccessMsg(""); setError(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow active:scale-95 cursor-pointer transition"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {successMsg}
              </div>
            )}

            {/* Loading spinner */}
            {loading && !isEditing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                <span className="text-sm text-gray-500">Loading profile...</span>
              </div>
            )}

            {/* Main Content */}
            {(!loading || isEditing) && (
              <div className="flex flex-col md:flex-row gap-8">

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-orange-100 overflow-hidden bg-gray-50 flex items-center justify-center shadow-inner">
                      {/* Show staged preview first, then saved image, then placeholder */}
                      {previewUrl || imageUrl ? (
                        <img
                          src={previewUrl || imageUrl}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-14 h-14 text-gray-400" />
                      )}
                    </div>

                    {/* Camera button — only show when no preview is staged */}
                    {!previewUrl && (
                      <label className="absolute bottom-1 right-1 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full cursor-pointer shadow hover:scale-105 active:scale-95 transition flex items-center justify-center">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Confirm / Cancel when a preview is staged */}
                  {previewUrl ? (
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handleImageCancel}
                        disabled={uploadingImage}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-slate-50 cursor-pointer transition font-medium disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleImageConfirm}
                        disabled={uploadingImage}
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg cursor-pointer transition font-medium disabled:opacity-60"
                      >
                        {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : null}
                        Save picture
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 text-center">Click camera to change</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                      {[
                        { id: "stream", label: "Stream", placeholder: "e.g. Engineering" },
                        { id: "program", label: "Program", placeholder: "e.g. Software" },
                        { id: "batch", label: "Batch / Year", placeholder: "e.g. 2022" },
                      ].map(({ id, label, placeholder }) => (
                        <div key={id} className="flex flex-col gap-1.5">
                          <label htmlFor={id} className="text-xs font-semibold text-gray-700">
                            {label}
                          </label>
                          <input
                            id={id}
                            name={id}
                            type="text"
                            value={profile[id]}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            required
                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-gray-50 placeholder:text-gray-400"
                          />
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-1 text-sm">
                        <button
                          type="button"
                          onClick={() => { setIsEditing(false); setError(null); fetchProfile(); }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-slate-50 border border-gray-200 rounded-lg cursor-pointer transition font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-lg cursor-pointer transition active:scale-95"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          <span>Save</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 py-2">
                      {[
                        { icon: BookOpen, label: "Stream", value: profile.stream },
                        { icon: Award, label: "Program", value: profile.program },
                        { icon: Calendar, label: "Batch", value: profile.batch },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-100">
                          <Icon className="text-orange-500 shrink-0" size={18} />
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
                            <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
