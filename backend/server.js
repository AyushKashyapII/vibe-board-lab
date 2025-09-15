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
  //console.log("User connected:", socket.id);

  socket.on("joinBoard",({boardId,userId})=>{
    if(!boardId || !userId) return;
    socket.join(boardId);
    socket.data.boardId=boardId;
    socket.data.userId=userId;
    console.log("socket room ",io.sockets.adapter.rooms)
    io.to(boardId).emit("message",`user ${socket.id} joined`);
  });

  socket.on("leaveBoard",({boardId,userId})=>{
    if(!boardId) return;
    if(boardId){
      socket.leave(boardId);
      socket.to(boardId).emit("cursor:remove",userId);
    }
  })

  socket.on("cursor:move",({boardId,userId,userName,x,y})=>{
     //console.log("cursor  ",userId," ",x," ",y);
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

  socket.on("stroke:start",(data)=>{
    socket.to(data.boardId).emit("stroke:start",data);
  })

  socket.on("socket:draw",(data)=>{
    socket.to(data.boardId).emit("start:draw",data);
  })

  socket.on("stroke:end",(data)=>{
    socket.to(data.boardId).emit("stroke:end",data);
  })

  socket.on("disconnect", () => {
    const boardId=socket.data.boardId;
    const userId=socket.data.userId;
    if(boardId){
      socket.to(boardId).emit("cursor:remove",userId);
    }
    console.log("User disconnected:", socket.id);
  });
});


httpServer.listen(4000, () => {
  console.log("WebSocket server running on http://localhost:4000");
});
