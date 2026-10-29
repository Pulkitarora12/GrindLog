import { createHash } from "crypto";

const FOLDER = "grindlog";

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

function sign(params: Record<string, string | number>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export function isCloudinaryConfigured() {
  return getConfig() !== null;
}

/** Signed parameters so the browser can upload straight to Cloudinary. */
export function createUploadSignature() {
  const config = getConfig();
  if (!config) {
    throw new Error("Image upload is not configured yet (missing Cloudinary env vars).");
  }
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ folder: FOLDER, timestamp }, config.apiSecret);
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: FOLDER,
    timestamp,
    signature,
  };
}

/** Best-effort removal of images from Cloudinary. */
export async function destroyImages(publicIds: string[]) {
  const config = getConfig();
  if (!config) return;
  await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const body = new URLSearchParams({
          public_id: publicId,
          timestamp: String(timestamp),
          api_key: config.apiKey,
          signature: sign({ public_id: publicId, timestamp }, config.apiSecret),
        });
        await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
          method: "POST",
          body,
        });
      } catch (error) {
        console.error("Failed to delete Cloudinary image:", publicId, error);
      }
    })
  );
}
