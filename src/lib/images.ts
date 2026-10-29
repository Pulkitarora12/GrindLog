// Client-safe helpers for working with Cloudinary delivery URLs.

/** Insert a Cloudinary transformation into a delivery URL (e.g. "w_400,c_fill"). */
export function cloudinaryTransform(url: string, transformation: string): string {
  return url.replace("/upload/", `/upload/${transformation}/`);
}

export const thumbUrl = (url: string) =>
  cloudinaryTransform(url, "w_240,h_180,c_fill,f_auto,q_auto");

export const fullUrl = (url: string) => cloudinaryTransform(url, "f_auto,q_auto");

/** Downscale a photo in the browser to keep Cloudinary storage small. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}
