const filters = ["All", "Pending", "Verified", "Rejected"];

const ProjectFilter = ({ selectedFilter, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-3 my-6">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-5 py-2 rounded-full border transition font-medium ${
            selectedFilter === filter
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default ProjectFilter;