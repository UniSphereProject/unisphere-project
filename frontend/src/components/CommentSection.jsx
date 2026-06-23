import React, { useState, useEffect } from "react";
import CommentNode from "./CommentNode";
import mockCommentsData from "../mockCommentsData";
import { useAuth } from "../context/AuthContext";
import { Send } from "lucide-react";

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

// Count total comments recursively
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

  // Initialize state from local storage or fall back to mock data
  const [comments, setComments] = useState(() => {
    const cached = localStorage.getItem(`comments_post_${postId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached comments:", e);
      }
    }
    return mockCommentsData[postId] || [];
  });

  const [newCommentText, setNewCommentText] = useState("");

  // Sync to localStorage whenever comments change
  useEffect(() => {
    localStorage.setItem(`comments_post_${postId}`, JSON.stringify(comments));
    if (onCommentCountChange) {
      onCommentCountChange(countTotalComments(comments));
    }
  }, [comments, postId, onCommentCountChange]);

  // Recalculate count on load to ensure sync
  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(countTotalComments(comments));
    }
  }, [postId]);

  // Recursively add a reply to the target comment in the tree
  const addReplyToTree = (list, targetId, newReply) => {
    return list.map((comment) => {
      if (comment.id === targetId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToTree(comment.replies, targetId, newReply),
        };
      }
      return comment;
    });
  };

  // Recursively delete a comment from the tree
  const deleteFromTree = (list, targetId) => {
    return list
      .filter((comment) => comment.id !== targetId)
      .map((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: deleteFromTree(comment.replies, targetId),
          };
        }
        return comment;
      });
  };

  // Recursively update voting count in the tree
  const updateVoteInTree = (list, targetId, voteDiff) => {
    return list.map((comment) => {
      if (comment.id === targetId) {
        return {
          ...comment,
          votes: comment.votes + voteDiff,
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateVoteInTree(comment.replies, targetId, voteDiff),
        };
      }
      return comment;
    });
  };

  // Handler to add a root comment
  const handleAddRootComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `comment_${Date.now()}`,
      author: currentUser,
      avatarColor: "", // Will fall back to dynamic generation in CommentNode
      content: newCommentText.trim(),
      timestamp: "Just now",
      votes: 0,
      replies: [],
    };

    setComments([newComment, ...comments]);
    setNewCommentText("");
  };

  // Handler to add a reply
  const handleAddReply = (parentId, content) => {
    const newReply = {
      id: `comment_${Date.now()}`,
      author: currentUser,
      avatarColor: "",
      content: content,
      timestamp: "Just now",
      votes: 0,
      replies: [],
    };

    setComments((prevComments) =>
      addReplyToTree(prevComments, parentId, newReply)
    );
  };

  // Handler for upvote/downvote action
  const handleVote = (commentId, voteDiff) => {
    setComments((prevComments) =>
      updateVoteInTree(prevComments, commentId, voteDiff)
    );
  };

  // Handler to delete a comment
  const handleDelete = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setComments((prevComments) => deleteFromTree(prevComments, commentId));
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4 animate-fadeIn">
      <h3 className="text-sm font-semibold text-gray-900 px-1">
        Comments ({countTotalComments(comments)})
      </h3>

      {/* Root Comment Form */}
      <form onSubmit={handleAddRootComment} className="flex gap-2">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 text-sm px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white placeholder:text-gray-400 transition"
        />
        <button
          type="submit"
          disabled={!newCommentText.trim()}
          className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>

      {/* Comments List */}
      <div className="flex flex-col max-h-[500px] overflow-y-auto pr-1 select-text scrollbar-thin">
        {comments.length === 0 ? (
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
