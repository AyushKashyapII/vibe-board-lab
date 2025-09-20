import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Toolbar from "@/components/Toolbar";
import BoardItem, { BoardItemData } from "@/components/BoardItem";
import { supabase } from "@/lib/supabase";
import { io } from "socket.io-client";
import { getCurrentUser } from "@/lib/auth";
import LiveCursors from "@/components/LiveCursors";
import { Knob } from "react-rotary-knob";
import { fetchCanvas, saveCanvas } from "@/lib/canva";
import ThicknessWheel from "@/components/ThicknessWheel";
import MiniMap from "@/components/MiniMap";

const CANVAS_SIZE = 10000;
const thicknessOptions = ["1px", "2px", "4px", "8px", "12px", "16px", "24px", "32px"];

type Point = { x: number, y: number, t?: number };
type Stroke = {
  id: string;
  userId: string;
  userName?: string;
  color: string;
  width: number;
  points: Point[];
}

const Board = () => {
  const [items, setItems] = useState<BoardItemData[]>([]);
  const [lastClickedPosition, setLastClickedPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<BoardItemData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<"select" | "draw">("select");
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const viewportRef = useRef(viewport);
  const rafPending = useRef<number | null>(null);
  const [selectedColor, setSelectedColor] = useState("black");
  const [selectedWidth, setSelectedWidth] = useState("2px");

  const containerRef = useRef<HTMLDivElement | null>(null);

  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);
  //const filInputRef = useRef(null);
  const socketRef = useRef<any>(null);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("")
  let currentStroke = null;
  let pendingPoints: Point[] = [];
  let lastEmit = 0;
  const EMIT_INTERVAL = 16;
  const currentStrokeRef = useRef<Stroke | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  // const [animatingStrokes,setAnimatingStrokes]=useState<Record<string,{
  //   stroke:Stroke;
  //   animatedPoints:Point[];

  // }>({})

  useEffect(() => {
    if (drawingCanvasRef.current) {
      ctxRef.current = drawingCanvasRef.current.getContext("2d");

      if (ctxRef.current) {
        const canvas = drawingCanvasRef.current;
        const ctx = ctxRef.current;

        console.log("Canvas context initialized:", canvas.width, "x", canvas.height);

        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;

        ctx.imageSmoothingEnabled = true;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);



  const [remoteCursors, setRemoteCursors] = useState<Record<string, { userName: string; x: number, y: number }>>({});

  const { id } = useParams<{ id: string }>();
  // useEffect(()=>{
  //   if(!id) return;
  //   const timeout=setTimeout(()=>{
  //     saveCanvas(id,items);
  //   },1000)
  //   return()=>clearTimeout(timeout);
  // },[id])


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        if (response && response.id) {
          setUserId(response.id);

          const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", response.id)
            .single();

          if (error) {
            console.error("Error fetching username:", error);
          } else if (data) {
            //console.log("Fetched user:", data);
            console.log("name", data.username)
            setUserName(data.username);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!id) return;
    const data = fetchCanvas(id);
    if (data) {
      data.then((items) => {
        setItems(items);
      }).catch((err) => {
        console.log("Error in fetching canvas", err);
      });
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;

    const handleStrokeEnd = ({ stroke }: { stroke: Stroke }) => {
      if (stroke.userId === userId) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      const points = stroke.points;
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    socketRef.current.on("stroke:end", handleStrokeEnd);
    return () => {
      socketRef.current?.off("stroke:end", handleStrokeEnd);
    };
  }, [userId]);

  useEffect(() => {
    if (!id || !userId) return;

    if (!socketRef.current) {
      socketRef.current = io("http://localhost:4000", {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000
      });
    }
    const socket = socketRef.current;
    socket.on("connect", () => {
      //console.log("Connected to server with id:", socket.id);
      console.log(userId, " user id ", id, " board id")
      socket.emit("joinBoard", { boardId: id, userId });
    });
    socket.on("item:add", (item) => {
      setItems((prev) => [...prev, item]);
    });
    socket.on("item:update", ({ id: itemId, updates }) => {
      setItems(curr => curr.map(it => it.id === itemId ? { ...it, ...updates } : it));
    });
    socket.on("item:delete", (itemId) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      //socket.emit("leaveBoard",{boardId:id,userId})
    });

    return () => {
      socket.off("item:add");
      socket.off("item:update");
      socket.off("item:delete");
      socket.off("connect");
      socket.off("disconnect");
      //socket.emit("leaveBoard", {boardId:id,userId});
    };
  }, [id, userId]);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleCursorUpdate = ({ userId: otherUserId, userName: otherUserName, x, y }: { userId: string, userName: string, x: number, y: number }) => {
      if (!otherUserId || otherUserId == userId) return;
      //console.log("user id",otherUserId," ",x," ",y);
      setRemoteCursors(prev => ({ ...prev, [otherUserId]: { userName: otherUserName, x, y } }));
    }

    const handleCursorRemove = (removedUserId: string) => {
      setRemoteCursors(prev => {
        const copy = { ...prev };
        delete copy[removedUserId];
        return copy;
      })
    }

    socket.on("cursor:update", handleCursorUpdate);
    socket.on("cursor:remove", handleCursorRemove);

    return () => {
      socket.off("cursor:update", handleCursorUpdate);
      socket.off("cursor:remove", handleCursorRemove)
    }
  }, [userId])

  useEffect(() => {
    if (!id || !socketRef.current || !userId) return;
    const socket = socketRef.current;

    let lastEmit = 0;
    const minDelta = 50;

    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

      const now = performance.now();
      if (now - lastEmit < minDelta) return;
      lastEmit = now;

      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      //console.log(userId)
      socket.emit("cursor:move", { boardId: id, userId, userName, x: canvasPos.x, y: canvasPos.y });
    }

    window.addEventListener("mousemove", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
    }
  }, [id, userId]);

  const [canvasName, setCanvasName] = useState("")
  const [joinCode, setJoinCode] = useState("")

  useEffect(() => { viewportRef.current = viewport; }, [viewport]);

  const boardId = id;

  useEffect(() => {
    const fetchCanvas = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("canvases")
        .select("name,items,join_code")
        .eq("id", id)
        .single();

      if (error) {
        console.log("Error fetching database", error);
        return;
      }

      //console.log(data);

      setCanvasName(data.name);
      setJoinCode(data.join_code);
      setItems(data.items || []);
    }

    fetchCanvas();
  }, [id])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      alert("Join code copied to clipboard");
    } catch (err) {
      console.error("Failed to copy the code: ", err);
    }
  };

  const setViewportRaf = useCallback((next: { x: number; y: number; scale: number }) => {
    const maxX = 0;
    const minX = -(CANVAS_SIZE * next.scale - (window.innerWidth));
    const maxY = 64;
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
    //console.log("hitting add websockets ");
    socketRef.current?.emit("item:add", { boardId: id, item: newItem });

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
    socketRef.current?.emit("item:add", { boardId: id, item: newItem });

  }, [items, lastClickedPosition, saveToHistory, getVisibleCenterInCanvas]);

  const updateItem = useCallback((itemId: string, updates: Partial<BoardItemData>) => {
    if (!updates || Object.keys(updates).length === 0) {
      return;
    }

    // Make sure we have both boardId and socket connection
    if (!boardId || !socketRef.current) {
      console.error("Missing boardId or socket connection");
      return;
    }

    setItems(curr => curr.map(it => it.id === itemId ? { ...it, ...updates } : it));
    // console.log("hitting update");
    // console.log(itemId, "id", updates, "updates");

    socketRef.current.emit("item:update", {
      boardId,
      id: itemId,
      updates,
    });
  }, [boardId]);

  useEffect(() => {
    if (tool !== "draw") return;
    const canvas = drawingCanvasRef.current;
    if (!canvas || !ctxRef.current) {
      console.log("Canvas or context not available for drawing");
      return;
    }

    const ctx = ctxRef.current;

    let isDrawing = false;
    let lastPoint: Point | null = null;
    let pointBuffer: Point[] = [];
    let rafId: number | null = null;
    let lastEmitTime = 0;
    const EMIT_INTERVAL = 32;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      isDrawing = true;
      const p = screenToCanvas(e.clientX, e.clientY);
      lastPoint = p;
      pointBuffer = [p];

      const stroke: Stroke = {
        id: "stroke-" + Date.now() + "-" + userId,
        userId,
        userName,
        color: selectedColor,
        width: parseInt(selectedWidth),
        points: [p],
      };
      currentStrokeRef.current = stroke;

      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = parseInt(selectedWidth);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);

      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, parseInt(selectedWidth) / 2, 0, Math.PI * 2);
      ctx.fill();

      socketRef.current?.emit("stroke:start", { boardId: id, stroke });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawing || !currentStrokeRef.current || !lastPoint) return;
      e.preventDefault();

      const p = screenToCanvas(e.clientX, e.clientY);
      const dx = p.x - lastPoint.x;
      const dy = p.y - lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= 1) {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = parseInt(selectedWidth);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        currentStrokeRef.current.points.push(p);
        pointBuffer.push(p);
        lastPoint = p;
      }

      if (isDrawing && !rafId) startEmitLoop();
    };

    const handlePointerUp = () => {
      if (!isDrawing || !currentStrokeRef.current) return;

      isDrawing = false;

      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (pointBuffer.length > 0) {
        socketRef.current?.emit("stroke:draw", {
          boardId: id,
          id: currentStrokeRef.current.id,
          points: [...pointBuffer],
        });
      }

      socketRef.current?.emit("stroke:end", {
        boardId: id,
        stroke: currentStrokeRef.current,
      });

      currentStrokeRef.current = null;
      lastPoint = null;
      pointBuffer = [];
    };

    const emitPendingPoints = () => {
      const now = performance.now();
      if (pointBuffer.length > 0 && now - lastEmitTime >= EMIT_INTERVAL) {
        if (currentStrokeRef.current) {
          socketRef.current?.emit("stroke:draw", {
            boardId: id,
            id: currentStrokeRef.current.id,
            points: [...pointBuffer],
          });
          pointBuffer = [];
          lastEmitTime = now;
        }
      }

      if (isDrawing) {
        rafId = requestAnimationFrame(emitPendingPoints);
      }
    };

    const startEmitLoop = () => {
      if (!rafId && isDrawing) {
        rafId = requestAnimationFrame(emitPendingPoints);
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [tool, selectedColor, selectedWidth, userId, userName, id, screenToCanvas]);


  const deleteItem = useCallback((id: string) => {
    saveToHistory(items.filter(i => i.id !== id));
    socketRef.current?.emit("item:delete", { boardId, itemId: id });
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

  const zoomAtPoint = useCallback((clientX: number, clientY: number, deltaScale: number) => {
    const { x, y, scale: currentScale } = viewportRef.current;
    const targetScale = Math.max(0.1, Math.min(5, currentScale * deltaScale));

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const boardX = (localX - x) / currentScale;
    const boardY = (localY - y) / currentScale;

    const nextX = localX - boardX * targetScale;
    const nextY = localY - boardY * targetScale;

    setViewportRaf({ x: nextX, y: nextY, scale: targetScale });
  }, [setViewportRaf]);

  const zoomIn = useCallback(() => zoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, 1.2), [zoomAtPoint]);
  const zoomOut = useCallback(() => zoomAtPoint(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.2), [zoomAtPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomAtPoint(e.clientX, e.clientY, factor);
    };
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [zoomAtPoint]);

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
      if (e.button === 1 || (spacePressedRef.current && e.button === 0)) {
        e.preventDefault();
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

  useEffect(() => {
    const centerX = (window.innerWidth - CANVAS_SIZE) / 2;
    const centerY = (window.innerHeight - CANVAS_SIZE) / 2;
    setViewportRaf({ x: centerX, y: centerY, scale: 1 });
  }, [setViewportRaf]);

  const changePencil = () => {
    if (tool == "select") {
      setTool("draw")
    } else {
      setTool("select")
    }
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setLastClickedPosition(canvasPos);
  };

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
    socketRef.current?.emit("item:add", { boardId: id, item: newItem });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Navbar title={canvasName} joinCode={joinCode || ""} />

      <Toolbar
        onAddNote={addNote}
        onAddImage={addImage}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onSelectDraw={changePencil}
        saveCanvas={() => {
          saveCanvas(id, items)
        }}
      />

      <MiniMap
        items={items}
        viewport={{
          x: viewport.x,
          y: viewport.y,
          scale: viewport.scale
        }}
      />




      {tool === "draw" && (
        <div className="sticky top-0 z-40 bg-white shadow-md p-2 flex gap-6 justify-center mt-20 w-fit mx-auto rounded-xl items-center">

          {/* Color Selector */}
          <div className="flex gap-2">
            {["black", "red", "blue", "green", "orange", "purple", "pink", "brown"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition ${selectedColor === c
                    ? "ring-2 ring-offset-2 ring-[color:var(--tw-ring-color)]"
                    : "border-gray-300"
                  }`}
                style={{
                  backgroundColor: c,
                  ["--tw-ring-color" as any]: c,
                }}
              />
            ))}
          </div>

          {/* Thickness Selector with arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const idx = thicknessOptions.indexOf(selectedWidth);
                if (idx > 0) setSelectedWidth(thicknessOptions[idx - 1]);
              }}
              className="px-2 py-1 border rounded"
            >
              –
            </button>

            <span className="min-w-[40px] text-center font-medium">{selectedWidth}</span>

            <button
              onClick={() => {
                const idx = thicknessOptions.indexOf(selectedWidth);
                if (idx < thicknessOptions.length - 1) setSelectedWidth(thicknessOptions[idx + 1]);
              }}
              className="px-2 py-1 border rounded"
            >
              +
            </button>
          </div>
        </div>
      )}



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

        {/* Canvas background (grid) */}
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

        {/* Overlay items */}
        <div className="absolute inset-0 z-30" style={{ pointerEvents: "none" }}>
          <AnimatePresence>
            {items.map((item) => {
              return (
                <BoardItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  viewport={viewport}
                />
              );
            })}
          </AnimatePresence>

          <LiveCursors
            cursors={remoteCursors}
            canvasToDom={canvasToDom}
            currentUserId={userId}
            containerRef={containerRef}
          />

          {/* Drawing canvas */}
          <canvas
            ref={drawingCanvasRef}
            className="absolute inset-0 z-20"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
              pointerEvents: tool === "draw" ? "auto" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Board;