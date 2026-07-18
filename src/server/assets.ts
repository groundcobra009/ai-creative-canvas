import "server-only";

import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { getDb } from "./db";
import { assets } from "./db/schema";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function extensionFor(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  return ".jpg";
}

export async function saveUploadedAsset(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("PNG、JPEG、WebPのみアップロードできます");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("アップロードできる画像は20MBまでです");
  }

  const id = crypto.randomUUID();
  const storageRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.STORAGE_LOCAL_PATH ?? "./data",
  );
  const uploadDirectory = path.join(storageRoot, "uploads");
  const filePath = path.join(uploadDirectory, `${id}${extensionFor(file.type)}`);
  await fs.mkdir(uploadDirectory, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const createdAt = new Date().toISOString();
  getDb().insert(assets)
    .values({
      id,
      name: file.name.slice(0, 240),
      mimeType: file.type,
      path: filePath,
      size: file.size,
      createdAt,
    })
    .run();

  return {
    id,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    url: `/api/assets/${id}`,
    createdAt,
  };
}

export async function readAsset(id: string) {
  const asset = getDb().select().from(assets).where(eq(assets.id, id)).get();
  if (!asset) return null;

  return { ...asset, bytes: await fs.readFile(asset.path) };
}
