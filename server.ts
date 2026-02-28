import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Socket.io for real-time selection sync
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("selection_changed", (data) => {
    // Broadcast to all OTHER clients
    socket.broadcast.emit("sync_selection", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Helper to proxy requests to Google Apps Script
async function proxyToGas(req: any, res: any, action: string, payload: any = null) {
  const gasUrl = req.headers['x-gas-url'];
  
  if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.startsWith('https://script.google.com/')) {
    // Return empty array for GET requests if no URL is configured, to not break the app
    if (req.method === 'GET') return res.json([]);
    return res.status(400).json({ error: "Missing or invalid Google Apps Script URL in settings." });
  }

  try {
    let response;
    if (req.method === 'GET') {
      const url = new URL(gasUrl);
      url.searchParams.append('action', action);
      response = await fetch(url.toString());
    } else {
      // POST
      response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
    }

    if (!response.ok) {
        throw new Error(`GAS responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`Error proxying to GAS (${action}):`, error);
    res.status(500).json({ error: "Failed to communicate with Google Sheets." });
  }
}

// API Routes
app.get("/api/products", (req, res) => proxyToGas(req, res, 'getProducts'));
app.post("/api/products/sync", (req, res) => proxyToGas(req, res, 'syncProducts', { products: req.body.products }));

app.get("/api/history", (req, res) => proxyToGas(req, res, 'getHistory'));
app.post("/api/history", (req, res) => proxyToGas(req, res, 'addHistory', { record: req.body }));
app.delete("/api/history", (req, res) => proxyToGas(req, res, 'clearHistory'));

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
