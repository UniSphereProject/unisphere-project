import { createContext, useContext, useState } from "react";

const ProjectContext = createContext();

const initialProjects = [
  {
    id: 1,
    title: "UniSphere",
    description:
      "UniSphere is an AI-powered centralized university platform.",
    projectType: "Minor",
    status: "Pending",
    members: "Abik Paudel, Anil Pariyar, Ayush Acharya, Bimal Dhungana",
    batch: "2023",
    stream: "BSE",
  },
];

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState(initialProjects);

  const addProject = (project) => {
    const newProject = {
      ...project,
      id: Date.now(),
      status: "Pending",
    };

    setProjects((prev) => [newProject, ...prev]);
  };

  const getProjectById = (id) => {
    return projects.find(
      (project) => project.id === Number(id)
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        addProject,
        getProjectById,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  return useContext(ProjectContext);
};