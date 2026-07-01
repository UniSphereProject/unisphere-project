import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Notescard from "../components/Notescard";
import CreatePostModal from "../components/CreatePostModal";
import api from "../lib/api";
import { formatApiError } from "../lib/format";
import { Loader2, Plus, RefreshCw, ChevronDown } from "lucide-react";

const Notes = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchNotes = useCallback(async (cursor = null, replace = true) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const params = { limit: 20, post_type: "notes" };
      if (cursor) params.cursor = cursor;
      const res = await api.get("/feed", { params });
      const items = res.data?.items || [];
      const next = res.data?.next_cursor || null;
      if (replace) setPosts(items);
      else setPosts((prev) => [...prev, ...items]);
      setNextCursor(next);
    } catch (err) {
      setError(formatApiError(err, "Failed to load notes."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes(null, true);
  }, [fetchNotes]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-16 flex">
        <Sidebar />

        <div className="flex-1 ml-16 md:ml-64 px-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Notes</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchNotes(null, true)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Plus size={14} /> Share Notes
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <span className="text-sm text-gray-400">Loading notes…</span>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={() => fetchNotes(null, true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm mb-3">No notes shared yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 mx-auto bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Plus size={16} /> Share first note
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                {posts.map((post) => (
                  <Notescard
                    key={post.id}
                    title={post.title}
                    poster={
                      post.is_anonymous
                        ? "Anonymous"
                        : post.author?.name || "Unknown"
                    }
                    batch={post.community?.name || ""}
                    date={new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    thumbnail={post.image_url || undefined}
                    fileUrl={post.file_url || undefined}
                  />
                ))}
              </div>

              {nextCursor && (
                <div className="flex justify-center my-8">
                  <button
                    onClick={() => !loadingMore && fetchNotes(nextCursor, false)}
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
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePostCreated}
          defaultPostType="notes"
        />
      )}
    </>
  );
};

export default Notes;
