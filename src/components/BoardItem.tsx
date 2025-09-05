import { motion } from "framer-motion";
import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
  scale: number;
}

const BoardItem = ({ item, onUpdate, onDelete, scale }: BoardItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.content);

  useEffect(() => {
    setContent(item.content);
  }, [item.content]);

  const handleContentSave = () => {
    onUpdate(item.id, { content });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleContentSave();
    } else if (e.key === 'Escape') {
      setContent(item.content);
      setIsEditing(false);
    }
  };

  const noteColorClasses = {
    yellow: "bg-note-yellow text-note-yellow-foreground",
    pink: "bg-note-pink text-note-pink-foreground", 
    blue: "bg-note-blue text-note-blue-foreground",
    green: "bg-note-green text-note-green-foreground",
    orange: "bg-note-orange text-note-orange-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Rnd
        size={{ width: item.width, height: item.height }}
        position={{ x: item.x, y: item.y }}
        onDragStop={(e, d) => {
          onUpdate(item.id, { x: d.x, y: d.y });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          onUpdate(item.id, {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
            x: position.x,
            y: position.y,
          });
        }}
        minWidth={120}
        minHeight={80}
        bounds="window"
        enableResizing={true}
        disableDragging={isEditing}
        dragHandleClassName="drag-handle"
        className="group"
        style={{ cursor: isEditing ? 'text' : 'move' }}
      >
        <div 
          className={cn(
            "w-full h-full rounded-lg shadow-soft hover:shadow-medium transition-all duration-300 border border-border/20 relative overflow-hidden drag-handle",
            item.type === "note" && noteColorClasses[item.color || "yellow"],
            item.type === "image" && "bg-card",
            isEditing && "cursor-text"
          )}
        >
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground z-10"
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <div className="text-xs">Image Placeholder</div>
              </div>
            </div>
          )}
        </div>
      </Rnd>
    </motion.div>
  );
};

export default BoardItem;