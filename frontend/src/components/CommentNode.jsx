import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { timeAgo } from "../lib/format";

// Helper to generate consistent avatar colors based on name
const getAvatarColor = (name) => {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const CommentNode = ({
  comment,
  depth = 0,
  currentUserId,
  onAddReply,
  onVote,
  onDelete,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState(false ? "" : "");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authorName = comment.is_anonymous
    ? "Anonymous"
    : comment.author?.name || "Unknown";

  const isDeleted = comment.content === "[deleted]";

  const isMyComment =
    !comment.is_anonymous &&
    comment.author?.id != null &&
    currentUserId != null &&
    String(comment.author.id) === String(currentUserId);

  const userVote = comment.reaction_summary?.user_reaction || null;
  const likes = comment.reaction_summary?.likes || 0;
  const dislikes = comment.reaction_summary?.dislikes || 0;

  const handleVote = async (type) => {
    if (voting || isDeleted) return;
    setVoting(true);
    try {
      await onVote(comment.id, type);
    } finally {
      setVoting(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      await onAddReply(comment.id, replyContent.trim(), replyAnonymous);
      setReplyContent("");
      setReplyAnonymous(false);
      setShowReplyInput(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  const initials = authorName
    ? authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="mt-4 flex flex-col">
      {/* Comment Main Container */}
      <div className="flex gap-3">
        {/* Left Side: Avatar and collapse line indicator */}
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold select-none cursor-pointer ${getAvatarColor(
              authorName
            )} hover:scale-105 transition-transform`}
            title={isCollapsed ? "Expand thread" : "Collapse thread"}
          >
            {isCollapsed ? "+" : initials}
          </button>

          {/* Thread connector line */}
          {!isCollapsed && comment.replies && comment.replies.length > 0 && (
            <div
              onClick={() => setIsCollapsed(true)}
              className="w-0.5 grow bg-gray-200 hover:bg-orange-400 cursor-pointer my-1 transition-colors rounded-full"
              title="Collapse thread"
            />
          )}
        </div>

        {/* Right Side: Header, body, actions, and nested replies */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">
              {authorName}
            </span>
            {isMyComment && (
              <span className="px-1.5 py-0.2 bg-orange-100 text-orange-600 rounded text-xs font-medium border border-orange-200">
                You
              </span>
            )}
            <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="flex items-center gap-1 text-xs text-orange-500 font-medium hover:underline ml-2 cursor-pointer"
              >
                <ChevronRight size={14} />
                Show ({comment.replies?.length || 0} replies)
              </button>
            )}
          </div>

          {/* Comment Body */}
          {!isCollapsed && (
            <div className="mt-1">
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDeleted ? "italic text-gray-400" : "text-gray-700"}`}>
                {comment.content}
              </p>

              {/* Actions Footer */}
              {!isDeleted && (
                <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs select-none">
                  {/* Upvote */}
                  <button
                    onClick={() => handleVote("like")}
                    disabled={voting}
                    className={`flex items-center gap-1 hover:text-green-600 cursor-pointer transition-colors p-1 rounded hover:bg-gray-50 disabled:opacity-50 ${
                      userVote === "like" ? "text-green-600 font-bold" : ""
                    }`}
                  >
                    <ThumbsUp size={13} />
                    <span>{likes}</span>
                  </button>

                  {/* Downvote */}
                  <button
                    onClick={() => handleVote("dislike")}
                    disabled={voting}
                    className={`flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors p-1 rounded hover:bg-gray-50 disabled:opacity-50 ${
                      userVote === "dislike" ? "text-red-500 font-bold" : ""
                    }`}
                  >
                    <ThumbsDown size={13} />
                    <span>{dislikes}</span>
                  </button>

                  {/* Reply Button */}
                  <button
                    onClick={() => setShowReplyInput(!showReplyInput)}
                    className={`flex items-center gap-1 hover:text-orange-500 cursor-pointer transition-colors p-1 rounded hover:bg-gray-50 ${
                      showReplyInput ? "text-orange-500 font-bold" : ""
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Reply</span>
                  </button>

                  {/* Delete Button */}
                  {isMyComment && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors ml-auto p-1 rounded hover:bg-gray-50 text-gray-400 disabled:opacity-50"
                      title="Delete comment"
                    >
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}

              {/* Inline Reply Input */}
              {showReplyInput && (
                <form
                  onSubmit={handleSubmitReply}
                  className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-inner flex flex-col gap-2 max-w-lg transition-all"
                >
                  <textarea
                    rows={2}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${authorName}...`}
                    className="w-full text-sm p-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 placeholder:text-gray-400"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={replyAnonymous}
                        onChange={(e) => setReplyAnonymous(e.target.checked)}
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                      />
                      Reply anonymously
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReplyInput(false);
                          setReplyContent("");
                        }}
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!replyContent.trim() || submittingReply}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {submittingReply && <Loader2 size={12} className="animate-spin" />}
                        Reply
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Recursive Replies Rendering */}
              {comment.replies && comment.replies.length > 0 && (
                <div
                  className={`border-l border-gray-200/80 pl-4 mt-2 transition-all duration-300 ${
                    depth >= 4 ? "ml-1" : "ml-2"
                  }`}
                >
                  {comment.replies.map((reply) => (
                    <CommentNode
                      key={reply.id}
                      comment={reply}
                      depth={depth + 1}
                      currentUserId={currentUserId}
                      onAddReply={onAddReply}
                      onVote={onVote}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentNode;
