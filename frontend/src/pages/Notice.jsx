import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Information from "../components/Information";
import api from "../lib/api";
import { formatApiError, timeAgo } from "../lib/format";
import { Loader2, RefreshCw, ChevronDown, Megaphone } from "lucide-react";

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotices = useCallback(async (cursor = null, replace = true) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const params = { limit: 20, post_type: "announcement" };
      if (cursor) params.cursor = cursor;
      const res = await api.get("/feed", { params });
      const items = res.data?.items || [];
      const next = res.data?.next_cursor || null;
      if (replace) setNotices(items);
      else setNotices((prev) => [...prev, ...items]);
      setNextCursor(next);
    } catch (err) {
      setError(formatApiError(err, "Failed to load notices."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices(null, true);
  }, [fetchNotices]);

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />

        <div className="flex-1 ml-16 md:ml-64 px-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone size={22} className="text-orange-500" />
              <h1 className="text-xl font-bold text-gray-900">Notices & Announcements</h1>
            </div>
            <button
              onClick={() => fetchNotices(null, true)}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <span className="text-sm text-gray-400">Loading notices…</span>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={() => fetchNotices(null, true)}
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No announcements yet.</p>
            </div>
          ) : (
            <>
              {notices.map((notice) => (
                <Information
                  key={notice.id}
                  title={notice.title}
                  info={notice.body || ""}
                  date={timeAgo(notice.created_at)}
                  author={
                    notice.is_anonymous
                      ? "Anonymous"
                      : notice.author?.name || "Unknown"
                  }
                />
              ))}

              {nextCursor && (
                <div className="flex justify-center my-8">
                  <button
                    onClick={() => !loadingMore && fetchNotices(nextCursor, false)}
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
    </div>
  );
};

export default Notice;
