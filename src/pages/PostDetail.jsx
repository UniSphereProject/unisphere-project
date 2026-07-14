import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Discussion from "../components/Discussion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TrendingPanel from "../components/TrendingPanel";
import API from "../utils/api";

/**
 * PostDetail — displays a single post fetched by its ID.
 * Route: /post/:id
 * Backend endpoint: GET /posts/{id}
 * Layout mirrors Home.jsx to maintain consistent UI.
 */
const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Post not found.");
        } else {
          setError("Failed to load the post.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  return (
    <div className="bg-slate-100 min-h-screen m-0 py-2">
      <Navbar />
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar
          onCommunitySelect={(slug) => navigate(`/home?community=${slug}`)}
          onCreatePost={() => navigate('/home?create=1')}
        />

	          {/* Main Content */}
	          <div className="mt-16 flex-1 px-2 sm:px-4 py-4 ml-0 md:ml-64 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
              <span className="mt-3 text-sm text-gray-400">Loading post...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-500 text-lg font-medium">{error}</p>
              <button
                onClick={() => navigate("/home")}
                className="mt-4 px-5 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          ) : post ? (
            <div className="max-w-2xl mx-auto">
              <Discussion post={post} />
            </div>
          ) : null}
        </div>

        {/* Right Trending Panel — hidden on small screens */}
        <div className="mt-16 w-72 hidden lg:block pr-4 py-4">
          <div className="sticky top-20">
            <TrendingPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
