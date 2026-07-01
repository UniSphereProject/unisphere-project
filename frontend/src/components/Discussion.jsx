import { useState, useCallback } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Clock,
  ShieldCheck,
  Download,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import CommentSection from "./CommentSection";
import API from "../utils/api";

/**
 * Discussion — renders a single post card.
 *
 * Props:
 *   post (object) — the enriched post object from the backend:
 *     { id, title, body, post_type, image_url, created_at,
 *       author: { id, name, profile_image_url, role } | null,
 *       reaction_summary: { likes, dislikes, user_reaction } | null,
 *       comment_count, is_teacher_verified, community, ... }
 */

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

const typeBadgeColor = (type) => {
  const map = {
    discussion: "bg-blue-100 text-blue-700",
    notes: "bg-green-100 text-green-700",
    announcement: "bg-purple-100 text-purple-700",
    lost_found: "bg-amber-100 text-amber-700",
    complaint: "bg-red-100 text-red-700",
    project: "bg-teal-100 text-teal-700",
  };
  return map[type] || "bg-gray-100 text-gray-700";
};

const Discussion = ({ post }) => {
  // ── Local reaction state (optimistic) ────────────────────────────────
  const rs = post.reaction_summary || {
    likes: 0,
    dislikes: 0,
    user_reaction: null,
  };
  const [likes, setLikes] = useState(rs.likes);
  const [dislikes, setDislikes] = useState(rs.dislikes);
  const [userVote, setUserVote] = useState(rs.user_reaction);
  const [reacting, setReacting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [refreshedUrl, setRefreshedUrl] = useState(null);
  // ── Download (notes) ────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);
  // ── Comments ───────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  const handleImageError = async () => {
    if (refreshedUrl || imgError) return;

    try {
      const res = await API.get(`/posts/${post.id}/view-url?type=image`);
      setRefreshedUrl(res.data.url);
    } catch (err) {
      console.error("Failed to refresh image URL:", err);
      setImgError(true);
    }
  };

  // ── Robust file download using fetch + Blob ───────────────────────────
  const handleDownload = async () => {
    if (downloading || !post.id) return;
    setDownloading(true);
    try {
      const res = await API.get(`/posts/${post.id}/view-url?type=file`);
      const url = res.data?.url;
      if (!url) {
        toast.error("Download URL not available. Please try again.");
        return;
      }
      // Fetch the file and trigger a real browser download
      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error("Failed to fetch file");
      const blob = await fileRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      if (post.file_name) link.download = post.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(
        detail ||
          "Download failed. The file may have been removed or is unavailable."
      );
    } finally {
      setDownloading(false);
    }
  };

  // ── View file (Coming Soon) ────────────────────────────────────────────
  const handleView = () => {
    toast.info("🔜 Coming Soon!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // ── React handler ────────────────────────────────────────────────────
  const handleReact = useCallback(
    async (reaction) => {
      if (reacting) return;
      setReacting(true);

      // Optimistic update
      const prevLikes = likes;
      const prevDislikes = dislikes;
      const prevVote = userVote;

      if (reaction === "like") {
        if (userVote === "like") {
          setLikes((l) => l - 1);
          setUserVote(null);
        } else {
          if (userVote === "dislike") setDislikes((d) => d - 1);
          setLikes((l) => l + 1);
          setUserVote("like");
        }
      } else {
        if (userVote === "dislike") {
          setDislikes((d) => d - 1);
          setUserVote(null);
        } else {
          if (userVote === "like") setLikes((l) => l - 1);
          setDislikes((d) => d + 1);
          setUserVote("dislike");
        }
      }

      try {
        await API.post(`/posts/${post.id}/react`, { reaction });
      } catch {
        // Rollback on failure
        setLikes(prevLikes);
        setDislikes(prevDislikes);
        setUserVote(prevVote);
      } finally {
        setReacting(false);
      }
    },
    [post.id, userVote, likes, dislikes, reacting]
  );

  const authorName = post.is_anonymous
    ? "Anonymous"
    : post.author?.name || "Unknown User";

  return (
    <div className="p-3 sm:p-4 border border-gray-200 rounded-xl shadow-lg bg-white m-1 sm:m-2 hover:shadow-md transition mx-auto w-full border-l-4 border-orange-400">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm text-orange-600 font-medium">
          {authorName}
        </span>
        {post.author?.profile_image_url && (
          <img
            src={post.author.profile_image_url}
            alt={authorName}
            className="w-6 h-6 rounded-full object-cover"
          />
        )}
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={12} />
          {timeAgo(post.created_at)}
        </span>
        {post.is_teacher_verified && (
          <ShieldCheck
            size={16}
            className="text-green-600"
            title="Teacher verified"
          />
        )}
      </div>

      {/* Post type badge */}
      {post.post_type && (
        <span
          className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 ${typeBadgeColor(post.post_type)}`}
        >
          {post.post_type?.replace("_", " ")}
        </span>
      )}

      {/* Title */}
      <p className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
        {post.title}
      </p>

      {/* Content */}
      {post.body && (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
          {post.body}
        </p>
      )}

      {/* Image (only if exists) */}
      {post.image_url && (
	        <img
	          className="w-full max-h-80 object-cover rounded-lg mb-3"
	          alt="discussion"
	          src={refreshedUrl || post.image_url}
	          onError={handleImageError}
	        />
      )}

      {/* File download (notes type) */}
      {post.post_type === "notes" && (post.file_url || post.file_name) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {post.file_name || "Attached File"}
            </p>
            {post.file_size && (
              <p className="text-xs text-gray-400">
                {(post.file_size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleView}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition active:scale-95"
            >
              <Eye size={14} />
              <span>View</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition active:scale-95"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>{downloading ? "Fetching..." : "Download"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Community name */}
      {post.community && (
        <span className="text-xs text-gray-400 mb-2 block">
          in {post.community.name}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 border-b border-gray-50 pb-2">
        <button
          className={`flex items-center gap-1 hover:text-green-600 transition cursor-pointer p-2 rounded-md hover:bg-gray-50 touch-manipulation ${
            userVote === "like" ? "text-green-600 font-semibold" : ""
          }`}
          onClick={() => handleReact("like")}
          disabled={reacting}
        >
          <ThumbsUp size={18} />
          <span>{likes}</span>
        </button>

        <button
          className={`flex items-center gap-1 hover:text-red-500 transition cursor-pointer p-2 rounded-md hover:bg-gray-50 touch-manipulation ${
            userVote === "dislike" ? "text-red-500 font-semibold" : ""
          }`}
          onClick={() => handleReact("dislike")}
          disabled={reacting}
        >
          <ThumbsDown size={18} />
          <span>{dislikes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 transition cursor-pointer p-2 rounded-md touch-manipulation ${
            showComments
              ? "text-orange-500 bg-orange-50"
              : "hover:text-orange-500 hover:bg-gray-50"
          }`}
        >
          <MessageCircle size={19} />
          <span className="text-sm font-medium">{commentCount}</span>
        </button>
      </div>

      {/* Comment Section Panel */}
      {showComments && (
        <CommentSection postId={post.id} onCommentCountChange={setCommentCount} />
      )}
    </div>
  );
};

export default Discussion;
