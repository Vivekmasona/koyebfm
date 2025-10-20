// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.json({ status: "✅ FM WebSocket Server Running", time: new Date().toISOString() });
});

// ✅ Create HTTP + WS server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ✅ All connected clients
const clients = new Set();

// Handle new connections
wss.on("connection", (ws) => {
  console.log("🔗 New client connected");
  clients.add(ws);

  ws.on("message", (msg) => {
    // Broadcast to all clients
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("❌ Client disconnected");
  });
});

// ✅ Port from environment (Koyeb gives PORT)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
