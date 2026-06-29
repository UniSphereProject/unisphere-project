
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import CommentSection from "./CommentSection";
import mockCommentsData from "../mockCommentsData";

const countTotalComments = (list) => {
  let count = list.length;
  for (let c of list) {
    if (c.replies && c.replies.length > 0) {
      count += countTotalComments(c.replies);
    }
  }
  return count;
};

const Discussion = (props) => {
  const [Upcount, setUpcount] = useState(0);
  const [Downcount, setDowncount] = useState(0);
  const [Vote, setVote] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(() => {
    const cached = localStorage.getItem(`comments_post_${props.id}`);
    if (cached) {
      try {
        return countTotalComments(JSON.parse(cached));
      } catch (e) {}
    }
    return countTotalComments(mockCommentsData[props.id] || []);
  });

  const handleThumbsUp = () => {
    if (Vote === null) {
      setUpcount((prev) => prev + 1);
      setVote("up");
    }
    else if(Vote === 'up'){
       setUpcount((prev) => prev - 1);
      setVote(null);
    }
    else{
      setDowncount(prev => prev-1)
      setUpcount((prev) => prev + 1);
      setVote('up');
    }
  };

 const handleThumbsDown = () => {
    if (Vote === null) {
      setDowncount((prev) => prev + 1);
      setVote("down");
    }
    else if(Vote === 'down'){
       setDowncount((prev) => prev - 1)
      setVote(null);
    }
    else{
      setDowncount(prev => prev+1)
      setUpcount(prev=>prev-1)
      setVote('down');
    }
  };

  return (
    <div className="  p-4 border border-gray-200 rounded-xl shadow-lg bg-white m-4 hover:shadow-md transition mx-auto w-full max-w-xl border-l-4 border-orange-600  ml-16 md:ml-125">
      {/* User */}
      <p className="text-sm  text-orange-600 font-medium mb-3">{props.user}</p>

      {/* Title */}
      <p className="text-xl font-bold text-gray-900 mb-3">{props.title}</p>

      {/* Content */}
      <p className="text-sm  text-gray-700 mb-3">{props.content}</p>

      {/* Image (only if exists) */}
      {props.imageurl && (
        <img
          className="w-full h-auto object-cover rounded-lg mb-3"
          alt="discussion"
          src={props.imageurl}
        />
      )}

      <div className="flex items-center gap-4 text-gray-600 border-b border-gray-50 pb-2">
        <button
          className={`flex items-center gap-1 hover:text-green-600 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 ${
            Vote === "up" ? "text-green-600 font-semibold" : ""
          }`}
          onClick={handleThumbsUp}
        >
          <ThumbsUp size={18} />
          <span>{Upcount}</span>
        </button>

        <button
          className={`flex items-center gap-1 hover:text-red-500 transition hover:cursor-pointer p-1 rounded-md hover:bg-gray-50 ${
            Vote === "down" ? "text-red-500 font-semibold" : ""
          }`}
          onClick={handleThumbsDown}
        >
          <ThumbsDown size={18} />
          <span>{Downcount}</span>
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
          postId={props.id}
          onCommentCountChange={setCommentCount}
        />
      )}
    </div>
  );
};

export default Discussion;
