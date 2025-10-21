import { WebSocketServer } from "ws";
import { createServer } from "http";

let wss; // keep one instance per cold start

export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.end();

  // Create server + WebSocket only once
  if (!wss) {
    const server = createServer();
    wss = new WebSocketServer({ server });

    const clients = new Map();

    function safeSend(ws, data) {
      try {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
      } catch {}
    }

    function uid() {
      return crypto.randomUUID();
    }

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
        for (const [, c] of clients)
          if (c.role === "broadcaster") safeSend(c.ws, { type: "peer-left", id });
      });
    });

    server.listen(0, () => console.log("🎧 WebSocket layer active"));
  }

  res.statusCode = 200;
  res.end("🎧 Node FM WebRTC Signaling Server Live!");
}
