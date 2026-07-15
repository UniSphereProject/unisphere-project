import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../utils/api";
import { resolveCommunitySlug } from "../utils/communities";
import { Megaphone, Image, X, Loader2, Send } from "lucide-react";
import { toast } from "react-toastify";


const Teacher = () => {
  const navigate = useNavigate();
  const [communityId, setCommunityId] = useState(null);
  const [resolvingCommunity, setResolvingCommunity] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploadedImageKey, setUploadedImageKey] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const resolve = async () => {
      setResolvingCommunity(true);
      const id = await resolveCommunitySlug("announcements");
      setCommunityId(id);
      setResolvingCommunity(false);
    };
    resolve();
  }, []);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setIsAnonymous(false);
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (e.target.value) e.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid image type. Accepted: JPEG, PNG, WebP, GIF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await API.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedImageUrl(res.data.url);
      setUploadedImageKey(res.data.key);
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Image upload failed");
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please add a title.");
      return;
    }
    if (!communityId) {
      toast.error("Couldn't find the Announcements community. Please try again later.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim() || null,
        community_id: communityId,
        is_anonymous: isAnonymous,
      };
      if (uploadedImageUrl) payload.image_url = uploadedImageUrl;
      if (uploadedImageKey) payload.image_key = uploadedImageKey;

      await API.post("/posts", payload);
      toast.success("Announcement published!");
      resetForm();
      navigate("/notice");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Failed to publish announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen m-0 py-2">
      <Navbar />
      <div className="flex">
        <Sidebar
          onCommunitySelect={(slug) => navigate(`/home?community=${slug}`)}
          onCreatePost={() => navigate("/home?create=1")}
        />

        <div className="mt-16 flex-1 px-3 sm:px-6 py-4 ml-0 md:ml-64">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-orange-500" size={26} />
              <h1 className="text-2xl font-bold text-gray-800">Post an Announcement</h1>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6 space-y-5"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-term exam schedule released"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Details
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the announcement details here..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Image (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Image (optional)
                </label>
                {imagePreview ? (
                  <div className="relative w-full max-h-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full max-h-64 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full cursor-pointer transition"
                    >
                      <X size={14} />
                    </button>
                    {!uploadedImageUrl && (
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={imageUploading}
                        className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition"
                      >
                        {imageUploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Image size={14} />
                        )}
                        <span>{imageUploading ? "Uploading..." : "Upload"}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-500 transition cursor-pointer w-full justify-center"
                  >
                    <Image size={18} />
                    <span className="text-sm font-medium">Add an image</span>
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Anonymous toggle */}
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                />
                Post anonymously
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || resolvingCommunity || (imageFile && !uploadedImageUrl)}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition active:scale-95"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                <span>{submitting ? "Publishing..." : "Publish Announcement"}</span>
              </button>
              {imageFile && !uploadedImageUrl && (
                <p className="text-xs text-amber-600 text-center -mt-2">
                  Please upload the selected image before publishing.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teacher;
