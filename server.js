// server.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ✅ Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("🎧 FM Signaling Server Running Smoothly ✅");
});

const clients = new Map();

// ✅ Safe message send
function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  clients.set(id, ws);
  console.log(`🟢 Connected: ${id} | Total: ${clients.size}`);

  safeSend(ws, { type: "welcome", id });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.to && clients.has(data.to)) {
        safeSend(clients.get(data.to), { ...data, from: id });
      }
    } catch (e) {
      console.error("Invalid message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`🔴 Disconnected: ${id} | Total: ${clients.size}`);
  });
});

// 🔁 Keep alive
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.ping();
  }
}, 25000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server live on port ${PORT}`));
