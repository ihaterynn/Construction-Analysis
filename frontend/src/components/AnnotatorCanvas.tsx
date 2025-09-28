"use client";

import { useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

interface Props {
  width: number;
  height: number;
  onBoxesChange?: (boxes: any[]) => void;
}

export default function AnnotatorCanvas({ width, height, onBoxesChange }: Props) {
  const [boxes, setBoxes] = useState<any[]>([]);
  const stageRef = useRef<any>(null);
  const [newBox, setNewBox] = useState<any>(null);

  const handleMouseDown = (e: any) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!newBox) return;
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewBox({ ...newBox, width: x - newBox.x, height: y - newBox.y });
  };

  const handleMouseUp = () => {
    if (newBox) {
      const updated = [...boxes, newBox];
      setBoxes(updated);
      onBoxesChange && onBoxesChange(updated);
    }
    setNewBox(null);
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      ref={stageRef}
    >
      <Layer>
        {boxes.map((b, i) => <Rect key={i} {...b} stroke="red" />)}
        {newBox && <Rect {...newBox} stroke="blue" />}
      </Layer>
    </Stage>
  );
}
