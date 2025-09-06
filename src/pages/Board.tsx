import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Toolbar from "@/components/Toolbar";
import BoardItem, { BoardItemData } from "@/components/BoardItem";

const CANVAS_SIZE = 10000;

const Board = () => {
  const [items, setItems] = useState<BoardItemData[]>([]);
  const [lastClickedPosition, setLastClickedPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<BoardItemData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const viewportRef = useRef(viewport);
  const rafPending = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);
  const filInputRef = useRef(null);
  

  // keep viewportRef in sync
  useEffect(() => { viewportRef.current = viewport; }, [viewport]);

  const setViewportRaf = useCallback((next: { x: number; y: number; scale: number }) => {
    // bound the viewport so the canvas doesn't go completely out of view
    const maxX = 0;
    const minX = -(CANVAS_SIZE * next.scale - (window.innerWidth));
    const maxY = 64; // keep toolbar/nav visible
    const minY = -(CANVAS_SIZE * next.scale - (window.innerHeight - 64));

    const boundedX = Math.max(minX, Math.min(maxX, next.x));
    const boundedY = Math.max(minY, Math.min(maxY, next.y));

    const bounded = { x: boundedX, y: boundedY, scale: next.scale };
    viewportRef.current = bounded;

    if (rafPending.current == null) {
      rafPending.current = requestAnimationFrame(() => {
        rafPending.current = null;
        setViewport(viewportRef.current);
      });
    }
  }, []);

  // convert screen (clientX, clientY) -> canvas coordinates (logical)
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const vx = viewportRef.current.x;
    const vy = viewportRef.current.y;
    const s = viewportRef.current.scale;

    // client relative to container top-left
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    // convert to canvas (unscaled logical) coordinates
    const canvasX = (localX - vx) / s;
    const canvasY = (localY - vy) / s;

    // clamp to canvas bounds
    return {
      x: Math.max(0, Math.min(CANVAS_SIZE, canvasX)),
      y: Math.max(0, Math.min(CANVAS_SIZE, canvasY))
    };
  }, []);

  // convert canvas coords -> DOM (container relative) coordinates for positioning overlay elements
  const canvasToDom = useCallback((canvasX: number, canvasY: number) => {
    const vx = viewportRef.current.x;
    const vy = viewportRef.current.y;
    const s = viewportRef.current.scale;

    return {
      x: Math.round(vx + canvasX * s),
      y: Math.round(vy + canvasY * s)
    };
  }, []);

  // history
  const saveToHistory = useCallback((newItems: BoardItemData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...items]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setItems(newItems);
  }, [items, history, historyIndex]);

  // helper to get visible center in canvas coords
  const getVisibleCenterInCanvas = useCallback(() => {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    return screenToCanvas(cw / 2, ch / 2);
  }, [screenToCanvas]);

  // add note (centered on click)
  const addNote = useCallback(() => {
    const position = lastClickedPosition || getVisibleCenterInCanvas();
    const w = 200, h = 120;
    const colors: Array<"yellow" | "pink" | "blue" | "green" | "orange"> = ["yellow", "pink", "blue", "green", "orange"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newItem: BoardItemData = {
      id: `note-${Date.now()}`,
      type: "note",
      content: "New Note",
      x: Math.max(0, Math.min(CANVAS_SIZE - w, position.x - w / 2)),
      y: Math.max(0, Math.min(CANVAS_SIZE - h, position.y - h / 2)),
      width: w,
      height: h,
      color: randomColor
    };

    saveToHistory([...items, newItem]);
  }, [items, lastClickedPosition, saveToHistory, getVisibleCenterInCanvas]);

  const addImage = useCallback(() => {
    const position = lastClickedPosition || getVisibleCenterInCanvas();
    const w = 200, h = 150;

    const newItem: BoardItemData = {
      id: `image-${Date.now()}`,
      type: "image",
      content: "",
      x: Math.max(0, Math.min(CANVAS_SIZE - w, position.x - w / 2)),
      y: Math.max(0, Math.min(CANVAS_SIZE - h, position.y - h / 2)),
      width: w,
      height: h
    };

    saveToHistory([...items, newItem]);
  }, [items, lastClickedPosition, saveToHistory, getVisibleCenterInCanvas]);

  const updateItem = useCallback((id: string, updates: Partial<BoardItemData>) => {
    setItems(curr => curr.map(it => it.id === id ? { ...it, ...updates } : it));
  }, []);

  const deleteItem = useCallback((id: string) => {
    saveToHistory(items.filter(i => i.id !== id));
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

  // Zooming (zoom at point)
  const zoomAtPoint = useCallback((clientX: number, clientY: number, deltaScale: number) => {
    const { x, y, scale: currentScale } = viewportRef.current;
    const targetScale = Math.max(0.1, Math.min(5, currentScale * deltaScale));

    // convert pointer into board-space
    // boardX/Y = (local - vx)/currentScale
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const boardX = (localX - x) / currentScale;
    const boardY = (localY - y) / currentScale;

    // compute new viewport so the boardX/boardY remain under the pointer
    const nextX = localX - boardX * targetScale;
    const nextY = localY - boardY * targetScale;

    setViewportRaf({ x: nextX, y: nextY, scale: targetScale });
  }, [setViewportRaf]);

  const zoomIn = useCallback(() => zoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, 1.2), [zoomAtPoint]);
  const zoomOut = useCallback(() => zoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.2), [zoomAtPoint]);

  // Wheel zoom (normal wheel will zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      // if user holds ctrl/meta, let the browser (or we still zoom) — we just always zoom
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomAtPoint(e.clientX, e.clientY, factor);
    };
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [zoomAtPoint]);

  // Space key toggles hand cursor for panning
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = true;
        if (containerRef.current && !isPanningRef.current) containerRef.current.style.cursor = "grab";
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = false;
        if (containerRef.current && !isPanningRef.current) containerRef.current.style.cursor = "";
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      if (containerRef.current) containerRef.current.style.cursor = "";
    };
  }, []);

  // Middle mouse or space+drag panning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const startPan = (clientX: number, clientY: number) => {
      isPanningRef.current = true;
      lastPointerRef.current = { x: clientX, y: clientY };
      container.style.cursor = "grabbing";
    };

    const stopPan = () => {
      isPanningRef.current = false;
      lastPointerRef.current = null;
      if (container && !spacePressedRef.current) container.style.cursor = "";
      if (container && spacePressedRef.current) container.style.cursor = "grab";
    };

    const movePan = (clientX: number, clientY: number) => {
      if (!isPanningRef.current || !lastPointerRef.current) return;
      const dx = clientX - lastPointerRef.current.x;
      const dy = clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: clientX, y: clientY };
      const { x, y, scale } = viewportRef.current;
      setViewportRaf({ x: x + dx, y: y + dy, scale });
    };

    const onMouseDown = (e: MouseEvent) => {
      // middle mouse OR space+left
      if (e.button === 1 || (spacePressedRef.current && e.button === 0)) {
        e.preventDefault(); // prevents autoscroll
        startPan(e.clientX, e.clientY);
      }
    };

    const onMouseMove = (e: MouseEvent) => movePan(e.clientX, e.clientY);

    const onMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current) {
        stopPan();
      }
    };

    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [setViewportRaf]);

  // initialize viewport to center the canvas
  useEffect(() => {
    const centerX = (window.innerWidth - CANVAS_SIZE) / 2;
    const centerY = (window.innerHeight - CANVAS_SIZE) / 2;
    setViewportRaf({ x: centerX, y: centerY, scale: 1 });
  }, [setViewportRaf]);

  // handle canvas click (set lastClickedPosition). This click won't fire when clicking on BoardItem
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setLastClickedPosition(canvasPos);
  };

  // double click: add a note at double-clicked position
  const handleContainerDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const w = 200, h = 120;
    const colors: Array<"yellow" | "pink" | "blue" | "green" | "orange"> = ["yellow", "pink", "blue", "green", "orange"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newItem: BoardItemData = {
      id: `note-${Date.now()}`,
      type: "note",
      content: "Double-click note",
      x: Math.max(0, Math.min(CANVAS_SIZE - w, canvasPos.x - w / 2)),
      y: Math.max(0, Math.min(CANVAS_SIZE - h, canvasPos.y - h / 2)),
      width: w,
      height: h,
      color: randomColor
    };
    saveToHistory([...items, newItem]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
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

      {/* container covers viewport area below nav+toolbar */}
      <div
        ref={containerRef}
        className="fixed inset-0 top-16 overflow-hidden"
        onClick={handleContainerClick}
        onDoubleClick={handleContainerDoubleClick}
        style={{ touchAction: "none" }}
      >
        {/* Zoom display */}
        <div className="absolute top-4 right-4 bg-white/90 px-3 py-2 rounded shadow z-40 text-sm">
          Zoom: {Math.round(viewport.scale * 100)}%
        </div>

        {/* Canvas background (grid) — transformed by viewport */}
        <motion.div
          className="absolute bg-card ring-border"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Overlay layer for interactive items (positioned in DOM coords). 
            pointerEvents is none so clicks fall through to canvas unless an item explicitly sets pointerEvents:auto */}
        <div className="absolute inset-0 z-30" style={{ pointerEvents: "none" }}>
          <AnimatePresence>
            {items.map(item => {
              // convert canvas -> DOM for placement & sizing
              const domPos = canvasToDom(item.x, item.y);
              const domW = Math.max(20, Math.round(item.width * viewport.scale));
              const domH = Math.max(20, Math.round(item.height * viewport.scale));
              return (
                <BoardItem
                  key={item.id}
                  item={item}
                  // pass dom coords/size via props so item knows how to render with react-rnd
                  // NOTE: BoardItem will set its root element pointerEvents to 'auto' so it receives events.
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  viewport={viewport}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Board;
