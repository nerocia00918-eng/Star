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
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 // 100 MB for large database sync
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

  socket.on("database_changed", (data) => {
    // Broadcast database changes to all OTHER clients
    socket.broadcast.emit("sync_database", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Server-side diagnostic logs store
interface ServerLogEntry {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}

const serverLogs: ServerLogEntry[] = [];
let lastKnownProductCount = -1;

function addServerLog(type: string, message: string, details?: any, req?: any) {
  const entry: ServerLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
    ip: req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown',
    userAgent: req?.headers['user-agent'] || 'unknown'
  };
  serverLogs.unshift(entry);
  if (serverLogs.length > 200) serverLogs.pop();
  console.log(`[${entry.timestamp}] [${type}] ${message}`);
}

// Helper to proxy requests to Google Apps Script
async function proxyToGas(req: any, res: any, action: string, payload: any = null, retries = 2) {
  const gasUrl = req.headers['x-gas-url'];
  
  if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.startsWith('https://script.google.com/')) {
    return res.status(400).json({ error: "Missing or invalid Google Apps Script URL in settings." });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let response;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 seconds timeout

      if (req.method === 'GET') {
        const url = new URL(gasUrl);
        url.searchParams.append('action', action);
        response = await fetch(url.toString(), { signal: controller.signal });
      } else {
        // POST
        response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
          throw new Error(`GAS responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Track counts on successful getProducts or syncProducts
      if (action === 'getProducts' && Array.isArray(data)) {
        lastKnownProductCount = data.length;
        addServerLog('CLOUD_PULL', `Tải thành công ${data.length} sản phẩm từ Google Sheets`, { count: data.length }, req);
      } else if (action === 'syncProducts' && payload?.products) {
        const newCount = payload.products.length;
        const diff = lastKnownProductCount >= 0 ? newCount - lastKnownProductCount : 0;
        let warning = '';
        if (lastKnownProductCount >= 0 && newCount < lastKnownProductCount) {
          warning = ` [CẢNH BÁO: Số lượng giảm từ ${lastKnownProductCount} xuống ${newCount} (-${lastKnownProductCount - newCount} SP)]`;
        }
        lastKnownProductCount = newCount;
        addServerLog('CLOUD_PUSH', `Đã đồng bộ ${newCount} sản phẩm lên Google Sheets${warning}`, {
          count: newCount,
          diff,
          sampleCodes: payload.products.slice(0, 5).map((p: any) => p.code)
        }, req);
      }

      return res.json(data);
    } catch (error: any) {
      console.error(`Attempt ${attempt} - Error proxying to GAS (${action}):`, error.message || error);
      if (attempt === retries) {
        addServerLog('GAS_ERROR', `Lỗi kết nối Google Sheets khi gọi ${action}: ${error.message}`, { error: error.message, action }, req);
        return res.status(500).json({ 
          error: "Lỗi kết nối đến Google Sheets (Timeout). Vui lòng thử lại sau.",
          details: error.message 
        });
      }
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// API Routes
app.get("/api/products", (req, res) => proxyToGas(req, res, 'getProducts'));
app.post("/api/products/sync", (req, res) => {
  const products = req.body.products;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: "Invalid payload: products must be an array." });
  }
  return proxyToGas(req, res, 'syncProducts', { products });
});

app.get("/api/history", (req, res) => proxyToGas(req, res, 'getHistory'));
app.post("/api/history", (req, res) => proxyToGas(req, res, 'addHistory', { record: req.body }));
app.delete("/api/history", (req, res) => proxyToGas(req, res, 'clearHistory'));

// Diagnostic logs endpoint
app.get("/api/logs", (req, res) => {
  res.json({
    lastKnownProductCount,
    serverTime: new Date().toISOString(),
    logs: serverLogs
  });
});

app.post("/api/logs", (req, res) => {
  const { type, message, details } = req.body;
  addServerLog(type || 'CLIENT_LOG', message || 'Client event', details, req);
  res.json({ success: true });
});

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
