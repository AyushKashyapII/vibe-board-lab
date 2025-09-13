import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080", 
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinBoard",(boardId)=>{
    socket.join(boardId);
    console.log(`socket ${socket.id} joined ${boardId}`);
    io.to(boardId).emit("message",`user ${socket.id} joined`);
  });

  socket.on("item:add", ({ boardId, item }) => {
    //console.log("Adding item", item);
    socket.to(boardId).emit("item:add", item);
  });

  socket.on("item:update", ({ boardId, id: itemId, updates }) => {
    //console.log("Received update:", itemId, updates);
    socket.to(boardId).emit("item:update", { id: itemId, updates });
  });

  socket.on("item:delete", ({ boardId, itemId }) => {
    //console.log("Deleting item", itemId);
    socket.to(boardId).emit("item:delete", itemId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


httpServer.listen(4000, () => {
  console.log("WebSocket server running on http://localhost:4000");
});
