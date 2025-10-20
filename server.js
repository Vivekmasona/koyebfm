import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

const server = app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Server running on port " + (process.env.PORT || 3000));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg.toString());
    });
  });
});

app.get("/", (_, res) => res.send("🎧 KoyebFM WebSocket Server Online")); 
