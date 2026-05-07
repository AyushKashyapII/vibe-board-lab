import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Palette, Plus, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { createBoard } from "@/lib/canva";

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [canvases, setCanvases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        navigate("/login", { replace: true });
        return;
      }

      setProfile(profileData);

      const canvasIds = Array.from(
        new Set(
          [
            ...(profileData.canvas_ids || []),
            profileData.personal_canvas_id,
            ...(profileData.shared_canvas_ids || []),
          ].filter(Boolean)
        )
      );

      if (canvasIds.length > 0) {
        const { data: canvasData, error: canvasError } = await supabase
          .from("canvases")
          .select("*")
          .in("id", canvasIds);

        if (canvasError) console.error("Error fetching canvases:", canvasError);
        setCanvases(canvasData || []);
      } else {
        setCanvases([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleBoardCreate = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const canvas = await createBoard(profile.id, "First canvas");
    if (canvas) navigate(`/board/${canvas.id}`);
    setLoading(false);
  };

  const handleJoinCanvas = async () => {
    if (!joinCode) return;
    setJoinError("");

    const { data, error } = await supabase.rpc("join_canvas_by_code", {
      p_join_code: joinCode,
    });

    if (error || !data) {
      setJoinError("Invalid join code. Please try again.");
      return;
    }

    navigate(`/board/${data}`);
  };

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar title="Dashboard" joinCode="" variant="home" />

      <main className="pt-20 pb-16 px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold">
                {profile?.username ? `Welcome, ${profile.username}` : "Your dashboard"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Create a new canvas or jump back into an existing one.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-gradient-primary text-white shadow-strong"
                onClick={handleBoardCreate}
                disabled={loading}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Canvas
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="bg-background/40">
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
                  {joinError && <p className="text-sm text-red-500 mt-2">{joinError}</p>}
                  <Button className="mt-4 w-full" onClick={handleJoinCanvas}>
                    Join
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <motion.div
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {canvases.map((canvas) => (
              <motion.button
                type="button"
                key={canvas.id}
                className="text-left p-6 rounded-2xl bg-background/60 backdrop-blur shadow-soft hover:shadow-medium transition-all border"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/board/${canvas.id}`)}
              >
                <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  {canvas.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {canvas?.members?.length ?? 0} members
                </p>
              </motion.button>
            ))}

            {!loading && canvases.length === 0 ? (
              <Card className="p-6 bg-background/60 backdrop-blur border">
                <div className="text-sm text-muted-foreground">
                  No boards yet — create your first canvas to get started.
                </div>
              </Card>
            ) : null}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

