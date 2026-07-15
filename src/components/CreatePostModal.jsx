import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Send, MapPin, Tag, FileUp, FileText, EyeOff, Image } from "lucide-react";
import { toast } from "react-toastify";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserFromToken, ROLES } from "../utils/auth";

/**
 * CreatePostModal — dynamic modal form that adapts fields based on community kind.
 *
 * Community kinds and their extra fields:
 *   discussion   → body, is_anonymous, image_url (upload)
 *   notes        → body, file_url*, file_name, is_anonymous
 *   lost_found   → body, item_state*, location, image_url (upload), is_anonymous
 *   complaint    → body, is_anonymous
 *   announcement → body, is_anonymous, image_url (upload)
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
  // ── Who's posting? Announcements are teacher/moderator/admin only ────
  const { token } = useAuth();
  const role = getUserFromToken(token)?.role;
  const canAnnounce = role === ROLES.TEACHER || role === ROLES.MODERATOR || role === ROLES.ADMIN;

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



  const [imageFile, setImageFile] = useState(null);       // File object
  const [imagePreview, setImagePreview] = useState(null);  // base64 preview URL
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // presigned URL from backend
  const [uploadedImageKey, setUploadedImageKey] = useState(null); // MinIO key

  // File upload state (notes)
  const [noteFile, setNoteFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uploadedFileKey, setUploadedFileKey] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadedFileSize, setUploadedFileSize] = useState(null);

  // Refs for file inputs — needed for mobile click triggers
  const imageInputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // ── Image upload (discussion, lost_found) ──────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (e.target.value) e.target.value = "";
    if (!file) return;

    // Client-side validation
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

  // ── File upload (notes) ────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (e.target.value) e.target.value = "";
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.ms-powerpoint",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Accepted: PDF, DOCX, PPTX, DOC, PPT, TXT");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max 50MB.");
      return;
    }

    setNoteFile(file);
  };

  const handleFileUpload = async () => {
    if (!noteFile) return;
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", noteFile);
      const res = await API.post("/upload/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedFileUrl(res.data.url);
      setUploadedFileKey(res.data.key);
      setUploadedFileName(res.data.file_name);
      setUploadedFileSize(res.data.file_size);
      toast.success("File uploaded!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "File upload failed");
      setNoteFile(null);
    } finally {
      setFileUploading(false);
    }
  };

  const handleFileRemove = () => {
    setNoteFile(null);
    setUploadedFileUrl(null);
    setUploadedFileKey(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
  };

  // ── Resolve the selected community's kind ────────────────────────────
  const selectedCommunity = useMemo(
    () => communities.find((c) => String(c.id) === communityId),
    [communities, communityId]
  );
  const kind = selectedCommunity?.kind || null;

  // Students never see "announcement" communities in this generic form —
  // announcements are published exclusively through the Teacher page.
  const visibleCommunities = useMemo(
    () => communities.filter((c) => c.kind !== "announcement" || canAnnounce),
    [communities, canAnnounce]
  );

  // ── Fetch communities ────────────────────────────────────────────────
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

  useEffect(() => {
    if (isOpen) fetchCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Reset kind-specific fields when community changes ─────────────────
  useEffect(() => {
    setItemState("");
    setLocation("");
    setImageUrl("");
    setFileUrl("");
    setFileName("");
    setIsAnonymous(false);
    // Clear image upload state
    setImageFile(null);
    setImagePreview(null);
    setImageUploading(false);
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
    // Clear file upload state (notes)
    setNoteFile(null);
    setFileUploading(false);
    setUploadedFileUrl(null);
    setUploadedFileKey(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
  }, [communityId]);

  // ── Validate required fields per kind ─────────────────────────────────
  const isValid = useMemo(() => {
    if (!title.trim() || !communityId) return false;
    if (kind === "announcement" && !canAnnounce) return false;
    if (kind === "lost_found" && !itemState) return false;
    if (kind === "notes" && !fileUrl.trim() && !uploadedFileUrl) return false;
    return true;
  }, [title, communityId, kind, canAnnounce, itemState, fileUrl, uploadedFileUrl]);

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (kind === "announcement" && !canAnnounce) {
      toast.error("Only teachers, moderators, and admins can post announcements.");
      return;
    }

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

      // ── Lost & Found ─────────────────────────────────────
      if (kind === "lost_found") {
        payload.item_state = itemState;

        if (location.trim()) {
          payload.location = location.trim();
        }

        // Prefer uploaded image, fallback to manual URL
        if (uploadedImageUrl || imageUrl.trim()) {
          payload.image_url = uploadedImageUrl || imageUrl.trim();
        }

        // Send MinIO object key if available
        if (uploadedImageKey) {
          payload.image_key = uploadedImageKey;
        }
      }

      // ── Notes ────────────────────────────────────────────
      if (kind === "notes") {
        // Prefer uploaded file, fallback to manual URL
        payload.file_url = uploadedFileUrl || fileUrl.trim();

        if (uploadedFileKey) {
          payload.file_key = uploadedFileKey;
        }

        // Prefer uploaded metadata
        if (uploadedFileName || fileName.trim()) {
          payload.file_name = uploadedFileName || fileName.trim();
        }

        if (uploadedFileSize) {
          payload.file_size = uploadedFileSize;
        }
      }

      // ── Discussion ───────────────────────────────────────
      if (kind === "discussion") {
        if (uploadedImageUrl || imageUrl.trim()) {
          payload.image_url = uploadedImageUrl || imageUrl.trim();
        }

        if (uploadedImageKey) {
          payload.image_key = uploadedImageKey;
        }
      }

      // ── Announcement ──────────────────────────────────
      if (kind === "announcement") {
        if (uploadedImageUrl || imageUrl.trim()) {
          payload.image_url = uploadedImageUrl || imageUrl.trim();
        }

        if (uploadedImageKey) {
          payload.image_key = uploadedImageKey;
        }
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
    // Clear image upload state
    setImageFile(null);
    setImagePreview(null);
    setImageUploading(false);
    setUploadedImageUrl(null);
    setUploadedImageKey(null);
    // Clear file upload state (notes)
    setNoteFile(null);
    setFileUploading(false);
    setUploadedFileUrl(null);
    setUploadedFileKey(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
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

  // ── Shared image upload UI ─────────────────────────────────────────────
  const imageUploadUI = (hoverColor = "orange") => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        <Image size={14} className="inline mr-1" />
        Image
      </label>

      {/* Uploaded — show preview */}
      {uploadedImageUrl ? (
        <div className="relative group">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-36 sm:h-48 object-cover rounded-xl border border-gray-200"
          />
          <button
            type="button"
            onClick={handleImageRemove}
            className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-red-100 text-gray-600 hover:text-red-500 cursor-pointer transition"
          >
            <X size={16} />
          </button>
          <span className="absolute bottom-2 left-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
            ✓ Uploaded
          </span>
        </div>
      ) : imageFile ? (
        /* File selected but not yet uploaded */
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full sm:w-16 h-32 sm:h-16 object-cover rounded-lg border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{imageFile.name}</p>
            <p className="text-xs text-gray-400">
              {(imageFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={imageUploading}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition"
            >
              {imageUploading ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
            </button>
            <button
              type="button"
              onClick={handleImageRemove}
              className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* No file selected — show upload button */
        <div
          onClick={() => imageInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-${hoverColor}-400 hover:text-${hoverColor}-500 cursor-pointer transition`}
        >
          <Image size={20} />
          <span>Tap to upload an image</span>
        </div>
      )}

      {/* Visually-hidden but functional file input for mobile */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageSelect}
        className="sr-only"
        aria-label="Upload image"
      />

      {/* OR paste URL manually */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-600">
          Or paste image URL manually
        </summary>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
        />
      </details>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-2 sm:mx-4 my-4 sm:my-0 max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
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
                {visibleCommunities.map((c) => (
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
            <div className="space-y-4 p-3 sm:p-4 bg-amber-50/60 rounded-xl border border-amber-100">
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

              {/* Image Upload */}
              {imageUploadUI("amber")}
            </div>
          )}

          {/* ── NOTES fields ─────────────────────────────────────────── */}
          {kind === "notes" && (
            <div className="space-y-4 p-3 sm:p-4 bg-green-50/60 rounded-xl border border-green-100">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                Notes Details
              </p>

              {/* File Upload — REQUIRED */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <FileUp size={14} className="inline mr-1" />
                  File <span className="text-red-500">*</span>
                </label>

                {/* If file already uploaded */}
                {uploadedFileUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <FileText size={24} className="text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{uploadedFileName}</p>
                      <p className="text-xs text-gray-400">
                        {(uploadedFileSize / 1024 / 1024).toFixed(1)} MB · ✓ Uploaded
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFileRemove}
                      className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : noteFile ? (
                  /* File selected but not yet uploaded */
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <FileText size={24} className="text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{noteFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(noteFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={fileUploading}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition"
                      >
                        {fileUploading ? <Loader2 size={14} className="animate-spin" /> : "Upload"}
                      </button>
                      <button
                        type="button"
                        onClick={handleFileRemove}
                        className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No file selected — use visible button instead of hidden input */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 cursor-pointer transition"
                  >
                    <FileUp size={24} className="mb-2" />
                    <span className="font-medium">Tap to upload a file</span>
                    <span className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX — max 50MB</span>
                  </div>
                )}

                {/* Accessible file input for mobile — uses sr-only (screen-reader only, still clickable) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.doc,.ppt,.txt"
                  onChange={handleFileSelect}
                  className="sr-only"
                  aria-label="Upload notes file"
                />

                {/* OR paste URL manually */}
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-600">
                    Or paste file URL manually (Google Drive, etc.)
                  </summary>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 bg-white placeholder:text-gray-400"
                  />
                </details>
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
            <div className="space-y-4 p-3 sm:p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Discussion Details
              </p>
              {imageUploadUI("orange")}
            </div>
          )}

          {/* ── ANNOUNCEMENT extra fields ───────────────────────────── */}
          {kind === "announcement" && (
            <div className="space-y-4 p-3 sm:p-4 bg-purple-50/60 rounded-xl border border-purple-100">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Announcement Details
              </p>
              {imageUploadUI("purple")}
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
