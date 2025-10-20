const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// CORS fix
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => res.send("🎧 FM WebRTC Server running on Koyeb ✅"));

const clients = new Map();

function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  clients.set(id, ws);
  console.log(`🟢 Connected: ${id} (${clients.size} total)`);

  safeSend(ws, { type: "welcome", id });

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.to && clients.has(data.to)) {
        safeSend(clients.get(data.to), { ...data, from: id });
      }
    } catch (err) {
      console.error("Bad JSON:", err.message);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log(`🔴 Disconnected: ${id}`);
  });
});

// Keep alive
setInterval(() => {
  for (const ws of wss.clients) if (ws.readyState === ws.OPEN) ws.ping();
}, 20000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Listening on ${PORT}`));
