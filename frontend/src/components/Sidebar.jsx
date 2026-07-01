import { useState } from "react";
import {
  Plus,
  MessageSquare,
  FileText,
  Megaphone,
  SearchCheck,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

/**
 * Sidebar — receives props for:
 *  - `activeCommunityId` (number | null) to highlight active category
 *  - `onCommunitySelect` (function) to filter the feed
 *  - `onCreatePost` (function) to open the Create Post modal
 *
 * Mobile toggle is handled via SidebarContext — the Navbar's hamburger
 * button is the single source of truth for opening/closing on small screens.
 */
const Sidebar = ({ activeCommunityId = null, onCommunitySelect, onCreatePost }) => {
  const [expandedSections, setExpandedSections] = useState({
    discussion: true,
    notes: true,
    announcements: true,
    lost_and_found: true,
  });
  // Shared mobile open state from context
  const { mobileOpen, closeSidebar } = useSidebar();

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Categories mapped to community IDs
  const categories = [
    {
      sectionKey: "discussion",
      label: "Discussion Forum",
      items: [
        { name: "Academics", slug: "academics" },
        { name: "Doubts", slug: "doubts" },
        { name: "Placements", slug: "placements" },
        { name: "Events", slug: "events" },
        { name: "Campus Life", slug: "campus-life" },
        { name: "Complain", slug: "complain" },
      ],
    },
    {
      sectionKey: "notes",
      label: "Notes",
      items: [{ name: "Notes", slug: "notes" }],
    },
    {
      sectionKey: "announcements",
      label: "Announcements",
      items: [{ name: "Announcements", slug: "announcements" }],
    },
    {
      sectionKey: "lost_and_found",
      label: "Lost and Found",
      items: [{ name: "Lost & Found", slug: "lost-and-found" }],
    },
  ];

  const handleItemClick = (slug) => {
    if (onCommunitySelect) onCommunitySelect(slug);
    closeSidebar();
  };

  const handleCreatePost = () => {
    if (onCreatePost) onCreatePost();
    closeSidebar();
  };

  return (
    <>
      {/* Overlay for mobile — blocks taps on content behind sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[45] md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg flex flex-col z-40
          transition-transform duration-300 ease-in-out
          w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* ── Brand + mobile close button ─────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-2xl font-bold text-orange-500">Unisphere</div>
            {/* Only visible on mobile as a close button inside the sidebar */}
            <button
              onClick={closeSidebar}
              className="md:hidden p-1 rounded-full hover:bg-gray-100 cursor-pointer text-gray-500"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Create Post Button ─────────────────────────────────────── */}
          <button
            onClick={handleCreatePost}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer mb-6"
          >
            <Plus size={18} />
            <span>Create Post</span>
          </button>

          {/* ── Category Sections ───────────────────────────────────────── */}
          <nav className="flex flex-col gap-1">
            {categories.map((section) => (
              <div key={section.sectionKey} className="mb-1">
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.sectionKey)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition cursor-pointer"
                >
                  {expandedSections[section.sectionKey] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <span>{section.label}</span>
                </button>

                {/* Section items */}
                {expandedSections[section.sectionKey] && (
                  <div className="flex flex-col gap-0.5 ml-1">
                    {section.items.map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => handleItemClick(item.slug)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition cursor-pointer ${
                          activeCommunityId === item.slug
                            ? "bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600"
                            : "text-gray-700 hover:bg-slate-100"
                        }`}
                      >
                        <CategoryIcon slug={item.slug} />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* ── Spacer ──────────────────────────────────────────────────── */}
          <div className="flex-1" />

          {/* ── Footer note ────────────────────────────────────────────── */}
          <div className="text-[10px] text-gray-300 text-center mt-4">
            &copy; UniSphere 2026
          </div>
        </div>
      </div>
    </>
  );
};

/** Small helper to pick an icon per category slug */
const CategoryIcon = ({ slug }) => {
  const icons = {
    academics: <FileText size={18} />,
    doubts: <MessageSquare size={18} />,
    placements: <MessageSquare size={18} />,
    events: <MessageSquare size={18} />,
    "campus-life": <MessageSquare size={18} />,
    notes: <FileText size={18} />,
    announcements: <Megaphone size={18} />,
    "lost-and-found": <SearchCheck size={18} />,
  };
  return icons[slug] || <MessageSquare size={18} />;
};

export default Sidebar;