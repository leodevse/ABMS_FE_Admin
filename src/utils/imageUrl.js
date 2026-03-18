const DEFAULT_MINIO_PUBLIC_BASE_URL =
  import.meta.env.VITE_MINIO_PUBLIC_BASE_URL || "http://localhost:9000";
const DEFAULT_MINIO_BUCKET =
  import.meta.env.VITE_MINIO_BUCKET || "building-management";

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

export function resolveImageUrl(url, options = {}) {
  if (!url) return null;

  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith("blob:")) return raw;

  const publicBase = trimTrailingSlash(
    options.publicBaseUrl || DEFAULT_MINIO_PUBLIC_BASE_URL
  );
  const bucket = options.bucket || DEFAULT_MINIO_BUCKET;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname === "minio") {
        const publicParsed = new URL(publicBase);
        parsed.protocol = publicParsed.protocol;
        parsed.hostname = publicParsed.hostname;
        parsed.port = publicParsed.port;
      }
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  const cleaned = raw.startsWith("/") ? raw.slice(1) : raw;
  if (cleaned.startsWith(`${bucket}/`)) {
    return `${publicBase}/${cleaned}`;
  }
  return `${publicBase}/${bucket}/${cleaned}`;
}

const splitCandidateUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",");
  return [];
};

export function extractMaintenanceImageUrls(request, resources = []) {
  const requestCandidates = [
    ...splitCandidateUrls(request?.images),
    ...splitCandidateUrls(request?.imageUrls),
    ...splitCandidateUrls(request?.attachments),
    ...splitCandidateUrls(request?.resources),
  ];

  const resourceCandidates = Array.isArray(resources)
    ? resources
        .filter((r) => {
          const type = String(r?.resourceType || "").toUpperCase();
          return !type || type === "IMAGE";
        })
        .map((r) => r?.url)
    : [];

  const normalized = [...requestCandidates, ...resourceCandidates]
    .map((candidate) => resolveImageUrl(candidate))
    .filter(Boolean);

  return [...new Set(normalized)];
}

const normalizeUploaderRole = (role) => {
  const upper = String(role || "").toUpperCase();
  if (upper === "STAFF") return "STAFF";
  if (upper === "RESIDENT") return "RESIDENT";
  return "UNKNOWN";
};

export function extractMaintenanceImagePreviews(request, resources = []) {
  const previews = [];

  if (Array.isArray(resources)) {
    resources.forEach((resource) => {
      const type = String(resource?.resourceType || "").toUpperCase();
      if (type && type !== "IMAGE") return;

      const resolvedUrl = resolveImageUrl(resource?.url);
      if (!resolvedUrl) return;

      previews.push({
        id: resource?.id || resolvedUrl,
        url: resolvedUrl,
        uploaderRole: normalizeUploaderRole(resource?.uploadedByRole),
        uploaderName: resource?.uploadedByName || null,
      });
    });
  }

  if (previews.length === 0) {
    extractMaintenanceImageUrls(request, resources).forEach((url) => {
      previews.push({
        id: url,
        url,
        uploaderRole: "UNKNOWN",
        uploaderName: null,
      });
    });
  }

  return previews;
}
