import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Toolbar from "@/components/Toolbar";
import BoardItem, { BoardItemData } from "@/components/BoardItem";

const Board = () => {
  const [items, setItems] = useState<BoardItemData[]>([
    // Demo items to show functionality
    {
      id: "demo-1",
      type: "note",
      content: "Welcome to your mood board! 🎨",
      x: 200,
      y: 150,
      width: 200,
      height: 120,
      color: "yellow"
    },
    {
      id: "demo-2", 
      type: "note",
      content: "Drag me around and resize me!",
      x: 450,
      y: 200,
      width: 180,
      height: 100,
      color: "pink"
    }
  ]);

  const [history, setHistory] = useState<BoardItemData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);

  const saveToHistory = useCallback((newItems: BoardItemData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setItems(newItems);
  }, [items, history, historyIndex]);

  const addNote = useCallback(() => {
    const colors: Array<"yellow" | "pink" | "blue" | "green" | "orange"> = 
      ["yellow", "pink", "blue", "green", "orange"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Calculate center of viewport accounting for navbar and scale
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 64; // Account for navbar height
    const centerX = (viewportWidth / 2 - 100) / scale; // Account for scale and half item width
    const centerY = (viewportHeight / 2 - 60) / scale; // Account for scale and half item height
    
    const newItem: BoardItemData = {
      id: `note-${Date.now()}`,
      type: "note",
      content: "",
      x: Math.max(50, centerX + (Math.random() - 0.5) * 100), // Add small random offset
      y: Math.max(50, centerY + (Math.random() - 0.5) * 100),
      width: 200,
      height: 120,
      color: randomColor
    };
    
    saveToHistory([...items, newItem]);
  }, [items, saveToHistory, scale]);

  const addImage = useCallback(() => {
    // Calculate center of viewport accounting for navbar and scale
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 64; // Account for navbar height
    const centerX = (viewportWidth / 2 - 100) / scale; // Account for scale and half item width
    const centerY = (viewportHeight / 2 - 75) / scale; // Account for scale and half item height
    
    const newItem: BoardItemData = {
      id: `image-${Date.now()}`,
      type: "image",
      content: "",
      x: Math.max(50, centerX + (Math.random() - 0.5) * 100), // Add small random offset
      y: Math.max(50, centerY + (Math.random() - 0.5) * 100),
      width: 200,
      height: 150
    };
    
    saveToHistory([...items, newItem]);
  }, [items, saveToHistory, scale]);

  const updateItem = useCallback((id: string, updates: Partial<BoardItemData>) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setItems(newItems);
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveToHistory(newItems);
  }, [items, saveToHistory]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      setItems(history[historyIndex]);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setItems(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-canvas overflow-hidden">
      <Navbar title="Live Mood Board 🎨" />
      
      <Toolbar
        onAddNote={addNote}
        onAddImage={addImage}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
      />

      <motion.main 
        className="pt-16 h-screen relative overflow-hidden"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full h-full relative" style={{ minWidth: '100vw', minHeight: '100vh' }}>
          <AnimatePresence>
            {items.map((item) => (
              <BoardItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                scale={scale}
              />
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-semibold mb-2">Your canvas awaits</h2>
                <p className="text-lg">Use the toolbar to add sticky notes and images</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
};

export default Board;