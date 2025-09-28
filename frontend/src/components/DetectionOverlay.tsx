"use client";

interface Props {
  boxes: { x: number; y: number; w: number; h: number }[];
}

export default function DetectionOverlay({ boxes }: Props) {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {boxes.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}px`,
            top: `${b.y}px`,
            width: `${b.w}px`,
            height: `${b.h}px`,
            border: "2px solid lime",
          }}
        />
      ))}
    </div>
  );
}
