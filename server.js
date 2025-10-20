// Fast, crash-proof WebSocket Signaling Server
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.get("/", (req, res) => {
  res.send("🎧 KoyebFM Node 24 Server Live!");
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map(); // id → { ws, role }

function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
}

// keep alive
setInterval(() => {
  for (const [, c] of clients) {
    if (c.ws.readyState === c.ws.OPEN) safeSend(c.ws, { type: "ping" });
  }
}, 25000);

wss.on("connection", (ws) => {
  const id = crypto.randomUUID();
  clients.set(id, { ws });
  console.log("🔗 Connected:", id);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type, role, target, payload } = msg;

    // Register
    if (type === "register") {
      clients.get(id).role = role;
      console.log(`🧩 ${id} registered as ${role}`);
      if (role === "listener") {
        for (const [, c] of clients)
          if (c.role === "broadcaster")
            safeSend(c.ws, { type: "listener-joined", id });
      }
    }

    // Relay
    if (["offer", "answer", "candidate"].includes(type) && target) {
      const t = clients.get(target);
      if (t) safeSend(t.ws, { type, from: id, payload });
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("❌ Disconnected:", id);
    for (const [, c] of clients])
      if (c.role === "broadcaster") safeSend(c.ws, { type: "peer-left", id });
  });

  ws.on("error", (err) => console.error("⚠️ WebSocket error:", err.message));
});

server.keepAliveTimeout = 70000;
server.headersTimeout = 75000;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ KoyebFM running on ${PORT}`));
