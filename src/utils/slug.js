export const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
