import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import ProjectHeader from "../components/Project/ProjectHeader";
import ProjectFilter from "../components/Project/ProjectFilter";
import ProjectList from "../components/Project/ProjectList";
import SubmitProjectModal from "../components/Project/SubmitProjectModal";

import { useProjects } from "../context/ProjectContext";

const Projects = () => {
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get projects from Context
  const { projects, addProject } = useProjects();

  const handleAddProject = (newProject) => {
    addProject(newProject);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      <div className="flex">
        <Sidebar
          onCommunitySelect={(slug) =>
            navigate(`/home?community=${slug}`)
          }
          onCreatePost={() =>
            navigate("/home?create=1")
          }
        />

        <div className="flex-1 px-8 py-24 ml-0 md:ml-64">

          <ProjectHeader
            onOpenModal={() => setIsModalOpen(true)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <ProjectFilter
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />

          <ProjectList
            projects={projects}
            selectedFilter={selectedFilter}
            searchTerm={searchTerm}
          />

          <SubmitProjectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddProject}
          />

        </div>
      </div>
    </div>
  );
};

export default Projects;