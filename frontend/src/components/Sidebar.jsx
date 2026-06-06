import React from "react";
import { Home, SearchCheck, Flag } from "lucide-react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="h-screen w-16 md:w-64 bg-white shadow-lg flex flex-col p-4 fixed">
      
    
      <div className="text-2xl font-bold mb-8 text-orange-500">
        Unisphere
      </div>

     
      <nav className="flex flex-col gap-3">

        <Link
          to='/home'
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 "
        >
          <Home size={20} />
          <span className="hidden md:inline">Home</span>
        </Link>

        <Link
          to='/lostandfound'
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 "
        >
          <SearchCheck size={20} />
          <span className="hidden md:inline">Lost & Found</span>
        </Link>

        <Link
         to='/notice'
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100  "
        >
          <Flag size={20} />
          <span className="hidden md:inline">Notice</span>
        </Link>

      </nav>
    </div>
  );
};

export default Sidebar;