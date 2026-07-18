"use client";

import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import { useEditorStore } from "@/features/canvas/store";
import type { CanvasElement, ImageElement } from "@/features/canvas/types";

export type CanvasExporter = (options: {
  mimeType: "image/png" | "image/jpeg";
  quality?: number;
}) => string | null;

type CanvasStageProps = {
  registerExporter: (exporter: CanvasExporter | null) => void;
};

type ElementInteractionProps = {
  onClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap: (event: Konva.KonvaEventObject<TouchEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (event: Konva.KonvaEventObject<Event>) => void;
};

function CanvasImage({
  element,
  interactionProps,
}: {
  element: ImageElement;
  interactionProps: ElementInteractionProps;
}) {
  const [image] = useImage(element.src, "anonymous");
  return (
    <KonvaImage
      image={image}
      {...sharedNodeProps(element)}
      {...interactionProps}
    />
  );
}

function sharedNodeProps(element: CanvasElement) {
  return {
    id: element.id,
    name: "canvas-element",
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    visible: element.visible,
    draggable: !element.locked,
  };
}

export function CanvasStage({ registerExporter }: CanvasStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const artboardRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const scene = useEditorStore((state) => state.scene);
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);
  const updateElement = useEditorStore((state) => state.updateElement);
  const [size, setSize] = useState({ width: 900, height: 620 });
  const [scale, setScale] = useState(0.64);
  const [position, setPosition] = useState({ x: 64, y: 64 });

  const selectedElement = useMemo(
    () => scene.elements.find((element) => element.id === selectedId),
    [scene.elements, selectedId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = selectedId ? stage.findOne(`#${selectedId}`) : null;
    transformer.nodes(node && !selectedElement?.locked ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedElement?.locked, selectedId]);

  useEffect(() => {
    registerExporter(({ mimeType, quality }) => {
      const artboard = artboardRef.current;
      if (!artboard) return null;
      return artboard.toDataURL({
        x: 0,
        y: 0,
        width: scene.artboard.width,
        height: scene.artboard.height,
        pixelRatio: 1,
        mimeType,
        quality,
      });
    });
    return () => registerExporter(null);
  }, [registerExporter, scene.artboard.height, scene.artboard.width]);

  const finishTransform = (
    element: CanvasElement,
    event: Konva.KonvaEventObject<Event>,
  ) => {
    const node = event.target;
    const nextWidth = Math.max(10, node.width() * node.scaleX());
    const nextHeight = Math.max(10, node.height() * node.scaleY());
    node.scaleX(1);
    node.scaleY(1);
    updateElement(node.id(), {
      x: element.type === "ellipse" ? node.x() - nextWidth / 2 : node.x(),
      y: element.type === "ellipse" ? node.y() - nextHeight / 2 : node.y(),
      width: nextWidth,
      height: nextHeight,
      rotation: node.rotation(),
    });
  };

  const renderElement = (element: CanvasElement) => {
    const interactionProps = {
      onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
        event.cancelBubble = true;
        select(element.id);
      },
      onTap: (event: Konva.KonvaEventObject<TouchEvent>) => {
        event.cancelBubble = true;
        select(element.id);
      },
      onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
        updateElement(element.id, {
          x: element.type === "ellipse" ? event.target.x() - element.width / 2 : event.target.x(),
          y: element.type === "ellipse" ? event.target.y() - element.height / 2 : event.target.y(),
        }),
      onTransformEnd: (event: Konva.KonvaEventObject<Event>) => finishTransform(element, event),
    };

    if (element.type === "text") {
      return (
        <Text
          key={element.id}
          {...sharedNodeProps(element)}
          {...interactionProps}
          text={element.text}
          fontSize={element.fontSize}
          fontFamily={element.fontFamily}
          fontStyle={element.fontStyle}
          fill={element.fill}
          align={element.align}
          lineHeight={element.lineHeight}
          verticalAlign="middle"
          wrap="word"
        />
      );
    }

    if (element.type === "image") {
      return (
        <CanvasImage
          key={element.id}
          element={element}
          interactionProps={interactionProps}
        />
      );
    }

    if (element.type === "ellipse") {
      return (
        <Ellipse
          key={element.id}
          {...sharedNodeProps(element)}
          {...interactionProps}
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
          width={undefined}
          height={undefined}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }

    return (
      <Rect
        key={element.id}
        {...sharedNodeProps(element)}
        {...interactionProps}
        fill={element.fill}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        cornerRadius={element.cornerRadius}
      />
    );
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const point = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScale = Math.min(2, Math.max(0.25, scale * (direction > 0 ? 1.08 : 1 / 1.08)));
    setScale(nextScale);
    setPosition({
      x: pointer.x - point.x * nextScale,
      y: pointer.y - point.y * nextScale,
    });
  };

  return (
    <div ref={containerRef} className="canvas-stage-shell" aria-label="デザインキャンバス">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragEnd={(event) => setPosition({ x: event.target.x(), y: event.target.y() })}
        onWheel={handleWheel}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) select(null);
        }}
      >
        <Layer>
          <Group ref={artboardRef} clipWidth={scene.artboard.width} clipHeight={scene.artboard.height}>
            <Rect
              x={0}
              y={0}
              width={scene.artboard.width}
              height={scene.artboard.height}
              fill={scene.artboard.background}
              shadowColor="#122033"
              shadowBlur={32}
              shadowOpacity={0.14}
              shadowOffsetY={12}
              onClick={() => select(null)}
            />
            {scene.elements.map(renderElement)}
          </Group>
          {scene.variants?.length ? (
            <>
              <Rect
                x={64}
                y={48}
                width={1152}
                height={574}
                stroke="#6657d9"
                strokeWidth={2}
                dash={[10, 8]}
                opacity={0.5}
                listening={false}
              />
              <Text
                x={76}
                y={56}
                text="SAFE AREA"
                fontSize={14}
                fontStyle="bold"
                fill="#6657d9"
                opacity={0.7}
                listening={false}
              />
            </>
          ) : null}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            flipEnabled={false}
            keepRatio={selectedElement?.type === "image"}
            borderStroke="#5b5bd6"
            anchorFill="#ffffff"
            anchorStroke="#5b5bd6"
            anchorSize={12}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
      <div className="canvas-zoom-pill">{Math.round(scale * 100)}%</div>
    </div>
  );
}
