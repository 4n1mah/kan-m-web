const CLOUDINARY_HOST = "res.cloudinary.com";

export function isAllowedCloudinaryImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== CLOUDINARY_HOST) return false;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 4) return false;
    // Fail closed: if env var is missing, reject all URLs rather than accept any cloud
    if (!cloudName || parts[0] !== cloudName) return false;
    return parts[1] === "image" && parts[2] === "upload";
  } catch {
    return false;
  }
}

// All product images go through Cloudinary — no legacy /uploads/ paths accepted.
export function isAllowedStoredImageUrl(value: string): boolean {
  return isAllowedCloudinaryImageUrl(value);
}
