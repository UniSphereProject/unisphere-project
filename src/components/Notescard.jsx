import { useState } from "react";
import { Download, File, Loader2, Eye, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "react-toastify";
import API from "../utils/api";
import { setNoteVerified } from "../utils/roleApi";


const Notescard = (props) => {
  const [downloading, setDownloading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ── Toggle teacher/moderator verification on this note ──────────────
  const handleToggleVerify = async () => {
    if (!props.id || verifying) return;
    const nextValue = !props.verified;
    setVerifying(true);
    try {
      await setNoteVerified(props.id, nextValue);
      props.onVerifyChange?.(props.id, nextValue);
      toast.success(nextValue ? "Note marked as verified" : "Verification removed");
    } catch (err) {
      console.error("Verify toggle failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(detail || "Unable to update verification status.");
    } finally {
      setVerifying(false);
    }
  };

  // ── Robust file download using fetch + Blob ────────────────────────
  const handleDownload = async () => {
    if (!props.id || downloading) return;
    setDownloading(true);
    try {
      const res = await API.get(`/posts/${props.id}/view-url?type=file`);
      const url = res.data?.url;
      if (!url) {
        toast.error("Download URL not available. Please try again.");
        return;
      }
      // Fetch the file and trigger a real browser download
      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error("Failed to fetch file");
      const blob = await fileRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      if (props.fileName) link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      const detail = err.response?.data?.detail;
      toast.error(
        detail ||
          "Download failed. The file may have been removed or is unavailable."
      );
    } finally {
      setDownloading(false);
    }
  };

  
 const handleView = async () => {
  if (!props.id || viewing) return;
  setViewing(true);
  try {
    const res = await API.get(`/posts/${props.id}/view-url?type=file`);
    const url = res.data?.url;
    if (!url) {
      toast.error("File not available");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error("View failed:", err);
    const detail = err.response?.data?.detail;
    toast.error(
      detail || "Unable to open file. Please try again."
    );
  } finally {
    setViewing(false);
  }
};

  

  return (
    <div className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 p-3">
      <span className="inline-flex items-center gap-1 px-1 rounded-md bg-slate-50 hover:bg-slate-100 transition float-right text-xs text-slate-500">
        {props.date}
      </span>

      {props.thumbnail ? (
        <img
          src={props.thumbnail}
          alt={props.title}
          className="w-full h-40 object-cover rounded-md"
        />
      ) : (
        <div className="w-full h-40 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500">
          <File size={70} />
        </div>
      )}

      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
          {props.title}
        </h2>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition">
            {props.poster}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition">
            {props.batch}
          </span>

          {props.verified && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 font-medium"
              title="Verified by a teacher/moderator"
            >
              <ShieldCheck size={13} />
              Verified
            </span>
          )}
        </div>

        <hr className="my-2 border-gray-200" />

        {/* Action buttons: View + Download */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
  onClick={handleView}
  disabled={viewing || !props.id}
  className="flex items-center justify-center gap-2 flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
>
  {viewing ? (
    <Loader2 size={18} className="animate-spin text-orange-300" />
  ) : (
    <Eye size={18} className="text-orange-300" />
  )}
  <span className="text-sm font-medium">
    {viewing ? "Loading..." : "View"}
  </span>
</button>
           
          <button
            onClick={handleDownload}
            disabled={downloading || !props.id}
            className="flex items-center justify-center gap-2 flex-1 bg-black text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation"
          >
            {downloading ? (
              <Loader2 size={18} className="animate-spin text-orange-400" />
            ) : (
              <Download size={18} className="text-orange-400" />
            )}
            <span className="text-sm font-medium">
              {downloading ? "Fetching..." : "Download"}
            </span>
          </button>
        </div>

        {/* Teacher/Moderator only: toggle verification */}
        {props.canVerify && (
          <button
            onClick={handleToggleVerify}
            disabled={verifying || !props.id}
            className={`flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation text-sm font-medium ${
              props.verified
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            }`}
          >
            {verifying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : props.verified ? (
              <ShieldOff size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            <span>
              {verifying
                ? "Updating..."
                : props.verified
                ? "Remove Verification"
                : "Mark as Verified"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Notescard;
