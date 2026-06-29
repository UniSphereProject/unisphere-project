import React, { useState, useEffect } from "react";
import { TrendingUp, MessageCircle, ThumbsUp, Loader2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const TrendingPanel = () => {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await API.get("/trending", { params: { limit: 10 } });
      setTrending(res.data || []);
    } catch (err) {
      console.error("Failed to load trending posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <Flame size={20} className="text-orange-500" />
        <h2 className="text-base font-bold text-gray-900">Trending</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
          <span className="ml-2 text-sm text-gray-400">Loading...</span>
        </div>
      ) : trending.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No trending posts this week
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {trending.map((post, index) => (
            <button
              key={post.id}
              className="text-left group cursor-pointer"
              onClick={() => navigate(`/home?post=${post.id}`)}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-gray-300 group-hover:text-orange-400 transition">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition line-clamp-2">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {post.reaction_summary && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {post.reaction_summary.likes}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {post.comment_count}
                    </span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingPanel;
