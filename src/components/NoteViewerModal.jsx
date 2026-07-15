import { useEffect, useState } from "react";
import { X, Loader2, FileWarning, ExternalLink } from "lucide-react";

/**
 * Figures out how to preview a file just from its name/mime type.
 * Falls back to "other" (no inline preview available) when unsure.
 */
const getFileKind = (fileName = "", fileType = "") => {
  const name = fileName.toLowerCase();
  const type = fileType.toLowerCase();

  if (type.includes("pdf") || name.endsWith(".pdf")) return "pdf";

  if (
    type.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => name.endsWith(ext))
  ) {
    return "image";
  }

  if (
    [".doc", ".docx", ".ppt", ".pptx"].some((ext) => name.endsWith(ext)) ||
    type.includes("wordprocessingml") ||
    type.includes("presentationml") ||
    type.includes("msword") ||
    type.includes("powerpoint")
  ) {
    return "office";
  }

  if (type.includes("text/plain") || name.endsWith(".txt")) return "text";

  return "other";
};

/**
 * Modal that previews a note's file inline (PDF/image/txt natively,
 * Word/PowerPoint via Office's online viewer) so students can read it
 * without triggering a browser download.
 */
const NoteViewerModal = ({ open, onClose, url, fileName, fileType, title }) => {
  const [textContent, setTextContent] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState(null);

  const kind = getFileKind(fileName || "", fileType || "");

  useEffect(() => {
    if (!open) {
      setTextContent(null);
      setTextError(null);
      return;
    }
    if (kind === "text" && url) {
      setTextLoading(true);
      setTextError(null);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load file");
          return res.text();
        })
        .then((text) => setTextContent(text))
        .catch(() => setTextError("Unable to load a preview of this file."))
        .finally(() => setTextLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, url]);

  // Close on Escape for keyboard users
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-2 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl h-[88vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-slate-50 shrink-0">
          <h3 className="font-semibold text-gray-800 truncate pr-4">
            {title || fileName || "Preview"}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                title="Open in a new tab"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Open in tab</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-slate-100 overflow-auto min-h-0">
          {!url ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="animate-spin text-orange-500" />
              <p className="text-sm text-gray-400">Loading preview...</p>
            </div>
          ) : kind === "pdf" ? (
            <iframe
              src={url}
              title={fileName || "PDF preview"}
              className="w-full h-full border-0"
            />
          ) : kind === "image" ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={url}
                alt={fileName || "preview"}
                className="max-w-full max-h-full object-contain rounded-lg shadow"
              />
            </div>
          ) : kind === "office" ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              title={fileName || "Document preview"}
              className="w-full h-full border-0"
            />
          ) : kind === "text" ? (
            <div className="p-4 sm:p-6">
              {textLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-orange-500" />
                </div>
              ) : textError ? (
                <p className="text-sm text-gray-500">{textError}</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                  {textContent}
                </pre>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <FileWarning size={40} className="text-gray-300" />
              <p className="text-gray-500 text-sm">
                A preview isn't available for this file type.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
              >
                Open in a new tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteViewerModal;
