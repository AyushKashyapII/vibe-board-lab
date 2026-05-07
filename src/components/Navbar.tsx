import { Copy, Moon, Pencil, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

interface NavbarProps {
  title: string;
  joinCode: string;
  variant?: "home" | "board";
}

const Navbar = ({ title, joinCode, variant = "board" }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { id } = useParams<{ id: string }>();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(title);
  const showBoardControls = variant === "board" && !!id;
  const [isAuthed, setIsAuthed] = useState(false);

  // keep newName in sync with prop title if it changes from outside
  useEffect(() => {
    setNewName(title);
  }, [title]);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsAuthed(!!user);
    };

    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleShare = async () => {
    if (!joinCode) {
      alert("No join code available yet!");
      return;
    }
    try {
      await navigator.clipboard.writeText(joinCode);
      alert(`Join code "${joinCode}" copied to clipboard!`);
    } catch (err) {
      console.error("Failed to copy join code:", err);
    }
  };

  const updateCanvas = async () => {
    if (!id) return;

    const { error } = await supabase
      .from("canvases")
      .update({ name: newName })
      .eq("id", id);

    if (error) {
      console.error("Error updating canvas:", error);
    } else {
      setIsEditing(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          {showBoardControls && isEditing ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={updateCanvas}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateCanvas();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setNewName(title);
                }
              }}
              className="border px-2 py-1 rounded text-sm"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <img
                src="/moodboard-icon.svg"
                alt="MoodBoard"
                className="h-7 w-7 rounded-md ring-1 ring-border bg-background/70 p-1"
                draggable={false}
              />
              {showBoardControls ? (
                <h1 className="text-lg font-semibold text-foreground">{newName || "Untitled board"}</h1>
              ) : (
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  MoodBoard
                </h1>
              )}
            </div>
          )}

          {showBoardControls && (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthed && (
            <Button asChild size="sm" variant="outline" className="bg-background/40">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}
          {!isAuthed && (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary text-white shadow-soft">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
          {showBoardControls && (
            <Button
              size="sm"
              variant="outline"
              className="ml-4 flex items-center gap-2"
              onClick={handleShare}
            >
              <Copy className="h-4 w-4" />
              Share Code
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-accent"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
