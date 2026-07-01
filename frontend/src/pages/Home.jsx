import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Discussion from "../components/Discussion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TrendingPanel from "../components/TrendingPanel";
import CreatePostModal from "../components/CreatePostModal";
import { resolveCommunitySlug } from "../utils/communities";
import API from "../utils/api";

const Home = () => {
  // ── Search highlight state ──────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightPostId = searchParams.get("post");
  const highlightRef = useRef(null);

  // ── Feed state ──────────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Community filter ────────────────────────────────────────────────
  // Initialize from the `community` query param so links from other
  // pages (e.g. the Sidebar on /notes or /projects, or the mobile nav
  // drawer) can deep-link straight into a filtered feed.
  const [activeCommunitySlug, setActiveCommunitySlug] = useState(
    () => searchParams.get("community") || null
  );

  // ── Create post modal ────────────────────────────────────────────────
  // Auto-open if navigated here with `?create=1` (used by the mobile
  // nav drawer's Create Post button).
  const [showCreateModal, setShowCreateModal] = useState(
    () => searchParams.get("create") === "1"
  );

  // ── Keep activeCommunitySlug in sync if the `community` query param
  // changes while already on this page (e.g. clicking another sidebar
  // item, or a fresh navigation from /notes -> /home?community=...) ──
  useEffect(() => {
    const slugFromUrl = searchParams.get("community");
    if (slugFromUrl !== activeCommunitySlug) {
      setActiveCommunitySlug(slugFromUrl || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Open the Create Post modal if `?create=1` shows up later too
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // ── Fetch feed ────────────────────────────────────────────────────────
  const fetchFeed = useCallback(
    async (cursor = null) => {
      const isInitial = cursor === null;
      if (isInitial) {
        setLoading(true);
        setPosts([]);
        setNextCursor(null);
      } else {
        setLoadingMore(true);
      }

      try {
        // Resolve slug to community_id if a community is selected
        let communityId = null;
        if (activeCommunitySlug) {
          communityId = await resolveCommunitySlug(activeCommunitySlug);
        }

        const params = { limit: 20, sort: "latest" };
        if (cursor) params.cursor = cursor;
        if (communityId) params.community_id = communityId;

        const res = await API.get("/feed", { params });

        if (isInitial) {
          setPosts(res.data.items || []);
        } else {
          setPosts((prev) => [...prev, ...(res.data.items || [])]);
        }
        setNextCursor(res.data.next_cursor || null);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCommunitySlug]
  );

  // Initial load + reload on filter change
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ── Scroll to highlighted post from search ──────────────────────────
  useEffect(() => {
    if (highlightPostId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [posts, highlightPostId]);

  // ── Load more ─────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchFeed(nextCursor);
    }
  };

  // ── Community selection from sidebar ──────────────────────────────────
  const handleCommunitySelect = (slug) => {
    setActiveCommunitySlug((prev) => {
      const next = prev === slug ? null : slug;
      const params = new URLSearchParams(searchParams);
      if (next) {
        params.set("community", next);
      } else {
        params.delete("community");
      }
      setSearchParams(params, { replace: true });
      return next;
    });
  };

  // ── Refresh after creating a post ──────────────────────────────────────
  const handlePostCreated = () => {
    fetchFeed();
  };

  return (
    <>
      <div className="bg-slate-100 min-h-screen m-0 py-2">
        <Navbar />
        <div className="flex">
          {/* Left Sidebar */}
          <Sidebar
            activeCommunityId={activeCommunitySlug}
            onCommunitySelect={handleCommunitySelect}
            onCreatePost={() => setShowCreateModal(true)}
          />

	          {/* Main Feed */}
	          <div className="mt-16 flex-1 px-2 sm:px-4 py-4 ml-0 md:ml-64 min-w-0">
            {/* Active filter indicator */}
            {activeCommunitySlug && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-gray-500">Filtered by:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {activeCommunitySlug.replace(/-/g, " ")}
                </span>
                <button
                  onClick={() => {
                    setActiveCommunitySlug(null);
                    const params = new URLSearchParams(searchParams);
                    params.delete("community");
                    setSearchParams(params, { replace: true });
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                <span className="mt-3 text-sm text-gray-400">Loading posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-500 text-lg font-medium">No posts yet</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to start a discussion!</p>
              </div>
            ) : (
              <>
                {posts.map((post) => {
                  const isHighlighted = highlightPostId && String(post.id) === String(highlightPostId);
                  return (
                    <div
                      key={post.id}
                      ref={isHighlighted ? highlightRef : undefined}
                      className={`transition-all duration-500 ${isHighlighted ? "ring-2 ring-orange-400 rounded-xl scale-[1.01]" : ""}`}
                      style={isHighlighted ? { animation: "pulseHighlight 2s ease-out" } : undefined}
                    >
                      <Discussion post={post} />
                    </div>
                  );
                })}

                {/* Load More button */}
                {nextCursor && (
                  <div className="flex justify-center my-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-sm hover:shadow"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}

                {/* End of feed indicator */}
                {!nextCursor && posts.length > 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">
                    You&apos;ve reached the end of the feed
                  </p>
                )}
              </>
            )}
          </div>

	          {/* Right Trending Panel — hidden on small screens */}
	          <div className="mt-16 w-96 hidden lg:block pr-6 py-4 shrink-0">
	            <div className="sticky top-20">
	              <TrendingPanel />
	            </div>
	          </div>
        </div>

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            if (searchParams.get("create")) {
              const params = new URLSearchParams(searchParams);
              params.delete("create");
              setSearchParams(params, { replace: true });
            }
          }}
          onPostCreated={handlePostCreated}
          defaultCommunitySlug={activeCommunitySlug}
        />
      </div>
    </>
  );
};

export default Home;
