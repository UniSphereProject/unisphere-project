import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Notescard from '../components/Notescard'
import API from '../utils/api'
import { resolveCommunitySlug } from '../utils/communities'
import { Loader2, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserFromToken, ROLES } from '../utils/auth'

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
};

const Notes = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const role = getUserFromToken(token)?.role;
  const canVerify = role === ROLES.TEACHER || role === ROLES.MODERATOR || role === ROLES.ADMIN;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update a single note's verified flag in place after a successful toggle
  const handleVerifyChange = (noteId, verified) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_teacher_verified: verified } : n))
    );
  };

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        // Resolve the "notes" community slug to its ID
        const communityId = await resolveCommunitySlug("notes");

        const params = { limit: 50, sort: "latest" };
        if (communityId) {
          params.community_id = communityId;
        }

        const res = await API.get("/feed", { params });
        setNotes(res.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError("Failed to load notes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <>
      <div className="bg-slate-100 min-h-screen m-0 py-2">
        <Navbar />
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar
            onCommunitySelect={(slug) => navigate(`/home?community=${slug}`)}
            onCreatePost={() => navigate('/home?create=1')}
          />

          {/* Main Content */}
          <div className="mt-16 flex-1 px-3 sm:px-6 py-4 ml-0 md:ml-64">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">📚 Notes</h1>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={40} className="animate-spin text-orange-500" />
                  <p className="text-gray-400 mt-4">Loading notes...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText size={48} className="text-gray-300" />
                  <p className="text-gray-400 mt-4">{error}</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <FileText size={48} className="text-gray-300" />
                  <p className="text-gray-400 mt-4">No notes posted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {notes.map((note) => (
                    <Notescard
                      key={note.id}
                      id={note.id}
                      title={note.title}
                      poster={note.is_anonymous ? "Anonymous" : note.author?.name || "Unknown"}
                      batch={note.author?.role || ""}
                      date={timeAgo(note.created_at)}
                      thumbnail={note.image_url || null}
                      fileName={note.file_name || null}
                      verified={!!note.is_teacher_verified}
                      canVerify={canVerify}
                      onVerifyChange={handleVerifyChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notes
