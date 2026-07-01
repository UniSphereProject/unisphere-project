import  { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Shield, Loader2, Trash2, CheckCircle2, ImageOff } from "lucide-react";
import CommentSection from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { timeAgo, getCurrentUserId } from "../lib/format";
import api from "../lib/api";

// Compute the next reaction state locally — no API round-trip needed to show the result.
// The backend uses the same toggle logic, so this will match 100% of the time.
const computeOptimistic = (current, reaction) => {
  const prev = current.user_reaction;
  if (prev === reaction) {
    // clicking the same button again → toggle it off
    return {
      likes:    reaction === "like"    ? current.likes    - 1 : current.likes,
      dislikes: reaction === "dislike" ? current.dislikes - 1 : current.dislikes,
      user_reaction: null,
    };
  } else if (prev === null) {
    // fresh vote
    return {
      likes:    reaction === "like"    ? current.likes    + 1 : current.likes,
      dislikes: reaction === "dislike" ? current.dislikes + 1 : current.dislikes,
      user_reaction: reaction,
    };
  } else {
    // switching from like → dislike or vice versa
    return {
      likes:    reaction === "like"    ? current.likes + 1    : current.likes    - 1,
      dislikes: reaction === "dislike" ? current.dislikes + 1 : current.dislikes - 1,
      user_reaction: reaction,
    };
  }
};

const Discussion = ({ post, onDeleted }) => {
  const { token } = useAuth();
  const currentUserId = getCurrentUserId(token);

  const [reactionSummary, setReactionSummary] = useState(
    post.reaction_summary || { likes: 0, dislikes: 0, user_reaction: null }
  );
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isMyPost =
    !post.is_anonymous &&
    post.author?.id != null &&
    currentUserId != null &&
    String(post.author.id) === String(currentUserId);

  const handleVote = async (reaction) => {
    if (voting) return;

    // ── 1. Snapshot for rollback ──────────────────────────
    const previous = reactionSummary;

    // ── 2. Update UI immediately (feels instant) ──────────
    setReactionSummary(computeOptimistic(reactionSummary, reaction));
    setVoting(true);

    try {
      // ── 3. Fire the real API call in the background ──────
      const res = await api.post(`/posts/${post.id}/react`, { reaction });
      // Sync with authoritative server counts in case anything drifted
      setReactionSummary({
        likes:         res.data.likes         ?? reactionSummary.likes,
        dislikes:      res.data.dislikes      ?? reactionSummary.dislikes,
        user_reaction: res.data.user_reaction !== undefined
          ? res.data.user_reaction
          : computeOptimistic(previous, reaction).user_reaction,
      });
    } catch (err) {
      // ── 4. Revert to previous state on network error ──────
      setReactionSummary(previous);
      console.error("Vote failed:", err);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      if (onDeleted) onDeleted(post.id);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const authorName = post.is_anonymous
    ? "Anonymous"
    : post.author?.name || "Unknown";

  const communityLabel = post.community?.name;

  return (
    <div className="p-4 border border-gray-200 rounded-xl shadow-lg bg-white m-4 hover:shadow-md transition mx-auto w-full max-w-xl border-l-4 border-orange-600 ml-16 md:ml-125">
      {/* Top meta */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-orange-600 font-medium">{authorName}</p>
          {communityLabel && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {communityLabel}
            </span>
          )}
          {post.is_teacher_verified && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 size={11} /> Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          {isMyPost && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
              title="Delete post"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-xl font-bold text-gray-900 mb-3">{post.title}</p>

      {/* Body */}
      {post.body && (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{post.body}</p>
      )}

      {/* Image — show broken-state placeholder instead of silently hiding */}
      {post.image_url && !imgError && (
        <img
          className="w-full h-auto object-cover rounded-lg mb-3"
          alt="post"
          src={post.image_url}
          onError={() => setImgError(true)}
        />
      )}
      {post.image_url && imgError && (
        <a
          href={post.image_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2 mb-3 hover:text-orange-500 hover:border-orange-300 transition"
        >
          <ImageOff size={14} />
          <span className="truncate">Image could not load — click to open URL</span>
        </a>
      )}

      {/* File attachment */}
      {post.file_url && (
        <a
          href={post.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg mb-3 transition"
        >
          <Shield size={12} /> {post.file_name || "Download attachment"}
        </a>
      )}

      {/* Reactions + comments */}
      <div className="flex items-center gap-4 text-gray-600 border-b border-gray-50 pb-2">
        <button
          disabled={voting}
          className={`flex items-center gap-1 hover:text-green-600 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 disabled:opacity-50 ${
            reactionSummary.user_reaction === "like" ? "text-green-600 font-semibold" : ""
          }`}
          onClick={() => handleVote("like")}
        >
          <ThumbsUp size={18} />
          <span>{reactionSummary.likes}</span>
        </button>

        <button
          disabled={voting}
          className={`flex items-center gap-1 hover:text-red-500 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 disabled:opacity-50 ${
            reactionSummary.user_reaction === "dislike" ? "text-red-500 font-semibold" : ""
          }`}
          onClick={() => handleVote("dislike")}
        >
          <ThumbsDown size={18} />
          <span>{reactionSummary.dislikes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 transition hover:cursor-pointer p-1 rounded-md ${
            showComments ? "text-orange-500 bg-orange-50" : "hover:text-orange-500 hover:bg-gray-50"
          }`}
        >
          <MessageCircle size={19} />
          <span className="text-sm font-medium">{commentCount}</span>
        </button>
      </div>

      {/* Comment Section Panel */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentCountChange={setCommentCount}
        />
      )}
    </div>
  );
};

export default Discussion;
