import API from "./api";

/**
 * Fetch all root communities and build a slug→id lookup map.
 * Cached for the session.
 */
let _communityCache = null;

export const fetchCommunityMap = async () => {
  if (_communityCache) return _communityCache;

  try {
    const res = await API.get("/communities", { params: { only_roots: true } });
    const list = res.data || [];
    const map = {};
    list.forEach((c) => {
      map[c.slug] = c.id;
    });
    _communityCache = map;
    return map;
  } catch {
    return {};
  }
};

/**
 * Resolve a community slug to its ID (using cache or API).
 * Returns null if not found.
 */
export const resolveCommunitySlug = async (slug) => {
  const map = await fetchCommunityMap();
  return map[slug] ?? null;
};

/**
 * Invalidate the community cache (e.g., after creating a new community).
 */
export const invalidateCommunityCache = () => {
  _communityCache = null;
};
