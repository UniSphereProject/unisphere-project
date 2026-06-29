import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Send, MapPin, Tag, Link, FileUp, EyeOff, Image } from "lucide-react";
import { toast } from "react-toastify";
import API from "../utils/api";

/**
 * CreatePostModal — dynamic modal form that adapts fields based on community kind.
 *
 * Community kinds and their extra fields:
 *   discussion   → body, is_anonymous, image_url
 *   notes        → body, file_url*, file_name, is_anonymous
 *   lost_found   → body, item_state*, location, image_url, is_anonymous
 *   complaint    → body, is_anonymous
 *   announcement → body, is_anonymous
 *
 *   * = backend-required for this kind
 *
 * Props:
 *   - isOpen (boolean)
 *   - onClose (function)
 *   - onPostCreated (function) — called after successful creation
 *   - defaultCommunitySlug (string, optional) — pre-select a community
 */

const ITEM_STATE_OPTIONS = [
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];

const CreatePostModal = ({ isOpen, onClose, onPostCreated, defaultCommunitySlug = null }) => {
  // ── Core fields ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // ── Kind-specific fields ─────────────────────────────────────────────
  const [itemState, setItemState] = useState("");       // lost_found
  const [location, setLocation] = useState("");          // lost_found
  const [imageUrl, setImageUrl] = useState("");          // discussion, lost_found
  const [fileUrl, setFileUrl] = useState("");             // notes
  const [fileName, setFileName] = useState("");           // notes
  const [isAnonymous, setIsAnonymous] = useState(false);  // all kinds

  // ── Resolve the selected community's kind ────────────────────────────
  const selectedCommunity = useMemo(
    () => communities.find((c) => String(c.id) === communityId),
    [communities, communityId]
  );
  const kind = selectedCommunity?.kind || null;

  // ── Fetch communities ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) fetchCommunities();
  }, [isOpen]);

  const fetchCommunities = async () => {
    setLoadingCommunities(true);
    try {
      const res = await API.get("/communities", { params: { only_roots: true } });
      const list = res.data || [];
      setCommunities(list);
      // Pre-select if defaultCommunitySlug provided
      if (defaultCommunitySlug) {
        const match = list.find((c) => c.slug === defaultCommunitySlug);
        if (match) setCommunityId(String(match.id));
      }
    } catch {
      toast.error("Failed to load communities");
    } finally {
      setLoadingCommunities(false);
    }
  };

  // ── Reset kind-specific fields when community changes ─────────────────
  useEffect(() => {
    setItemState("");
    setLocation("");
    setImageUrl("");
    setFileUrl("");
    setFileName("");
    setIsAnonymous(false);
  }, [communityId]);

  // ── Validate required fields per kind ─────────────────────────────────
  const isValid = useMemo(() => {
    if (!title.trim() || !communityId) return false;
    if (kind === "lost_found" && !itemState) return false;
    if (kind === "notes" && !fileUrl.trim()) return false;
    return true;
  }, [title, communityId, kind, itemState, fileUrl]);

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        body: body.trim() || null,
        community_id: parseInt(communityId),
        is_anonymous: isAnonymous,
      };

      // Add kind-specific fields
      if (kind === "lost_found") {
        payload.item_state = itemState;
        if (location.trim()) payload.location = location.trim();
        if (imageUrl.trim()) payload.image_url = imageUrl.trim();
      }

      if (kind === "notes") {
        payload.file_url = fileUrl.trim();
        if (fileName.trim()) payload.file_name = fileName.trim();
      }

      if (kind === "discussion") {
        if (imageUrl.trim()) payload.image_url = imageUrl.trim();
      }

      await API.post("/posts", payload);
      toast.success("Post created successfully!");
      resetForm();
      onPostCreated?.();
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        toast.error(detail);
      } else {
        toast.error("Failed to create post");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBody("");
    setCommunityId("");
    setItemState("");
    setLocation("");
    setImageUrl("");
    setFileUrl("");
    setFileName("");
    setIsAnonymous(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // ── Kind label for the header ─────────────────────────────────────────
  const kindDisplayLabel = {
    discussion: "Discussion",
    notes: "Note",
    lost_found: "Lost & Found Item",
    complaint: "Complaint",
    announcement: "Announcement",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
            {kind && (
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mt-1 font-medium ${kindBadgeColor(kind)}`}>
                {kindDisplayLabel[kind] || kind}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* ── Community select ─────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Community <span className="text-red-500">*</span>
            </label>
            {loadingCommunities ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={16} className="animate-spin" /> Loading communities...
              </div>
            ) : (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-gray-50"
              >
                <option value="">Select a community...</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.kind.replace("_", " ")})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── Title (all kinds) ───────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === "lost_found"
                  ? "e.g. Lost blue backpack near library"
                  : kind === "notes"
                  ? "e.g. Data Structures — Complete Notes"
                  : kind === "complaint"
                  ? "e.g. WiFi connectivity issue in Block B"
                  : "What's on your mind?"
              }
              required
              maxLength={300}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-gray-50 placeholder:text-gray-400"
            />
          </div>

          {/* ── Body (all kinds) ─────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                kind === "lost_found"
                  ? "Describe the item, when/where you lost or found it..."
                  : kind === "complaint"
                  ? "Describe the issue in detail..."
                  : kind === "notes"
                  ? "Brief description of the notes..."
                  : "Add details, context, or links..."
              }
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-gray-50 resize-none placeholder:text-gray-400"
            />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              KIND-SPECIFIC FIELDS — only shown when relevant
              ══════════════════════════════════════════════════════════════ */}

          {/* ── LOST_FOUND fields ────────────────────────────────────── */}
          {kind === "lost_found" && (
            <div className="space-y-4 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Lost & Found Details
              </p>

              {/* Item State — REQUIRED */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Tag size={14} className="inline mr-1" />
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {ITEM_STATE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm cursor-pointer transition font-medium ${
                        itemState === opt.value
                          ? opt.value === "lost"
                            ? "bg-red-100 border-red-300 text-red-700"
                            : "bg-green-100 border-green-300 text-green-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="item_state"
                        value={opt.value}
                        checked={itemState === opt.value}
                        onChange={() => setItemState(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Library, 2nd floor"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Image size={14} className="inline mr-1" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* ── NOTES fields ─────────────────────────────────────────── */}
          {kind === "notes" && (
            <div className="space-y-4 p-4 bg-green-50/60 rounded-xl border border-green-100">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                Notes Details
              </p>

              {/* File URL — REQUIRED */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <FileUp size={14} className="inline mr-1" />
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/notes.pdf"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Direct link to the notes file (PDF, DOCX, etc.)
                </p>
              </div>

              {/* File Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. DSA-Complete-Notes.pdf"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* ── DISCUSSION extra fields ──────────────────────────────── */}
          {kind === "discussion" && (
            <div className="space-y-4 p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Discussion Details
              </p>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Image size={14} className="inline mr-1" />
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* ── Anonymous toggle (all kinds) ─────────────────────────── */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="is_anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
            <label
              htmlFor="is_anonymous"
              className="text-sm text-gray-700 cursor-pointer select-none flex items-center gap-1.5"
            >
              <EyeOff size={14} className="text-gray-400" />
              Post anonymously
            </label>
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/** Post-type badge colours */
const kindBadgeColor = (kind) => {
  const map = {
    discussion: "bg-blue-100 text-blue-700",
    notes: "bg-green-100 text-green-700",
    lost_found: "bg-amber-100 text-amber-700",
    complaint: "bg-red-100 text-red-700",
    announcement: "bg-purple-100 text-purple-700",
    project: "bg-teal-100 text-teal-700",
  };
  return map[kind] || "bg-gray-100 text-gray-700";
};

export default CreatePostModal;