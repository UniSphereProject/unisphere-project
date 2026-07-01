import React, { useState, useEffect, useCallback } from "react";
import CommentNode from "./CommentNode";
import { useAuth } from "../context/AuthContext";
import { Send, Loader2, RefreshCw } from "lucide-react";
import api from "../lib/api";
import { getCurrentUserId, formatApiError } from "../lib/format";

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
  const currentUserId = getCurrentUserId(token);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/posts/${postId}/comments`, {
        params: { limit: 50 },
      });
      const items = res.data?.items || [];
      setComments(items);
      if (onCommentCountChange) {
        onCommentCountChange(res.data?.total_count ?? countTotalComments(items));
      }
    } catch (err) {
      setError(formatApiError(err, "Failed to load comments."));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handler to add a top-level comment
  const handleAddRootComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        content: newCommentText.trim(),
        is_anonymous: isAnonymous,
      });
      const newComment = { ...res.data, replies: res.data.replies || [] };
      setComments((prev) => [newComment, ...prev]);
      setNewCommentText("");
      setIsAnonymous(false);
      if (onCommentCountChange) {
        onCommentCountChange((c) => c + 1);
      }
    } catch (err) {
      setError(formatApiError(err, "Failed to post comment."));
    } finally {
      setSubmitting(false);
    }
  };

  // Handler to add a reply — hits API then patches local state
  const handleAddReply = async (parentId, content, anonymous) => {
    const res = await api.post(`/posts/${postId}/comments`, {
      content,
      is_anonymous: anonymous,
      parent_id: parentId,
    });
    const newReply = { ...res.data, replies: res.data.replies || [] };

    // Splice the new reply into the correct slot in the tree
    setComments((prev) => addReplyInTree(prev, parentId, newReply));
    if (onCommentCountChange) {
      onCommentCountChange((c) => c + 1);
    }
  };

  const addReplyInTree = (list, parentId, reply) =>
    list.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      if (c.replies?.length) {
        return { ...c, replies: addReplyInTree(c.replies, parentId, reply) };
      }
      return c;
    });

  // Handler for voting on a comment
  const handleVote = async (commentId, reaction) => {
    try {
      await api.post(`/comments/${commentId}/react`, { reaction });
      // Optimistic update: refetch just so counts stay in sync
      // (the backend does a toggle, so we re-fetch to be safe)
      await fetchComments();
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  // Handler to soft-delete a comment
  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      // Mark as [deleted] locally without a full refetch
      setComments((prev) => markDeleted(prev, commentId));
    } catch (err) {
      setError(formatApiError(err, "Failed to delete comment."));
    }
  };

  const markDeleted = (list, id) =>
    list.map((c) => {
      const updated = c.id === id ? { ...c, content: "[deleted]" } : c;
      if (updated.replies?.length) {
        return { ...updated, replies: markDeleted(updated.replies, id) };
      }
      return updated;
    });

  const totalCount = countTotalComments(comments);

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 px-1">
          Comments ({totalCount})
        </h3>
        <button
          onClick={fetchComments}
          title="Refresh comments"
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-orange-500 transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Root Comment Form */}
      <form onSubmit={handleAddRootComment} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white placeholder:text-gray-400 transition"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || submitting}
            className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none pl-2">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
          />
          Post anonymously
        </label>
      </form>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Comments List */}
      <div className="flex flex-col max-h-[500px] overflow-y-auto pr-1 select-text scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
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
              currentUserId={currentUserId}
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
