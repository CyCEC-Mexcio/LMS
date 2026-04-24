/**
 * Utility for transforming cloud storage sharing URLs into direct embeddable image URLs.
 *
 * Supports:
 * - Google Drive share links → thumbnail endpoint (reliable, works in <img> tags)
 * - OneDrive/SharePoint share links → download URL (with user guidance)
 * - Regular URLs pass through unchanged
 *
 * NOTE: Google deprecated the old `uc?export=view` method — it now shows a
 * virus-scan interstitial page for most files. The `thumbnail?id=...&sz=w{SIZE}`
 * endpoint is the current reliable method for embedding Drive images.
 */

export type TransformResult = {
  url: string;
  transformed: boolean;
  provider: "google_drive" | "onedrive" | "direct";
  warning?: string;
};

/**
 * Extracts a Google Drive file ID from various URL formats.
 * Returns null if no ID can be extracted.
 */
function extractGoogleDriveFileId(url: string): string | null {
  // Pattern: /file/d/{FILE_ID}/
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // Pattern: /open?id={FILE_ID}
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // Pattern: ?id={FILE_ID} or &id={FILE_ID} (generic query param)
  const idParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) return idParam[1];

  return null;
}

/**
 * Builds a Google Drive thumbnail URL from a file ID.
 * sz=w1280 requests a 1280px wide image — high quality for course thumbnails.
 */
function buildGoogleDriveThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;
}

/**
 * Transforms a Google Drive or OneDrive sharing URL into a direct embeddable image URL.
 * Regular URLs pass through unchanged.
 */
export function transformImageUrl(rawUrl: string): TransformResult {
  const url = rawUrl.trim();

  // --- Google Drive ---
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    // Already using the thumbnail endpoint — pass through
    if (url.includes("drive.google.com/thumbnail")) {
      return {
        url,
        transformed: false,
        provider: "google_drive",
      };
    }

    // Already using lh3.googleusercontent.com — pass through
    if (url.includes("lh3.googleusercontent.com")) {
      return {
        url,
        transformed: false,
        provider: "google_drive",
      };
    }

    // Old uc?export=view format — re-transform to thumbnail (it's broken now)
    if (url.includes("drive.google.com/uc")) {
      const idFromUc = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idFromUc) {
        return {
          url: buildGoogleDriveThumbnailUrl(idFromUc[1]),
          transformed: true,
          provider: "google_drive",
          warning:
            "Enlace de Google Drive convertido. Asegúrate de que el archivo sea público.",
        };
      }
    }

    // Extract file ID from any other Drive URL pattern
    const fileId = extractGoogleDriveFileId(url);
    if (fileId) {
      return {
        url: buildGoogleDriveThumbnailUrl(fileId),
        transformed: true,
        provider: "google_drive",
        warning:
          "Enlace de Google Drive convertido. Asegúrate de que el archivo sea público.",
      };
    }

    // Can't extract ID — warn the user
    return {
      url,
      transformed: false,
      provider: "google_drive",
      warning:
        "No se pudo extraer el ID del archivo de Google Drive. Usa un enlace de tipo: drive.google.com/file/d/{ID}/view",
    };
  }

  // --- lh3.googleusercontent.com (already direct) ---
  if (url.includes("lh3.googleusercontent.com")) {
    return {
      url,
      transformed: false,
      provider: "google_drive",
    };
  }

  // --- OneDrive / SharePoint ---
  if (
    url.includes("1drv.ms") ||
    url.includes("onedrive.live.com") ||
    url.includes("sharepoint.com")
  ) {
    // OneDrive embed links that end with ?... can sometimes work
    if (url.includes("onedrive.live.com/embed")) {
      return {
        url,
        transformed: false,
        provider: "onedrive",
        warning:
          "Usando enlace de inserción de OneDrive. Asegúrate de que el archivo sea público.",
      };
    }

    // SharePoint direct download format: append download=1
    if (url.includes("sharepoint.com")) {
      const downloadUrl = url.includes("?")
        ? `${url}&download=1`
        : `${url}?download=1`;

      return {
        url: downloadUrl,
        transformed: true,
        provider: "onedrive",
        warning:
          "Enlace de SharePoint convertido. Si la imagen no carga, usa la opción 'Insertar' (Embed) en OneDrive para obtener un enlace directo, o descarga la imagen y súbela directamente.",
      };
    }

    // 1drv.ms short links — use Microsoft's base64 API method
    if (url.includes("1drv.ms")) {
      try {
        const base64 = btoa(url)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const directUrl = `https://api.onedrive.com/v1.0/shares/u!${base64}/root/content`;

        return {
          url: directUrl,
          transformed: true,
          provider: "onedrive",
          warning:
            "Enlace corto de OneDrive convertido. Asegúrate de que el archivo sea público o accesible sin inicio de sesión.",
        };
      } catch {
        return {
          url,
          transformed: false,
          provider: "onedrive",
          warning:
            "No se pudo convertir el enlace corto de OneDrive. Descarga la imagen y súbela directamente.",
        };
      }
    }

    // Generic onedrive.live.com link
    return {
      url,
      transformed: false,
      provider: "onedrive",
      warning:
        "Los enlaces de OneDrive no siempre funcionan como imágenes. Usa la opción 'Insertar' en OneDrive o descarga la imagen y súbela directamente.",
    };
  }

  // --- Direct URL (no transformation needed) ---
  return {
    url,
    transformed: false,
    provider: "direct",
  };
}
