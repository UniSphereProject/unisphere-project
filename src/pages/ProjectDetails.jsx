import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Layers,
  FileText,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const demoProject = {
  id: 1,
  title: "UniSphere",
  description:
    "UniSphere is an AI-powered centralized university platform that unifies communication, academic resource sharing, grievance reporting, mentorship, and an intelligent lost-and-found recovery agent built to transform disconnected campus life into a seamless digital experience.",
  projectType: "Minor",
  status: "Pending",
  members: [
    "Abik Paudel",
    "Anil Pariyar",
    "Ayush Acharya",
    "Bimal Dhungana",
  ],
  batch: "2023",
  stream: "BSE",
};

const ProjectDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex">
        <Sidebar
          onCommunitySelect={() => {}}
          onCreatePost={() => {}}
        />

        <div className="flex-1 px-8 py-24 ml-0 md:ml-64">

          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-orange-500 font-semibold mb-6 hover:underline"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="flex justify-between items-center mb-6">

              <div>
                <h1 className="text-4xl font-bold">
                  {demoProject.title}
                </h1>

                <p className="text-gray-500 mt-2">
                  Project ID: {id}
                </p>
              </div>

              <div className="flex gap-3">

                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                  {demoProject.projectType}
                </span>

                <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full">
                  {demoProject.status}
                </span>

              </div>

            </div>

            <h2 className="text-xl font-bold mb-3">
              Description
            </h2>

            <p className="text-gray-600 leading-8 mb-8">
              {demoProject.description}
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">

              <div className="flex items-center gap-3">
                <Users />
                <span>{demoProject.members.join(", ")}</span>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap />
                <span>Batch {demoProject.batch}</span>
              </div>

              <div className="flex items-center gap-3">
                <Layers />
                <span>{demoProject.stream}</span>
              </div>

            </div>

            <button className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-xl hover:bg-orange-600">

              <FileText size={18} />

              Download Report

            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProjectDetails;