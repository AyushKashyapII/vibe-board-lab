import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  process.env.FRONTEND_URL ||
  "http://localhost:8080";

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
  transports:['websocket','polling'],
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

io.on("connection", (socket) => {
  //console.log("User connected:", socket.id);

  socket.on("joinBoard",({boardId,userId})=>{
    //console.log("hitting here ")
    if(!boardId || !userId) return;
    //console.log(`User ${userId} joining board ${boardId}`);
    socket.join(boardId);
    socket.data.boardId=boardId;
    socket.data.userId=userId;
    //console.log("socket room ",io.sockets.adapter.rooms)
    io.to(boardId).emit("message",`user ${socket.id} joined`);
  });

  socket.on("leaveBoard",({boardId,userId})=>{
    if(!boardId) return;
    if(boardId){
      socket.leave(boardId);
      socket.to(boardId).emit("cursor:remove",userId);
      socket.data.boardId=null;
      socket.data.userId=null;
    }
  })

  socket.on("cursor:move",({boardId,userId,userName,x,y})=>{
    socket.to(boardId).emit("cursor:update",{userId,userName,x,y});
  });

  socket.on("item:add",({boardId,item}) => {
    //console.log("tryin to add")
    socket.to(boardId).emit("item:add", item);
  });

  socket.on("item:update", ({ boardId, id: itemId, updates }) => {
    socket.to(boardId).emit("item:update", { id: itemId, updates });
  });

  socket.on("item:delete", ({ boardId, itemId }) => {
    socket.to(boardId).emit("item:delete", itemId);
  });

  socket.on("stroke:end", ({ boardId, stroke }) => {
    socket.to(boardId).emit("stroke:end", { stroke });
  });

  socket.on("disconnect", () => {
    const boardId=socket.data.boardId;
    const userId=socket.data.userId;
    if(boardId){
      socket.to(boardId).emit("cursor:remove",userId);
    }

    console.log("User disconnected:", socket.id);
  });
});


httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
