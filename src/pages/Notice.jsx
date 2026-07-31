
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Information from '../components/Information'
import API from '../utils/api'
import { resolveCommunitySlug } from '../utils/communities'
import { Loader2, Megaphone } from 'lucide-react'

const Notice = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      setError(null);
      try {
        // Resolve the "announcements" community slug to its ID
        const communityId = await resolveCommunitySlug("announcements");

        const params = { limit: 50, sort: "latest" };
        if (communityId) {
          params.community_id = communityId;
        }

        const res = await API.get("/feed", { params });
        setNotices(res.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setError("Failed to load announcements. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
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
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">📢 Notices</h1>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={40} className="animate-spin text-orange-500" />
                  <p className="text-gray-400 mt-4">Loading announcements...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Megaphone size={48} className="text-gray-300" />
                  <p className="text-gray-400 mt-4">{error}</p>
                </div>
              ) : notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Megaphone size={48} className="text-gray-300" />
                  <p className="text-gray-400 mt-4">No announcements posted yet.</p>
                </div>
              ) : (
                notices.map((notice) => (
                  <Information
                    key={notice.id}
                    title={notice.title}
                    info={notice.body || ""}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Notice
