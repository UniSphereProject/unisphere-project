import { Search } from "lucide-react";

const ProjectHeader = ({
  onOpenModal,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="mb-8">

      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            College Projects
          </h1>

          <p className="text-gray-500 mt-2">
            Browse and submit minor & major projects.
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          + Submit Project
        </button>

      </div>

      {/* Search Bar */}
      <div className="relative mt-8">

        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search by title, member or stream..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

      </div>

    </div>
  );
};

export default ProjectHeader;