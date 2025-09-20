import { useState, useRef } from "react";

const thicknessOptions = ["3px", "5px", "8px", "12px"];

export default function ThicknessWheel({ selectedWidth, setSelectedWidth }) {
  const [angle, setAngle] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    setAngle(newAngle);

    // map angle (0–360) to thickness index
    const index = Math.round(((newAngle + 360) % 360) / (360 / thicknessOptions.length));
    setSelectedWidth(thicknessOptions[index % thicknessOptions.length]);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wheelRef}
        onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
        className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center relative cursor-pointer"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <div className="w-2 h-6 bg-black rounded absolute top-0" />
      </div>
      <span className="mt-2 text-sm font-medium">{selectedWidth}</span>
    </div>
  );
}
