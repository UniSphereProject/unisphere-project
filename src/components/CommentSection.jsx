import { useState, useEffect, useCallback } from "react";
import CommentNode from "./CommentNode";
import { useAuth } from "../context/AuthContext";
import { Send, Loader2 } from "lucide-react";
import API from "../utils/api";

// Helper to decode token and get username
const getUsernameFromToken = (token) => {
  if (!token) return "Student";
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.name || payload.username || payload.email || "You";
    }
  } catch (e) {
    console.error("Token decoding error:", e);
  }
  return "You";
};

/**
 * Map a backend comment object to the shape expected by CommentNode.
 * Backend: { id, content, is_anonymous, author: { id, name, profile_image_url } | null,
 *            parent_id, reaction_summary: { likes, dislikes, user_reaction }, replies[], created_at }
 * CommentNode expects: { id, author, content, timestamp, votes, replies[], avatarColor? }
 */
const mapComment = (c) => ({
  id: c.id,
  author: c.is_anonymous ? "Anonymous" : c.author?.name || "Unknown",
  avatarColor: "", // Let CommentNode generate dynamically
  content: c.content,
  timestamp: timeAgo(c.created_at),
  votes: c.reaction_summary
    ? c.reaction_summary.likes - c.reaction_summary.dislikes
    : 0,
  userReaction: c.reaction_summary?.user_reaction || null,
  likes: c.reaction_summary?.likes || 0,
  dislikes: c.reaction_summary?.dislikes || 0,
  replies: (c.replies || []).map(mapReply),
});

const mapReply = (r) => ({
  id: r.id,
  author: r.is_anonymous ? "Anonymous" : r.author?.name || "Unknown",
  avatarColor: "",
  content: r.content,
  timestamp: timeAgo(r.created_at),
  votes: r.reaction_summary
    ? r.reaction_summary.likes - r.reaction_summary.dislikes
    : 0,
  userReaction: r.reaction_summary?.user_reaction || null,
  likes: r.reaction_summary?.likes || 0,
  dislikes: r.reaction_summary?.dislikes || 0,
  replies: (r.replies || []).map(mapReply),
});

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
  return `${diffDays}d ago`;
};

const countTotalComments = (list) => {
  let count = list.length;
  for (let c of list) {
    if (c.replies && c.replies.length > 0) {
      count += countTotalComments(c.replies);
    }
  }
  return count;
};

const CommentSection = ({ postId, onCommentCountChange }) => {
  const { token } = useAuth();
  const currentUser = getUsernameFromToken(token);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch comments from API ────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setFetching(true);
    try {
      const res = await API.get(`/posts/${postId}/comments`, { params: { limit: 50 } });
      const mapped = (res.data.items || []).map(mapComment);
      setComments(mapped);
      if (onCommentCountChange) {
        onCommentCountChange(countTotalComments(mapped));
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setFetching(false);
    }
  }, [postId, onCommentCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Add root comment via API ────────────────────────────────────────
  const handleAddRootComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await API.post(`/posts/${postId}/comments`, {
        content: newCommentText.trim(),
        parent_id: null,
      });
      setNewCommentText("");
      await fetchComments(); // Refresh from server
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add reply via API ────────────────────────────────────────────────
  const handleAddReply = async (parentId, content) => {
    try {
      await API.post(`/posts/${postId}/comments`, {
        content,
        parent_id: parentId,
      });
      await fetchComments(); // Refresh from server
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  // ── React to comment via API ──────────────────────────────────────────
  const handleVote = async (commentId, reaction) => {
    try {
      await API.post(`/comments/${commentId}/react`, { reaction });
      await fetchComments(); // Refresh reaction counts
    } catch (err) {
      console.error("Failed to react to comment:", err);
    }
  };

  // ── Delete comment via API ────────────────────────────────────────────
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await API.delete(`/comments/${commentId}`);
      await fetchComments(); // Refresh
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-fadeIn">
      <h3 className="text-sm font-semibold text-gray-900 px-1">
        Comments ({comments.length})
      </h3>

      {/* Root Comment Form */}
      <form onSubmit={handleAddRootComment} className="flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          disabled={submitting}
          className="flex-1 text-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white placeholder:text-gray-400 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newCommentText.trim() || submitting}
          className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>

      {/* Comments List */}
      <div className="flex flex-col max-h-[500px] overflow-y-auto pr-1 select-text scrollbar-thin">
        {fetching ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No comments yet. Be the first to start the discussion!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onAddReply={handleAddReply}
              onVote={handleVote}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
