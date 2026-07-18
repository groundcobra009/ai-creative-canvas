import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sceneJson: text("scene_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  createdAt: text("created_at").notNull(),
});
