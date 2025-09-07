import { motion } from "framer-motion";
import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

export interface BoardItemData {
  id: string;
  type: "note" | "image";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: "yellow" | "pink" | "blue" | "green" | "orange";
}

interface BoardItemProps {
  item: BoardItemData;
  onUpdate: (id: string, updates: Partial<BoardItemData>) => void;
  onDelete: (id: string) => void;
  viewport: { x: number; y: number; scale: number };
  // scale prop removed: we map sizes/positions into DOM coords ourselves
}

const BoardItem = ({ item, onUpdate, onDelete, viewport }: BoardItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setContent(item.content), [item.content]);



  // convert canvas -> DOM
  const domX = Math.round(viewport.x + item.x * viewport.scale);
  const domY = Math.round(viewport.y + item.y * viewport.scale);
  const domW = Math.max(20, Math.round(item.width * viewport.scale));
  const domH = Math.max(20, Math.round(item.height * viewport.scale));

  // convert DOM -> canvas
  const domToCanvasXY = (domLeft: number, domTop: number) => {
    return {
      x: (domLeft - viewport.x) / viewport.scale,
      y: (domTop - viewport.y) / viewport.scale
    };
  };

  const domToCanvasSize = (domW: number, domH: number) => {
    return {
      width: Math.max(40, domW / viewport.scale),
      height: Math.max(40, domH / viewport.scale)
    };
  };

  const handleContentSave = () => {
    onUpdate(item.id, { content });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) handleContentSave();
    if (e.key === "Escape") { setContent(item.content); setIsEditing(false); }
  };

  const noteColorClasses = {
    yellow: "bg-note-yellow text-note-yellow-foreground",
    pink: "bg-note-pink text-note-pink-foreground",
    blue: "bg-note-blue text-note-blue-foreground",
    green: "bg-note-green text-note-green-foreground",
    orange: "bg-note-orange text-note-orange-foreground",
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onUpdate(item.id, { content: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18 }}
      // make sure the motion wrapper doesn't intercept pointer events; the inner Rnd will.
      style={{ pointerEvents: "none", position: "absolute", left: domX, top: domY, width: domW, height: domH }}
    >
      <Rnd
        // Rnd is positioned/sized in DOM coords (container-relative)
        position={{ x: domX, y: domY }}
        size={{ width: domW, height: domH }}
        bounds="parent"
        enableResizing
        disableDragging={isEditing}
        dragHandleClassName="drag-handle"
        onDragStop={(_e, d) => {
          const canvasPos = domToCanvasXY(d.x, d.y);
          onUpdate(item.id, { x: canvasPos.x, y: canvasPos.y });
        }}
        onResizeStop={(_e, _direction, ref, _delta, position) => {
          const newSize = domToCanvasSize(parseInt(ref.style.width, 10), parseInt(ref.style.height, 10));
          const canvasPos = domToCanvasXY(position.x, position.y);
          onUpdate(item.id, {
            width: Math.round(newSize.width),
            height: Math.round(newSize.height),
            x: canvasPos.x,
            y: canvasPos.y,
          });
        }}
        minWidth={120}
        minHeight={80}
        className="group"
        // make Rnd receive events
        style={{ pointerEvents: "auto", touchAction: "none", zIndex: 50 }}
        enableUserSelectHack={false}
      >
        <div
          className={cn(
            "w-full h-full rounded-lg shadow-soft transition-all duration-200 border border-border/20 relative overflow-hidden drag-handle",
            item.type === "note" && noteColorClasses[item.color || "yellow"],
            item.type === "image" && "bg-card",
            isEditing && "cursor-text"
          )}
          // prevent container panning when interacting with content
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground z-20"
          >
            <X className="h-3 w-3" />
          </Button>

          {item.type === "note" && (
            <div className="p-3 h-full">
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleContentSave}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full resize-none bg-transparent border-none outline-none text-sm placeholder:text-current/60 cursor-text"
                  placeholder="Type your note here..."
                  autoFocus
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  onClick={() => setIsEditing(true)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full h-full cursor-text text-sm overflow-hidden"
                >
                  {content || "Click to edit"}
                </div>
              )}
            </div>
          )}

          {item.type === "image" && (
            <div className="flex items-center justify-center h-full">
              {item.content ? (
                <img
                  src={item.content}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Rnd>
    </motion.div>
  );
};

export default BoardItem;
