import { WebSocketServer } from "ws";
import { createServer } from "http";

const clients = new Map();

function safeSend(ws, data) {
  try {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
  } catch (_) {}
}

function uid() {
  return crypto.randomUUID();
}

const server = createServer((req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  if (req.method === "OPTIONS") return res.end();
  res.end("🎧 Node FM WebRTC Signaling Server Live!");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const id = uid();
  clients.set(id, { ws });
  console.log("🔗 Connected:", id);

  safeSend(ws, { type: "connected", id });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      const { type, role, target, payload } = data;

      if (type === "register") {
        clients.get(id).role = role;
        console.log(`🧩 ${id} registered as ${role}`);

        if (role === "listener") {
          for (const [, c] of clients)
            if (c.role === "broadcaster")
              safeSend(c.ws, { type: "listener-joined", id });
        }
      }

      if (["offer", "answer", "candidate"].includes(type) && target) {
        const t = clients.get(target);
        if (t) safeSend(t.ws, { type, from: id, payload });
      }
    } catch (err) {
      console.error("⚠️ Parse error:", err);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    console.log("❌ Disconnected:", id);
    for (const [, c] of clients)
      if (c.role === "broadcaster")
        safeSend(c.ws, { type: "peer-left", id });
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("🎧 FM Signaling Server Ready on port 3000");
});

export default server;
