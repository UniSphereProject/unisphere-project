import React, { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, ShieldCheck } from "lucide-react";
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
  const rs = post.reaction_summary || { likes: 0, dislikes: 0, user_reaction: null };
  const [likes, setLikes] = useState(rs.likes);
  const [dislikes, setDislikes] = useState(rs.dislikes);
  const [userVote, setUserVote] = useState(rs.user_reaction);
  const [reacting, setReacting] = useState(false);

  // ── Comments ───────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);

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
    <div className="p-4 border border-gray-200 rounded-xl shadow-lg bg-white m-4 hover:shadow-md transition mx-auto w-full max-w-xl border-l-4 border-orange-400">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-orange-600 font-medium">{authorName}</span>
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
          <ShieldCheck size={16} className="text-green-600" title="Teacher verified" />
        )}
      </div>

      {/* Post type badge */}
      {post.post_type && (
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 ${typeBadgeColor(post.post_type)}`}>
          {post.post_type?.replace("_", " ")}
        </span>
      )}

      {/* Title */}
      <p className="text-xl font-bold text-gray-900 mb-3">{post.title}</p>

      {/* Content */}
      {post.body && (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{post.body}</p>
      )}

      {/* Image (only if exists) */}
      {post.image_url && (
        <img
          className="w-full h-auto object-cover rounded-lg mb-3"
          alt="discussion"
          src={post.image_url}
        />
      )}

      {/* Community name */}
      {post.community && (
        <span className="text-xs text-gray-400 mb-2 block">in {post.community.name}</span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 text-gray-600 border-b border-gray-50 pb-2">
        <button
          className={`flex items-center gap-1 hover:text-green-600 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 ${
            userVote === "like" ? "text-green-600 font-semibold" : ""
          }`}
          onClick={() => handleReact("like")}
          disabled={reacting}
        >
          <ThumbsUp size={18} />
          <span>{likes}</span>
        </button>

        <button
          className={`flex items-center gap-1 hover:text-red-500 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 ${
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
          className={`flex items-center gap-1.5 transition hover:cursor-pointer p-1 rounded-md ${
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
        <CommentSection
          postId={post.id}
          onCommentCountChange={setCommentCount}
        />
      )}
    </div>
  );
};

export default Discussion;
