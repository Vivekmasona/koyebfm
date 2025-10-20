import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = new Map();

wss.on("connection", (ws, req) => {
  const id = Math.random().toString(36).slice(2);
  clients.set(id, ws);
  console.log("🟢 Client connected:", id);

  ws.on("message", (msg) => {
    for (const [key, client] of clients.entries()) {
      if (client.readyState === 1 && client !== ws) {
        client.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("🔴 Client disconnected:", id);
  });
});

app.get("/", (req, res) => {
  res.send("🎧 FM WebSocket server running OK ✅");
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server live on port ${PORT}`));
