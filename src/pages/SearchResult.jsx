import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Loader2, SearchX, SearchIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Discussion from "../components/Discussion";
import api from "../utils/api";


const SearchResult = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (query) => {
    if (!query) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/search", { params: { q: query, limit: 50 } });
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(formatApiError(err, "Failed to search posts."));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(q);
  }, [q, runSearch]);

  const handlePostDeleted = (postId) => {
    setResults((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />

        <div className="flex-1 min-w-0 ml-16 md:ml-64 px-4 sm:px-6 pt-6 pb-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 max-w-2xl mx-auto">
            <SearchIcon size={20} className="text-orange-500 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              {q ? (
                <>
                  Results for <span className="text-orange-600">"{q}"</span>
                </>
              ) : (
                "Search"
              )}
            </h1>
          </div>

          {/* No query entered */}
          {!q && (
            <div className="text-center py-20 max-w-2xl mx-auto">
              <SearchIcon size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Type something in the search bar to find posts.
              </p>
            </div>
          )}

          {/* Loading */}
          {q && loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
              <span className="text-sm text-gray-400">Searching…</span>
            </div>
          )}

          {/* Error */}
          {q && !loading && error && (
            <div className="text-center py-10 max-w-2xl mx-auto">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button
                onClick={() => runSearch(q)}
                className="text-orange-500 hover:text-orange-600 text-sm font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty results */}
          {q && !loading && !error && results.length === 0 && (
            <div className="text-center py-20 max-w-2xl mx-auto">
              <SearchX size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No posts found for <span className="font-medium text-gray-500">"{q}"</span>.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Try a different keyword or check your spelling.
              </p>
            </div>
          )}

          {/* Results */}
          {q && !loading && !error && results.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-gray-400 mb-2">
                {results.length} {results.length === 1 ? "result" : "results"} found
              </p>
              {results.map((post) => (
                <Discussion key={post.id} post={post} onDeleted={handlePostDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResult;
