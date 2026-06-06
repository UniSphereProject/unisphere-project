import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";

const Discussion = (props) => {
  const [Upcount, setUpcount] = useState(0);
  const [Downcount, setDowncount] = useState(0);
  const [Vote, setVote] = useState(null);

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
    <div className="  p-4 border border-gray-200 rounded-xl shadow-lg bg-white m-4 hover:shadow-md transition mx-auto w-full max-w-xl border-l-4 border-orange-500  ml-16 md:ml-125">
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

      <div className="flex items-center gap-4 text-gray-600">
        <button
          className="flex items-center gap-1 hover:text-green-600 transition hover:cursor-pointer"
          onClick={handleThumbsUp}
        >
          <ThumbsUp size={18} />
          <span>{Upcount}</span>
        </button>

        <button
          className="flex items-center gap-1 hover:text-red-500 transition hover:cursor-pointer"
          onClick={handleThumbsDown}
        >
          <ThumbsDown size={18} />
          <span>{Downcount}</span>
        </button>

        <button className="flex items-center gap-1 hover:text-orange-500 transition hover:cursor-pointer">
          <MessageCircle size={19} />
        </button>
      </div>
    </div>
  );
};

export default Discussion;
