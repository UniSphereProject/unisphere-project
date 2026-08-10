import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Layers,
  Eye,
  FileText,
} from "lucide-react";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const typeColors = {
  Minor: "bg-blue-100 text-blue-700",
  Major: "bg-purple-100 text-purple-700",
};

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">

      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">

        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {project.title}
          </h2>

          <p className="text-gray-500 mt-1">
            {project.description}
          </p>
        </div>

        <div className="flex flex-col gap-2">

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium text-center ${typeColors[project.projectType]}`}
          >
            {project.projectType}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium text-center ${statusColors[project.status]}`}
          >
            {project.status}
          </span>

        </div>

      </div>

      {/* Project Info */}
      <div className="grid md:grid-cols-3 gap-4 py-4 border-t border-b">

        <div className="flex items-center gap-2 text-gray-600">
          <Users size={18} />
          <span>{project.members}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <GraduationCap size={18} />
          <span>Batch {project.batch}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Layers size={18} />
          <span>{project.stream}</span>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-5">

        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex items-center gap-2 border border-orange-400 text-orange-500 px-4 py-2 rounded-lg hover:bg-orange-50 transition"
        >
          <Eye size={18} />
          View Details
        </button>

        <button
          onClick={() => window.open("/report/report.pdf", "_blank")}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          <FileText size={18} />
          View Report
        </button>

      </div>

    </div>
  );
};

export default ProjectCard;