import React from "react";
import { Download, File } from "lucide-react";

const Notescard = (props) => {
  return (
    <div className="w-full max-w-sm bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 p-3">
      <span
        className="inline-flex items-center gap-1 px-1  rounded-md 
                   bg-slate-50 
                   hover:bg-slate-100 transition float-right"
      >
        {props.date}
      </span>

      {props.thumbnail ? (
        <img
          src={props.thumbnail}
          className="w-full h-40 object-cover rounded-md"
        />
      ) : (
        <div className="w-full h-40 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500">
          <File size={70} />
        </div>
      )}

      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2 ">
          {props.title}
        </h2>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md 
                   bg-slate-50 border border-slate-200 
                   hover:bg-slate-100 transition"
          >
            {props.poster}
          </span>

          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md 
                   bg-slate-50 border border-slate-200 
                   hover:bg-slate-100 transition"
          >
            {props.batch}
          </span>
        </div>

        <hr className="my-2 border-gray-200" />

        <button className="flex items-center justify-center gap-2 w-1/2 bg-black text-white py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors duration-200 ">
          <Download size={18} className="text-orange-400" />
          <span className="text-white-400">Download</span>
        </button>
      </div>
    </div>
  );
};

export default Notescard;
