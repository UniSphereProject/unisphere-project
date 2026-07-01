import { useState, useEffect, useCallback } from "react";
import { TrendingUp, ThumbsUp, MessageCircle, Loader2, Flame, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { timeAgo } from "../lib/format";

const TrendingSection = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrending = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/trending", { params: { limit: 10 } });
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch trending posts:", err);
      setError("Could not load trending posts.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return (
    <div className="w-80 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-b from-orange-500 to-orange-700 px-4 py-3 flex items-center gap-2">
            <Flame size={18} className="text-white" />
            <h2 className="text-white font-bold text-sm tracking-wide">Trending Now</h2>
          </div>

          <div className="p-3">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
                <span className="text-xs text-gray-400">Loading trends…</span>
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 mb-2">{error}</p>
                <button
                  onClick={fetchTrending}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold cursor-pointer transition"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="text-center py-6">
                <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Nothing trending yet.</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Check back later!</p>
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <ul className="space-y-1">
                {posts.map((post, index) => {
                  const likes = post.reaction_summary?.likes || 0;
                  const comments = post.comment_count || 0;
                  const authorName = post.is_anonymous
                    ? "Anonymous"
                    : post.author?.name || "Unknown";
                  const communityName = post.community?.name || null;

                  return (
                    <li key={post.id}>
                      <div className="group flex gap-2.5 p-2 rounded-lg hover:bg-orange-50/60 transition cursor-pointer">
                        <span
                          className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                            index < 3
                              ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-orange-600 transition">
                            {post.title}
                          </p>

                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="truncate max-w-[80px]">{authorName}</span>
                            {communityName && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[70px] text-orange-400/80 font-medium">
                                  {communityName}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                              <ThumbsUp size={10} /> {likes}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
                              <MessageCircle size={10} /> {comments}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 ml-auto">
                              <Clock size={9} /> {timeAgo(post.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {index < posts.length - 1 && (
                        <div className="border-b border-gray-100 mx-2" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingSection;
