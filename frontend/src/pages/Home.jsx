import React, { useState, useEffect, useCallback } from "react";
import Discussion from "../components/Discussion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TrendingSection from "./TrendingSection";
import CreatePostModal from "../components/CreatePostModal";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Loader2, RefreshCw, Plus, ChevronDown } from "lucide-react";
import { formatApiError } from "../lib/format";

const Home = () => {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sort, setSort] = useState("latest");
  const [postTypeFilter, setPostTypeFilter] = useState("");

  const fetchPosts = useCallback(
    async (cursor = null, replace = true) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const params = { limit: 20, sort };
        if (cursor) params.cursor = cursor;
        if (postTypeFilter) params.post_type = postTypeFilter;
        const res = await api.get("/feed", { params });
        const items = res.data?.items || [];
        const next = res.data?.next_cursor || null;
        if (replace) {
          setPosts(items);
        } else {
          setPosts((prev) => [...prev, ...items]);
        }
        setNextCursor(next);
      } catch (err) {
        setError(formatApiError(err, "Failed to load posts."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, postTypeFilter]
  );

  useEffect(() => {
    fetchPosts(null, true);
  }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchPosts(nextCursor, false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />

        <main className="flex-1 px-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3 ml-16 md:ml-125 mt-4 mb-2 flex-wrap">
            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="top">Top</option>
              <option value="oldest">Oldest</option>
            </select>

            {/* Type filter */}
            <select
              value={postTypeFilter}
              onChange={(e) => setPostTypeFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 cursor-pointer"
            >
              <option value="">All types</option>
              <option value="discussion">Discussion</option>
              <option value="announcement">Announcement</option>
              <option value="complaint">Complaint</option>
              <option value="lost_found">Lost & Found</option>
              <option value="notes">Notes</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => fetchPosts(null, true)}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>

            {/* Create post button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 ml-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              <Plus size={14} /> New Post
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <span className="text-sm text-gray-400">Loading posts…</span>
            </div>
          ) : error ? (
            <div className="ml-16 md:ml-125 mt-6 text-center">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={() => fetchPosts(null, true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="ml-16 md:ml-125 mt-10 text-center">
              <p className="text-gray-400 text-sm">No posts yet. Be the first to share something!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 flex items-center gap-1.5 mx-auto bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Plus size={16} /> Create first post
              </button>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Discussion
                  key={post.id}
                  post={post}
                  onDeleted={handlePostDeleted}
                />
              ))}

              {/* Load more */}
              {nextCursor && (
                <div className="flex justify-center ml-16 md:ml-125 my-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-sm font-medium text-gray-600 hover:text-orange-600 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <aside className="w-80 mr-4 hidden lg:block">
          <div className="sticky top-20">
            <TrendingSection />
          </div>
        </aside>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
          defaultPostType="discussion"
        />
      )}
    </div>
  );
};

export default Home;
