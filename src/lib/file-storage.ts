import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { getServerEnv } from "@/lib/env";

type LocalFile = {
  path: string;
  ownerId: string;
  contentType: string;
  filename: string;
  kind: "photos" | "resumes" | "posts";
};

const globalWithFiles = globalThis as typeof globalThis & {
  uniconnectLocalFiles?: Map<string, LocalFile>;
};

const localFiles = globalWithFiles.uniconnectLocalFiles ?? new Map<string, LocalFile>();
globalWithFiles.uniconnectLocalFiles = localFiles;

function extensionFor(filename: string) {
  return path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
}

export async function storeFile(options: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  ownerId: string;
  kind: "photos" | "resumes" | "posts";
}) {
  const env = getServerEnv();
  const id = randomUUID();

  if (env.STORAGE_MODE === "local") {
    const directory = path.join(process.cwd(), ".data", "uploads", options.ownerId);
    await mkdir(directory, { recursive: true });
    const filePath = path.join(directory, `${id}${extensionFor(options.filename)}`);
    await writeFile(filePath, options.buffer);
    localFiles.set(id, {
      path: filePath,
      ownerId: options.ownerId,
      contentType: options.contentType,
      filename: options.filename,
      kind: options.kind,
    });
    return `/api/files/${id}`;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  const result = await new Promise<{ public_id: string; resource_type: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `uniconnect/${options.kind}`,
          resource_type: options.kind === "resumes" ? "raw" : "image",
          type: "authenticated",
          public_id: id,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve(uploadResult);
        },
      );
      stream.end(options.buffer);
    },
  );

  const token = Buffer.from(`${result.resource_type}:${result.public_id}:${options.ownerId}:${options.kind}`).toString("base64url");
  return `/api/files/cloud/${token}`;
}

export async function readStoredFile(id: string, userId: string) {
  const file = localFiles.get(id);
  if (!file || (file.kind === "resumes" && file.ownerId !== userId)) return null;
  return { ...file, buffer: await readFile(file.path) };
}

export function getCloudinarySignedUrl(token: string, userId: string) {
  const env = getServerEnv();
  if (env.STORAGE_MODE !== "cloudinary") return null;

  try {
    const [resourceType, publicId, ownerId, kind] = Buffer.from(token, "base64url").toString("utf8").split(":", 4);
    if (!resourceType || !publicId || !ownerId || !kind) return null;
    if (kind === "resumes" && ownerId !== userId) return null;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: "authenticated",
      sign_url: true,
      secure: true,
    });
  } catch {
    return null;
  }
}
