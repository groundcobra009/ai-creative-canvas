import "server-only";

import { eq } from "drizzle-orm";
import { createDefaultScene } from "@/features/canvas/document";
import type { ProjectPayload, SceneDocument } from "@/features/canvas/types";
import { getDb } from "./db";
import { projects } from "./db/schema";

const DEFAULT_PROJECT_ID = "default";

export async function getDefaultProject(): Promise<ProjectPayload> {
  const db = getDb();
  const existing = db
    .select()
    .from(projects)
    .where(eq(projects.id, DEFAULT_PROJECT_ID))
    .get();

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      scene: JSON.parse(existing.sceneJson) as SceneDocument,
      updatedAt: existing.updatedAt,
    };
  }

  const scene = createDefaultScene();
  const timestamp = new Date().toISOString();
  db.insert(projects)
    .values({
      id: DEFAULT_PROJECT_ID,
      name: scene.projectName,
      sceneJson: JSON.stringify(scene),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  return { id: DEFAULT_PROJECT_ID, name: scene.projectName, scene, updatedAt: timestamp };
}

export async function saveDefaultProject(scene: SceneDocument): Promise<ProjectPayload> {
  const db = getDb();
  const timestamp = new Date().toISOString();
  const storedScene = { ...scene, updatedAt: timestamp };

  db.insert(projects)
    .values({
      id: DEFAULT_PROJECT_ID,
      name: storedScene.projectName,
      sceneJson: JSON.stringify(storedScene),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        name: storedScene.projectName,
        sceneJson: JSON.stringify(storedScene),
        updatedAt: timestamp,
      },
    })
    .run();

  return {
    id: DEFAULT_PROJECT_ID,
    name: storedScene.projectName,
    scene: storedScene,
    updatedAt: timestamp,
  };
}
