"use client";

import { create } from "zustand";
import {
  addSceneElement,
  cloneScene,
  createDefaultScene,
  removeSceneElement,
  renameProject,
  reorderSceneElement,
  updateSceneElement,
} from "./document";
import type { CanvasElement, SceneDocument } from "./types";

const HISTORY_LIMIT = 60;

type EditorState = {
  scene: SceneDocument;
  past: SceneDocument[];
  future: SceneDocument[];
  selectedId: string | null;
  hydrated: boolean;
  dirty: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  loadScene: (scene: SceneDocument) => void;
  select: (id: string | null) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  reorderSelected: (direction: "forward" | "backward") => void;
  setProjectName: (name: string) => void;
  undo: () => void;
  redo: () => void;
  setSaveState: (state: EditorState["saveState"]) => void;
  markSaved: () => void;
};

function commit(
  state: Pick<EditorState, "scene" | "past">,
  nextScene: SceneDocument,
) {
  if (nextScene === state.scene) {
    return {};
  }

  return {
    scene: nextScene,
    past: [...state.past.slice(-(HISTORY_LIMIT - 1)), cloneScene(state.scene)],
    future: [],
    dirty: true,
    saveState: "idle" as const,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: createDefaultScene(),
  past: [],
  future: [],
  selectedId: null,
  hydrated: false,
  dirty: false,
  saveState: "idle",

  loadScene: (scene) =>
    set({
      scene: cloneScene(scene),
      past: [],
      future: [],
      selectedId: null,
      hydrated: true,
      dirty: false,
      saveState: "saved",
    }),
  select: (selectedId) => set({ selectedId }),
  addElement: (element) =>
    set((state) => ({
      ...commit(state, addSceneElement(state.scene, element)),
      selectedId: element.id,
    })),
  updateElement: (id, patch) =>
    set((state) => commit(state, updateSceneElement(state.scene, id, patch))),
  removeSelected: () => {
    const { selectedId } = get();
    if (!selectedId) return;
    set((state) => ({
      ...commit(state, removeSceneElement(state.scene, selectedId)),
      selectedId: null,
    }));
  },
  duplicateSelected: () => {
    const { scene, selectedId } = get();
    const source = scene.elements.find((element) => element.id === selectedId);
    if (!source) return;
    const copy = {
      ...cloneScene({ ...scene, elements: [source] }).elements[0],
      id: crypto.randomUUID(),
      name: `${source.name} コピー`,
      x: source.x + 28,
      y: source.y + 28,
    } as CanvasElement;
    get().addElement(copy);
  },
  reorderSelected: (direction) => {
    const selectedId = get().selectedId;
    if (!selectedId) return;
    set((state) => commit(state, reorderSceneElement(state.scene, selectedId, direction)));
  },
  setProjectName: (name) =>
    set((state) => commit(state, renameProject(state.scene, name))),
  undo: () =>
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        scene: cloneScene(previous),
        past: state.past.slice(0, -1),
        future: [cloneScene(state.scene), ...state.future].slice(0, HISTORY_LIMIT),
        dirty: true,
        saveState: "idle",
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        scene: cloneScene(next),
        past: [...state.past, cloneScene(state.scene)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        dirty: true,
        saveState: "idle",
      };
    }),
  setSaveState: (saveState) => set({ saveState }),
  markSaved: () => set({ dirty: false, saveState: "saved" }),
}));
