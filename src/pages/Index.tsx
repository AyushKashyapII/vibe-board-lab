import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-canvas">
      <Navbar title="Live Mood Board 🎨" />
      
      <main className="flex items-center justify-center min-h-screen pt-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.h1 
              className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Live Mood Board
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Collaborate in real-time by adding sticky notes, images, and doodles. 
              Create beautiful mood boards together with your team.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 text-white shadow-strong hover:shadow-glow transition-all duration-300 text-lg px-8 py-6"
                onClick={() => navigate("/board")}
              >
                <Palette className="mr-2 h-5 w-5" />
                Create Board
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 text-lg px-8 py-6 hover:bg-accent hover:border-primary transition-all duration-300"
                onClick={() => navigate("/board")}
              >
                <Users className="mr-2 h-5 w-5" />
                Join Board
              </Button>
            </motion.div>

            <motion.div
              className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {[
                { icon: "✨", title: "Real-time Collaboration", desc: "Work together instantly with live updates" },
                { icon: "🎨", title: "Creative Freedom", desc: "Add notes, images, and express your ideas" },
                { icon: "📱", title: "Works Everywhere", desc: "Perfect on desktop, tablet, and mobile" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 rounded-xl bg-card shadow-soft hover:shadow-medium transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;