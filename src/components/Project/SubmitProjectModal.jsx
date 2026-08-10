import { useState } from "react";

const SubmitProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const initialState = {
    title: "",
    description: "",
    projectType: "Minor",
    members: "",
    batch: "",
    stream: "",
    report: null,
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleProjectType = (type) => {
    setFormData({
      ...formData,
      projectType: type,
    });
  };

  const handleSubmit = () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.members.trim() ||
      !formData.batch.trim() ||
      !formData.stream.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    onSubmit(formData);

    setFormData(initialState);

    alert("Project submitted successfully!");

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">

      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative shadow-xl">

        <button
          onClick={onClose}
          className="absolute top-5 right-6 text-3xl text-gray-500 hover:text-black"
        >
          ×
        </button>

        <h2 className="text-3xl font-bold mb-8">
          Submit Project Details
        </h2>

        {/* Project Title */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Project Title *
          </label>

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. AI Powered Attendance System"
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Description *
          </label>

          <textarea
            rows="5"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Briefly describe your project..."
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Project Type */}
        <div className="mb-5">

          <label className="block font-semibold mb-3">
            Project Type *
          </label>

          <div className="grid grid-cols-2 gap-4">

            <button
              type="button"
              onClick={() => handleProjectType("Minor")}
              className={`py-3 rounded-xl font-semibold transition ${
                formData.projectType === "Minor"
                  ? "bg-orange-500 text-white"
                  : "border border-gray-300 hover:bg-gray-100"
              }`}
            >
              Minor Project
            </button>

            <button
              type="button"
              onClick={() => handleProjectType("Major")}
              className={`py-3 rounded-xl font-semibold transition ${
                formData.projectType === "Major"
                  ? "bg-orange-500 text-white"
                  : "border border-gray-300 hover:bg-gray-100"
              }`}
            >
              Major Project
            </button>

          </div>

        </div>

        {/* Members */}
        <div className="mb-5">

          <label className="block font-semibold mb-2">
            Team Members *
          </label>

          <input
            type="text"
            name="members"
            value={formData.members}
            onChange={handleChange}
            placeholder="Anil Pariyar, Ram Sharma..."
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400"
          />

        </div>

        {/* Batch and Stream */}
        <div className="grid md:grid-cols-2 gap-4 mb-5">

          <div>

            <label className="block font-semibold mb-2">
              Batch *
            </label>

            <input
              type="text"
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              placeholder="2023"
              className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Stream *
            </label>

            <input
              type="text"
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              placeholder="BSE"
              className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-orange-400"
            />

          </div>

        </div>

        {/* PDF Upload */}
        <div className="mb-8">

          <label className="block font-semibold mb-2">
            Upload Project Report (PDF)
          </label>

          <input
            type="file"
            name="report"
            accept=".pdf"
            onChange={handleChange}
            className="w-full border rounded-xl p-3"
          />

        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold transition"
        >
          Submit Project
        </button>

      </div>

    </div>
  );
};

export default SubmitProjectModal;