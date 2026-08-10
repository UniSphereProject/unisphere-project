import ProjectCard from "./ProjectCard";

const ProjectList = ({
  projects,
  selectedFilter,
  searchTerm,
}) => {
  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      selectedFilter === "All" ||
      project.status === selectedFilter;

    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      project.title.toLowerCase().includes(keyword) ||
      project.members.toLowerCase().includes(keyword) ||
      project.stream.toLowerCase().includes(keyword);

    return matchesStatus && matchesSearch;
  });

  if (filteredProjects.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <h2 className="text-2xl font-bold text-gray-700">
          No Projects Found
        </h2>

        <p className="text-gray-500 mt-2">
          Try another search keyword or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {filteredProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}
    </div>
  );
};

export default ProjectList;