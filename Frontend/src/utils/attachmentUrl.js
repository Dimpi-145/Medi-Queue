const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const resolveAttachmentUrl = (url) => {
  if (!url) {
    return "";
  }

  const value = String(url);

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  return `${BACKEND_URL}${value.startsWith("/") ? value : `/${value}`}`;
};