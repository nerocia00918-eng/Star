import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("selection_changed", (data) => socket.broadcast.emit("sync_selection", data));
  socket.on("database_changed", (data) => socket.broadcast.emit("sync_database", data));
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

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
    ip: req?.headers["x-forwarded-for"] || req?.socket?.remoteAddress || "unknown",
    userAgent: req?.headers["user-agent"] || "unknown"
  };
  serverLogs.unshift(entry);
  if (serverLogs.length > 200) serverLogs.pop();
  console.log(`[${entry.timestamp}] [${type}] ${message}`);
}

function getGasUrl(req: any, res: any): string | null {
  const gasUrl = req.headers["x-gas-url"];
  if (!gasUrl || typeof gasUrl !== "string" || !gasUrl.startsWith("https://script.google.com/")) {
    res.status(400).json({ error: "Missing or invalid Google Apps Script URL in settings." });
    return null;
  }
  return gasUrl;
}

async function callGas(gasUrl: string, action: string, method: "GET" | "POST", payload?: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);
  try {
    let url = gasUrl;
    const options: RequestInit = { method, signal: controller.signal };
    if (method === "GET") {
      const target = new URL(gasUrl);
      target.searchParams.set("action", action);
      url = target.toString();
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify({ action, ...payload });
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`GAS responded with status: ${response.status}`);
    const data: any = await response.json();
    if (data && typeof data === "object" && data.error) throw new Error(String(data.error));
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function proxyToGas(req: any, res: any, action: string, payload: any = null, retries = 2) {
  const gasUrl = getGasUrl(req, res);
  if (!gasUrl) return;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await callGas(gasUrl, action, req.method === "GET" ? "GET" : "POST", payload);
      if (action === "getProducts" && Array.isArray(data)) {
        lastKnownProductCount = data.length;
        addServerLog("CLOUD_PULL", `Tải thành công ${data.length} sản phẩm từ Google Sheets`, { count: data.length }, req);
      }
      return res.json(data);
    } catch (error: any) {
      console.error(`Attempt ${attempt} - Error proxying to GAS (${action}):`, error.message || error);
      if (attempt === retries) {
        addServerLog("GAS_ERROR", `Lỗi kết nối Google Sheets khi gọi ${action}: ${error.message}`, { error: error.message, action }, req);
        return res.status(500).json({ error: "Lỗi kết nối đến Google Sheets. Vui lòng thử lại sau.", details: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

function asFiniteNonNegative(value: any, field: string, code: string): number {
  const number = value === "" || value === null || value === undefined ? 0 : Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Sản phẩm ${code}: ${field} phải là số không âm.`);
  return number;
}

function normalizeSpecs(value: any, code: string): string {
  let specs = value;
  if (typeof specs === "string") {
    try { specs = JSON.parse(specs); } catch { throw new Error(`Sản phẩm ${code}: specs phải là JSON hợp lệ.`); }
  }
  if (specs === null || specs === undefined) specs = [];
  if (!Array.isArray(specs)) throw new Error(`Sản phẩm ${code}: specs phải là một danh sách.`);
  for (const [index, spec] of specs.entries()) {
    if (!spec || typeof spec !== "object" || typeof spec.label !== "string" || typeof spec.value !== "string") {
      throw new Error(`Sản phẩm ${code}: thông số thứ ${index + 1} cần có label và value dạng chuỗi.`);
    }
  }
  return JSON.stringify(specs);
}

function mapProductsToSheet(input: any[], cloudRows: any[]) {
  const existingIds = new Map<string, string>();
  for (const row of cloudRows) {
    const code = String(row?.code ?? "").trim().toLowerCase();
    const id = String(row?.id ?? "").trim();
    if (code && id) existingIds.set(code, id);
  }
  const seenCodes = new Set<string>();
  return input.map((raw: any, index: number) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`Dòng ${index + 1}: dữ liệu sản phẩm không hợp lệ.`);
    const code = String(raw.code ?? "").trim();
    if (!code) throw new Error(`Dòng ${index + 1}: thiếu mã sản phẩm (code).`);
    const key = code.toLowerCase();
    if (seenCodes.has(key)) throw new Error(`Mã sản phẩm bị trùng: ${code}.`);
    seenCodes.add(key);
    const name = String(raw.name ?? "").trim();
    if (!name) throw new Error(`Sản phẩm ${code}: thiếu tên (name).`);
    const price = asFiniteNonNegative(raw.price, "price", code);
    const salePrice = asFiniteNonNegative(raw.salePrice ?? raw.sale_price, "salePrice", code);
    const isGiftPromo = raw.isGiftPromo === true || raw.isGiftPromo === "true" || raw.showGift === true;
    return {
      id: String(raw.id ?? existingIds.get(key) ?? randomUUID()),
      code,
      name,
      price,
      link: String(raw.link ?? "").trim(),
      salePrice,
      campaignName: String(raw.campaignName ?? raw.promoTitle ?? ""),
      isGiftPromo,
      giftName: String(raw.giftName ?? raw.gift ?? ""),
      specs: normalizeSpecs(raw.specs, code),
      warranty: String(raw.warranty ?? "")
    };
  });
}

// The Apps Script syncProducts implementation clears existing rows and rewrites them.
// Fetch cloud state first and refuse empty/markedly incomplete replacement payloads.
app.get("/api/products", (req, res) => proxyToGas(req, res, "getProducts"));
app.post("/api/products/sync", async (req, res) => {
  const gasUrl = getGasUrl(req, res);
  if (!gasUrl) return;
  const incoming = req.body?.products;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: "Đã chặn đồng bộ: danh sách sản phẩm gửi lên rỗng hoặc không hợp lệ." });
  }

  try {
    const cloud = await callGas(gasUrl, "getProducts", "GET");
    if (!Array.isArray(cloud)) {
      throw new Error("Apps Script getProducts không trả về danh sách sản phẩm; đã chặn ghi đè.");
    }
    if (cloud.length === 0) {
      addServerLog("SYNC_BLOCKED", "Chặn sync vì Google Sheets trả về danh sách rỗng", { incomingCount: incoming.length }, req);
      return res.status(409).json({ error: "Đã chặn đồng bộ: Google Sheets hiện trả về 0 sản phẩm. Kiểm tra Sheet trước khi ghi để tránh ghi nhầm/ghi đè." });
    }

    const minAllowed = Math.max(1, Math.ceil(cloud.length * 0.75));
    if (incoming.length < minAllowed) {
      addServerLog("SYNC_BLOCKED", "Chặn sync vì danh sách gửi lên thiếu bất thường so với cloud", { cloudCount: cloud.length, incomingCount: incoming.length, minAllowed }, req);
      return res.status(409).json({ error: `Đã chặn đồng bộ: danh sách gửi lên có ${incoming.length} sản phẩm, thấp hơn ngưỡng an toàn ${minAllowed} (Sheet hiện có ${cloud.length}). Tải lại dữ liệu hoặc khôi phục backup rồi thử lại.` });
    }

    const products = mapProductsToSheet(incoming, cloud);
    const result: any = await callGas(gasUrl, "syncProducts", "POST", { products });
    if (result?.success === false) throw new Error(result.error || "Apps Script báo đồng bộ thất bại.");
    lastKnownProductCount = products.length;
    const droppedCount = Math.max(0, cloud.length - products.length);
    addServerLog("CLOUD_PUSH", `Đã đồng bộ ${products.length} sản phẩm lên Google Sheets`, {
      cloudCountBefore: cloud.length,
      count: products.length,
      droppedCount,
      schema: ["id", "code", "name", "price", "link", "salePrice", "campaignName", "isGiftPromo", "giftName", "specs", "warranty"],
      sampleCodes: products.slice(0, 5).map((p: any) => p.code)
    }, req);
    return res.json({ ...result, count: products.length, schema: ["id", "code", "name", "price", "link", "salePrice", "campaignName", "isGiftPromo", "giftName", "specs", "warranty"] });
  } catch (error: any) {
    console.error("Error validating/syncing products:", error.message || error);
    addServerLog("GAS_ERROR", `Không thể kiểm tra hoặc đồng bộ sản phẩm: ${error.message}`, { error: error.message, action: "syncProducts" }, req);
    return res.status(500).json({ error: error.message || "Không thể đồng bộ sản phẩm." });
  }
});

app.get("/api/history", (req, res) => proxyToGas(req, res, "getHistory"));
app.post("/api/history", (req, res) => proxyToGas(req, res, "addHistory", { record: req.body }));
app.delete("/api/history", (req, res) => proxyToGas(req, res, "clearHistory"));

app.get("/api/logs", (_req, res) => {
  res.json({ lastKnownProductCount, serverTime: new Date().toISOString(), logs: serverLogs });
});
app.post("/api/logs", (req, res) => {
  const { type, message, details } = req.body;
  addServerLog(type || "CLIENT_LOG", message || "Client event", details, req);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }
  httpServer.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
