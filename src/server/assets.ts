import "server-only";

import { eq, inArray } from "drizzle-orm";
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

function storageRoot() {
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.STORAGE_LOCAL_PATH ?? "./data",
  );
}

export async function saveUploadedAsset(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("PNG、JPEG、WebPのみアップロードできます");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("アップロードできる画像は20MBまでです");
  }

  const id = crypto.randomUUID();
  const uploadDirectory = path.join(storageRoot(), "uploads");
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

export async function saveGeneratedAsset(input: {
  bytes: Buffer;
  mimeType: string;
  name: string;
}) {
  if (!ALLOWED_TYPES.has(input.mimeType)) {
    throw new Error(`未対応の生成画像形式です: ${input.mimeType}`);
  }

  const id = crypto.randomUUID();
  const generatedDirectory = path.join(storageRoot(), "generated");
  const filePath = path.join(
    generatedDirectory,
    `${id}${extensionFor(input.mimeType)}`,
  );
  await fs.mkdir(generatedDirectory, { recursive: true });
  await fs.writeFile(filePath, input.bytes);

  const createdAt = new Date().toISOString();
  getDb()
    .insert(assets)
    .values({
      id,
      name: input.name.slice(0, 240),
      mimeType: input.mimeType,
      path: filePath,
      size: input.bytes.byteLength,
      createdAt,
    })
    .run();

  return {
    id,
    name: input.name,
    mimeType: input.mimeType,
    size: input.bytes.byteLength,
    url: `/api/assets/${id}`,
    createdAt,
  };
}

export async function readAsset(id: string) {
  const asset = getDb().select().from(assets).where(eq(assets.id, id)).get();
  if (!asset) return null;

  return { ...asset, bytes: await fs.readFile(asset.path) };
}

export function getAssetRecords(ids: string[]) {
  if (!ids.length) return [];
  return getDb()
    .select()
    .from(assets)
    .where(inArray(assets.id, ids))
    .all();
}
