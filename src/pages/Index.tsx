import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  Layers,
  Palette,
  Sparkles,
  Users,
  LogIn,
  UserPlus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { ensureProfile } from "@/lib/profile";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profileData = await ensureProfile(user);
        setProfile(profileData);
      } catch (e) {
        console.error("Error fetching/creating profile:", e);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar title="Home" joinCode="" variant="home" />

      <main className="pt-20 pb-16 px-6">
        <div className="mx-auto w-full max-w-6xl">
          <>
            <section className="grid gap-10 lg:grid-cols-2 items-center">
              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-sm text-muted-foreground"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Real-time moodboards for teams & solo creators
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="mt-5 text-5xl md:text-6xl font-extrabold tracking-tight"
                >
                  A live canvas for ideas,
                  <span className="block bg-gradient-to-r from-primary to-[hsl(var(--accent-foreground))] bg-clip-text text-transparent">
                    sketches, and inspiration.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl"
                >
                  Create boards, drop images, write sticky notes, and draw together in
                  real-time. Share a join code and start collaborating instantly.
                </motion.p>

                {!loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4"
                  >
                    {profile ? (
                      <Button
                        size="lg"
                        className="bg-gradient-primary text-white shadow-strong text-lg px-6 py-6"
                        onClick={() => navigate("/dashboard")}
                      >
                        Go to dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="bg-gradient-primary text-white shadow-strong text-lg px-6 py-6"
                        onClick={() => navigate("/signup")}
                      >
                        <UserPlus className="mr-2 h-5 w-5" />
                        Create an account
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}

                    {profile ? (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-2 text-lg px-6 py-6 bg-background/40"
                        onClick={() => navigate("/board")}
                      >
                        Open board
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-2 text-lg px-6 py-6 bg-background/40"
                        onClick={() => navigate("/login")}
                      >
                        <LogIn className="mr-2 h-5 w-5" />
                        Log in
                      </Button>
                    )}
                  </motion.div>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Realtime cursors</Badge>
                  <Badge variant="secondary">Sticky notes + images</Badge>
                  <Badge variant="secondary">Infinite canvas vibe</Badge>
                  <Badge variant="secondary">Share with join code</Badge>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl" />
                <Card className="relative overflow-hidden rounded-3xl shadow-strong">
                  <div className="p-4 border-b bg-background/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <span className="font-semibold">MoodBoard</span>
                      </div>
                      <Badge variant="outline">preview</Badge>
                    </div>
                  </div>
                  <div className="aspect-[16/10] bg-gradient-to-br from-background to-muted">
                    <img
                      src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXQ1c2Fjb2V5ZjRrM2h2Y2U2aHh6cHhpcGd5cmh0cTZwZ2hyZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JIX9t2j0ZTN9S/giphy.gif"
                      alt="Animated preview of a creative board"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Card>
              </motion.div>
            </section>

            <section className="mt-16">
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    {
                      icon: Zap,
                      title: "Real-time collaboration",
                      desc: "See updates instantly with live cursors, shared changes, and smooth interactions.",
                    },
                    {
                      icon: Layers,
                      title: "Ideas to board in seconds",
                      desc: "Add notes and images, move things around, and keep your moodboard tidy.",
                    },
                    {
                      icon: Users,
                      title: "Invite with a join code",
                      desc: "Create a canvas, copy a code, and let collaborators jump in immediately.",
                    },
                  ].map((f) => (
                    <Card key={f.title} className="p-6 bg-background/60 backdrop-blur">
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-primary/10 p-3">
                          <f.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{f.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {f.desc}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="mt-16">
                <Card className="p-8 bg-background/60 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <Code2 className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Built with a modern stack</h2>
                  </div>
                  <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
                    Fast UI, real-time updates, and auth/storage handled cleanly so the app
                    stays simple to build on.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      "React",
                      "Vite",
                      "TypeScript",
                      "Tailwind CSS",
                      "shadcn/ui (Radix)",
                      "Framer Motion",
                      "Supabase (Auth + DB)",
                      "Socket.IO",
                    ].map((t) => (
                      <Badge key={t} variant="secondary" className="text-sm">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="mt-16">
                <div className="grid gap-6 lg:grid-cols-2 items-center">
                  <Card className="p-8 bg-background/60 backdrop-blur">
                    <h2 className="text-2xl font-bold">How it works</h2>
                    <div className="mt-5 space-y-4">
                      {[
                        {
                          step: "01",
                          title: "Sign up and create a canvas",
                          desc: "Start with a blank board (or your first canvas) and name it later.",
                        },
                        {
                          step: "02",
                          title: "Add notes, images, and sketches",
                          desc: "Drop ideas on the board and arrange them into a moodboard that makes sense.",
                        },
                        {
                          step: "03",
                          title: "Share a join code",
                          desc: "Collaborators can join instantly and contribute in real-time.",
                        },
                      ].map((s) => (
                        <div key={s.step} className="flex gap-4">
                          <div className="w-12 shrink-0 text-sm font-semibold text-primary">
                            {s.step}
                          </div>
                          <div>
                            <div className="font-semibold">{s.title}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!loading && (
                      <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          className="bg-gradient-primary text-white shadow-strong"
                          onClick={() => navigate("/signup")}
                        >
                          Get started
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-background/40"
                          onClick={() => navigate("/login")}
                        >
                          I already have an account
                        </Button>
                      </div>
                    )}
                  </Card>

                  <Card className="overflow-hidden rounded-3xl shadow-medium bg-background/60 backdrop-blur">
                    <div className="aspect-[16/10] bg-gradient-to-br from-muted to-background">
                      <img
                        src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGg1M2JubzR4Y3hmY2Fxd2I1b2F5OHp1cGx4dXB6aGJkYzl2bWJ4YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26BRzozg4TCBXv6QU/giphy.gif"
                        alt="Animated collaboration illustration"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </Card>
                </div>
              </section>

              <footer className="mt-16 text-center text-sm text-muted-foreground">
                Built for quick brainstorming, moodboarding, and real-time collaboration.
              </footer>
            </>
        </div>
      </main>
    </div>
  );
};

export default Index;
