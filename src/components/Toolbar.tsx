import { Plus, Image, Undo, Redo, ZoomIn, ZoomOut, StickyNote, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ToolbarProps {
  onAddNote: () => void;
  onAddImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectDraw:()=>void;
  canUndo: boolean;
  canRedo: boolean;
}

const Toolbar = ({ 
  onAddNote, 
  onAddImage, 
  onUndo, 
  onRedo, 
  onZoomIn, 
  onZoomOut,
  canUndo,
  canRedo,
  onSelectDraw
}: ToolbarProps) => {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
      <div className="bg-toolbar border border-toolbar-border rounded-xl shadow-strong p-2 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddNote}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Add Sticky Note"
        >
          <StickyNote className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onAddImage}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Add Image"
        >
          <Image className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSelectDraw}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Add Sticky Note"
        >
          <Pencil className="h-5 w-5" />
        </Button>
        
        <Separator />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          className="hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <Separator />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;