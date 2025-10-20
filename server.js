// server.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ✅ CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("🎧 FM Signaling Server Active ✅");
});

const clients = new Map(); // id => ws

// 🔁 Helper: broadcast to specific target
function sendTo(targetId, data) {
  const target = clients.get(targetId);
  if (target && target.readyState === target.OPEN) {
    target.send(JSON.stringify(data));
  }
}

// 💬 Handle WebSocket connections
wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  clients.set(id, ws);
  console.log(`🟢 Client connected: ${id} | Total: ${clients.size}`);

  ws.send(JSON.stringify({ type: "welcome", id }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.to && data.type) {
        sendTo(data.to, { ...data, from: id });
      }
    } catch (e) {
      console.error("❌ Invalid message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`🔴 Client disconnected: ${id} | Total: ${clients.size}`);
  });
});

// 🩵 Keep server alive
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.ping();
  });
}, 20000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
