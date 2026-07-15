import { useState, useCallback, useRef } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Clock,
  ShieldCheck,
  ShieldOff,
  Download,
  Loader2,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import CommentSection from "./CommentSection";
import NoteViewerModal from "./NoteViewerModal";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserFromToken, ROLES } from "../utils/auth";
import { setNoteVerified } from "../utils/roleApi";

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

const Discussion = ({ post, onDeleted }) => {
  // ── Local reaction state (optimistic) ────────────────────────────────
  const rs = post.reaction_summary || {
    likes: 0,
    dislikes: 0,
    user_reaction: null,
  };
  const [likes, setLikes] = useState(rs.likes);
  const [dislikes, setDislikes] = useState(rs.dislikes);
  const [userVote, setUserVote] = useState(rs.user_reaction);
  const [imgError, setImgError] = useState(false);
  const [refreshedUrl, setRefreshedUrl] = useState(null);

  // Keep a ref of the current state to read latest values synchronously under rapid clicks
  const stateRef = useRef({ likes, dislikes, userVote });
  stateRef.current = { likes, dislikes, userVote };

  // ── Download (notes) ────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  // ── Comments ───────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

  // ── Note verification (teacher/moderator) ───────────────────────────
  const { token } = useAuth();
  const user = getUserFromToken(token);
  const role = user?.role;
  const canVerify = role === ROLES.TEACHER || role === ROLES.MODERATOR || role === ROLES.ADMIN;
  const [isVerified, setIsVerified] = useState(!!post.is_teacher_verified);
  const [verifying, setVerifying] = useState(false);

  // ── Delete post (owner, or moderator/admin acting on anyone's post) ──
  const isModerator = role === ROLES.MODERATOR || role === ROLES.ADMIN;
  const isOwner = !!user?.userId && post.author?.id === user.userId;
  const canDelete = isOwner || isModerator;
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const handleDeletePost = async () => {
    if (deleting || !post.id) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await API.delete(`/posts/${post.id}`);
      toast.success("Post deleted.");
      setIsRemoved(true);
      onDeleted?.(post.id);
    } catch (err) {
      console.error("Delete post failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(detail || "Unable to delete this post.");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleToggleVerify = async () => {
    if (verifying || !post.id) return;
    const nextValue = !isVerified;
    setVerifying(true);
    try {
      await setNoteVerified(post.id, nextValue);
      setIsVerified(nextValue);
      toast.success(nextValue ? "Note marked as verified" : "Verification removed");
    } catch (err) {
      console.error("Verify toggle failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(detail || "Unable to update verification status.");
    } finally {
      setVerifying(false);
    }
  };

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

  // ── View file inline (in-app modal) instead of opening a new tab,
  // which forces a download for non-PDF file types ───────────────────
  const handleView = async () => {
    if (viewing || !post.id) return;
    setViewing(true);
    try {
      const res = await API.get(`/posts/${post.id}/view-url?type=file`);
      const url = res.data?.url;
      if (!url) {
        toast.error("File not available");
        return;
      }
      setViewerUrl(url);
      setViewerOpen(true);
    } catch (err) {
      console.error("View failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(detail || "Unable to open file. Please try again.");
    } finally {
      setViewing(false);
    }
  };

  // ── React handler ────────────────────────────────────────────────────
  const handleReact = useCallback(
    async (reaction) => {
      const { likes: currentLikes, dislikes: currentDislikes, userVote: currentVote } = stateRef.current;

      let nextLikes = currentLikes;
      let nextDislikes = currentDislikes;
      let nextVote = currentVote;

      if (reaction === "like") {
        if (currentVote === "like") {
          nextLikes = currentLikes - 1;
          nextVote = null;
        } else {
          if (currentVote === "dislike") nextDislikes = currentDislikes - 1;
          nextLikes = currentLikes + 1;
          nextVote = "like";
        }
      } else {
        if (currentVote === "dislike") {
          nextDislikes = currentDislikes - 1;
          nextVote = null;
        } else {
          if (currentVote === "like") nextLikes = currentLikes - 1;
          nextDislikes = currentDislikes + 1;
          nextVote = "dislike";
        }
      }

      // Update state instantly on frontend
      setLikes(nextLikes);
      setDislikes(nextDislikes);
      setUserVote(nextVote);

      try {
        await API.post(`/posts/${post.id}/react`, { reaction });
      } catch (err) {
        // Rollback only if the user hasn't toggled again since this request was started
        setLikes((current) => (current === nextLikes ? currentLikes : current));
        setDislikes((current) => (current === nextDislikes ? currentDislikes : current));
        setUserVote((current) => (current === nextVote ? currentVote : current));
        console.error("Failed to sync reaction to backend:", err);
      }
    },
    [post.id]
  );

  const authorName = post.is_anonymous
    ? "Anonymous"
    : post.author?.name || "Unknown User";

  if (isRemoved) return null;

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
        {isVerified && (
          <ShieldCheck
            size={16}
            className="text-green-600"
            title="Verified by a teacher/moderator"
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
        <div className="w-full max-h-96 overflow-hidden rounded-lg mb-3 bg-gray-50 flex items-center justify-center">
          <img
            className="max-w-full max-h-96 object-contain"
            alt="discussion"
            src={refreshedUrl || post.image_url}
            onError={handleImageError}
          />
        </div>
      )}

      {/* File download (notes type) */}
      {post.post_type === "notes" && (post.file_url || post.file_name) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-800 truncate">
                {post.file_name || "Attached File"}
              </p>
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 border border-green-200 text-green-700 text-[11px] font-medium shrink-0">
                  <ShieldCheck size={12} />
                  Verified
                </span>
              )}
            </div>
            {post.file_size && (
              <p className="text-xs text-gray-400">
                {(post.file_size / 1024 / 1024).toFixed(1)} MB
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={handleView}
              disabled={viewing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition active:scale-95"
            >
              {viewing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Eye size={14} />
              )}
              <span>{viewing ? "Loading..." : "View"}</span>
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
            {canVerify && (
              <button
                onClick={handleToggleVerify}
                disabled={verifying}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition active:scale-95 ${
                  isVerified
                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                }`}
              >
                {verifying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isVerified ? (
                  <ShieldOff size={14} />
                ) : (
                  <ShieldCheck size={14} />
                )}
                <span>{verifying ? "Updating..." : isVerified ? "Unverify" : "Verify"}</span>
              </button>
            )}
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
        >
          <ThumbsUp size={18} />
          <span>{likes}</span>
        </button>

        <button
          className={`flex items-center gap-1 hover:text-red-500 transition cursor-pointer p-2 rounded-md hover:bg-gray-50 touch-manipulation ${
            userVote === "dislike" ? "text-red-500 font-semibold" : ""
          }`}
          onClick={() => handleReact("dislike")}
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

        {canDelete && (
          <div className="ml-auto flex items-center gap-2">
            {confirmingDelete && (
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 cursor-pointer px-2 py-1"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              title={isOwner ? "Delete your post" : "Delete post (moderator)"}
              className={`flex items-center gap-1.5 p-2 rounded-md text-xs font-semibold cursor-pointer transition touch-manipulation disabled:opacity-50 ${
                confirmingDelete
                  ? "bg-red-50 text-red-600 border border-red-200 px-3"
                  : "text-gray-400 hover:text-red-500 hover:bg-gray-50"
              }`}
            >
              {deleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {confirmingDelete && <span>{deleting ? "Deleting..." : "Confirm delete"}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Comment Section Panel */}
      {showComments && (
        <CommentSection postId={post.id} onCommentCountChange={setCommentCount} />
      )}

      <NoteViewerModal
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        url={viewerUrl}
        fileName={post.file_name}
        fileType={post.file_type}
        title={post.title}
      />
    </div>
  );
};

export default Discussion;
