import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { FolderOpen, Construction } from "lucide-react";

const Projects = () => {
  return (
    <>
      <div className="bg-slate-100 min-h-screen m-0">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="mt-16 flex-1 flex flex-col items-center justify-center px-4 py-20">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-10 text-center max-w-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FolderOpen size={32} className="text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Past Projects</h1>
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                <Construction size={18} />
                <span className="text-sm font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                This section will showcase past student projects — including final year
                projects, hackathon submissions, and research work. Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Projects;
