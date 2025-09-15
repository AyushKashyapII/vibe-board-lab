import React from "react";
import { motion } from "framer-motion";

type CursorData = { userName: string; x: number; y: number };

interface LiveCursorsProps {
  cursors: Record<string, CursorData>;
  canvasToDom: (x: number, y: number) => { x: number; y: number };
  currentUserId: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

const LiveCursors: React.FC<LiveCursorsProps> = ({
  cursors,
  canvasToDom,
  currentUserId,
  containerRef,
}) => {
  return (
    <>
      {Object.entries(cursors).map(([id, { userName, x, y }]) => {
        if (id === currentUserId) return null;
        const { x: domX, y: domY } = canvasToDom(x, y);

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0 }}
            animate={{ x: domX, y: domY, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute z-50"
            style={{ pointerEvents: "none" }}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow" />
            <div className="text-xs text-blue-700 font-medium">{userName}</div>
          </motion.div>
        );
      })}
    </>
  );
};

export default LiveCursors;
