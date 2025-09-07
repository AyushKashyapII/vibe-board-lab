import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Palette, Users, Plus, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { createBoard } from "@/lib/canva";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [canvases, setCanvases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleBoardCreate = async () => {
    setLoading(true);
    const canvas = await createBoard(profile.id, "First canvas");
    if (canvas) {
      navigate(`/board/${canvas.id}`);
    } else {
      console.log("Error in creating board");
    }
    setLoading(false);
  };

  const handleJoinCanvas = async () => {
    if (!joinCode) return;
    setJoinError("");

    const { data, error } = await supabase
      .from("canvases")
      .select("id")
      .eq("join_code", joinCode)
      .single();

    if (error || !data) {
      setJoinError("Invalid join code. Please try again.");
      return;
    }

    navigate(`/board/${data.id}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const canvasIds = [
        profileData.personal_canvas_id,
        ...(profileData.shared_canvas_ids || []),
      ].filter(Boolean);

      if (canvasIds.length > 0) {
        const { data: canvasData } = await supabase
          .from("canvases")
          .select("*")
          .in("id", canvasIds);

        setCanvases(canvasData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar title="Live Mood Board 🎨" joinCode="" />

      <main className="flex flex-col items-center justify-center min-h-screen pt-16 px-6">
        <div className="w-full max-w-5xl text-center">
          {profile ? (
            <h2 className="text-3xl font-bold mb-8">
              Welcome, {profile.username} 👋
            </h2>
          ) : (
            <div className="mb-12">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                Create Together, Anywhere ✨
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Live Mood Board is your shared creative space. Add sticky notes,
                images, and ideas with your team in real-time.
              </p>
            </div>
          )}

          {/* If not logged in → show Sign Up / Login */}
          {!profile && !loading && (
            <div className="flex gap-6 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-primary text-white shadow-strong text-lg px-6 py-4"
                onClick={() => navigate("/signup")}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Sign Up
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 text-lg px-6 py-4"
                onClick={() => navigate("/login")}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Button>
            </div>
          )}

          {/* If logged in → show canvas actions */}
          {profile && (
            <>
              <div className="flex gap-6 justify-center mb-12">
                <Button
                  size="lg"
                  className="bg-gradient-primary text-white shadow-strong text-lg px-6 py-4"
                  onClick={handleBoardCreate}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Canvas
                </Button>

                {/* Join Canvas Modal */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-2 text-lg px-6 py-4"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Join Canvas
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enter Join Code</DialogTitle>
                    </DialogHeader>
                    <Input
                      placeholder="Paste join code..."
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                    {joinError && (
                      <p className="text-sm text-red-500 mt-2">{joinError}</p>
                    )}
                    <Button className="mt-4 w-full" onClick={handleJoinCanvas}>
                      Join
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Canvases grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {canvases.map((canvas) => (
                  <motion.div
                    key={canvas.id}
                    className="p-6 rounded-xl bg-card shadow-soft hover:shadow-medium transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate(`/board/${canvas.id}`)}
                  >
                    <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      {canvas.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {canvas.members.length} members
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
