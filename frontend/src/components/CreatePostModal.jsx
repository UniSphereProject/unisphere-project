import React, { useState, useEffect } from "react";
import { X, Loader2, Plus, ImageOff, CheckCircle2 } from "lucide-react";
import api from "../lib/api";
import { formatApiError } from "../lib/format";

// Live image preview — shows a small thumbnail as soon as the URL resolves.
// Tells the user immediately if the URL is broken before they post.
const ImagePreview = ({ url }) => {
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error

  useEffect(() => {
    if (!url) { setStatus("idle"); return; }
    setStatus("loading");
    const img = new Image();
    img.onload  = () => setStatus("ok");
    img.onerror = () => setStatus("error");
    img.src = url;
  }, [url]);

  if (!url || status === "idle") return null;

  return (
    <div className="mt-2">
      {status === "loading" && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={12} className="animate-spin" /> Checking image…
        </div>
      )}
      {status === "ok" && (
        <div className="relative rounded-lg overflow-hidden border border-green-200">
          <img src={url} alt="preview" className="w-full max-h-48 object-cover" />
          <span className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <CheckCircle2 size={10} /> Image looks good
          </span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <ImageOff size={13} />
          <span>Could not load this image. Check the URL — it must be a direct link to an image file (ending in .jpg, .png, etc.)</span>
        </div>
      )}
    </div>
  );
};

const CreatePostModal = ({ onClose, onCreated, defaultPostType }) => {
  const [communities, setCommunities]           = useState([]);
  const [communityId, setCommunityId]           = useState("");
  const [title, setTitle]                       = useState("");
  const [body, setBody]                         = useState("");
  const [isAnonymous, setIsAnonymous]           = useState(false);
  const [imageUrl, setImageUrl]                 = useState("");
  const [imageUrlInput, setImageUrlInput]       = useState(""); // raw input (debounced into imageUrl)
  const [loading, setLoading]                   = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError]                       = useState(null);

  // Debounce the image URL so the preview doesn't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setImageUrl(imageUrlInput.trim()), 600);
    return () => clearTimeout(t);
  }, [imageUrlInput]);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoadingCommunities(true);
        const res = await api.get("/communities", {
          params: defaultPostType ? { kind: defaultPostType } : {},
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setCommunities(list);
        if (list.length > 0) setCommunityId(String(list[0].id));
      } catch {
        setError("Could not load communities.");
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchCommunities();
  }, [defaultPostType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!communityId) { setError("Please select a community."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title:        title.trim(),
        body:         body.trim() || undefined,
        community_id: Number(communityId),
        is_anonymous: isAnonymous,
        image_url:    imageUrl || undefined,
      };
      const res = await api.post("/posts", payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(formatApiError(err, "Failed to create post."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">

          {/* Community */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Community</label>
            {loadingCommunities ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-gray-50"
              >
                <option value="">Select community…</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.kind})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title…"
              maxLength={300}
              required
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-gray-50"
            />
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts…"
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-gray-50 resize-none"
            />
          </div>

          {/* Image URL + live preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Image URL <span className="text-gray-400">(optional — must be a direct image link)</span>
            </label>
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 bg-gray-50"
            />
            {/* Live preview renders 600ms after typing stops */}
            <ImagePreview url={imageUrl} />
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
            />
            Post anonymously
          </label>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || loadingCommunities}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? "Posting…" : "Post"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
