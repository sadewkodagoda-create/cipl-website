import { Upload } from "tus-js-client";
import {
  resumableStorageEndpoint,
  supabase,
  supabasePublishableKey,
} from "./supabase";

export const MODEL_BUCKET = "construction-models";
export const MAX_GLB_BYTES = 500 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const STANDARD_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isGlbFile(file) {
  return Boolean(file && file.name.toLowerCase().endsWith(".glb"));
}

async function validateGlbFile(file) {
  const header = new DataView(await file.slice(0, 12).arrayBuffer());
  const hasGlbMagic =
    header.byteLength === 12 && header.getUint32(0, true) === 0x46546c67;
  const version = header.byteLength === 12 ? header.getUint32(4, true) : 0;
  const declaredLength =
    header.byteLength === 12 ? header.getUint32(8, true) : 0;

  if (!hasGlbMagic || version !== 2 || declaredLength !== file.size) {
    throw new Error(
      "This file is not a complete GLB 2.0 model. Export it again as Binary glTF (.glb).",
    );
  }
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return "0 MB";
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
}

export function safeStorageFileName(name) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function validatePdfFile(file) {
  if (!file) return;
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  ) {
    throw new Error("Choose a valid PDF document.");
  }
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error("The PDF must be smaller than 10 MB.");
}

export function validatePhotoFile(file) {
  if (!file) return;
  if (!PHOTO_TYPES.has(file.type))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error("Each photo must be smaller than 10 MB.");
}

export async function signModelUpdates(updates, expiresIn = 3600) {
  if (!updates.length) return [];
  const paths = updates.map((update) => update.model_path);
  const { data, error } = await supabase.storage
    .from(MODEL_BUCKET)
    .createSignedUrls(paths, expiresIn);
  if (error) throw error;
  return updates.map((update, index) => ({
    ...update,
    modelUrl: data?.[index]?.signedUrl || null,
  }));
}

export async function uploadGlbResumable({
  file,
  authUserId,
  clientId,
  onProgress,
}) {
  if (!isGlbFile(file)) throw new Error("Choose a .glb 3D model file.");
  if (file.size > MAX_GLB_BYTES) {
    throw new Error("The GLB file must be smaller than 500 MB.");
  }
  await validateGlbFile(file);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token)
    throw new Error("Your admin session has expired.");

  const objectPath = `${authUserId}/${clientId}/${Date.now()}-${safeStorageFileName(file.name)}`;

  // Standard uploads are simpler and more portable for everyday GLBs. Keep TUS
  // for large files so uploads remain resumable on slow site connections.
  if (file.size <= STANDARD_UPLOAD_MAX_BYTES) {
    const { error } = await supabase.storage
      .from(MODEL_BUCKET)
      .upload(objectPath, file, {
        cacheControl: "3600",
        contentType: "model/gltf-binary",
        upsert: false,
      });
    if (error) throw error;
    onProgress?.(100);
    return objectPath;
  }

  await new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: resumableStorageEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: supabasePublishableKey,
        "x-upsert": "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: MODEL_BUCKET,
        objectName: objectPath,
        contentType: "model/gltf-binary",
        cacheControl: "3600",
        metadata: JSON.stringify({ clientId, originalName: file.name }),
      },
      onError: reject,
      onProgress: (uploaded, total) => {
        onProgress?.(total ? Math.round((uploaded / total) * 100) : 0);
      },
      onSuccess: resolve,
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length)
          upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });

  return objectPath;
}
