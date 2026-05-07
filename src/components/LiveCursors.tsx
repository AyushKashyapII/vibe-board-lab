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
            <div className="w-3.5 h-3.5 bg-primary rounded-full border-2 border-background shadow-sm" />
            <div className="mt-1 inline-flex max-w-[180px] items-center rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm ring-1 ring-border backdrop-blur">
              <span className="truncate">{userName || "Anonymous"}</span>
            </div>
          </motion.div>
        );
      })}
    </>
  );
};

export default LiveCursors;
