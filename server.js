const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const STORE_PHONE_LOCAL = "01008597069";
const STORE_PHONE_WHATSAPP = "201008597069";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]\n", "utf8");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1000000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function safeStaticPath(urlPath) {
  const cleanUrl = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanUrl === "/" ? "/index.html" : cleanUrl;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

function validateOrder(order) {
  const errors = [];
  if (!order || typeof order !== "object") errors.push("بيانات الطلب غير صحيحة.");
  if (!order.customer || !order.customer.name || !order.customer.name.trim()) errors.push("اكتب اسم العميل.");
  if (!order.customer || !order.customer.phone || !order.customer.phone.trim()) errors.push("اكتب رقم هاتف العميل.");
  if (!order.customer || !order.customer.address || !order.customer.address.trim()) errors.push("اكتب عنوان التوصيل.");
  if (!Array.isArray(order.items) || order.items.length === 0) errors.push("اختر باقة أو منتج واحد على الأقل.");
  return errors;
}

function saveOrder(order) {
  ensureStore();
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8") || "[]");
  const savedOrder = Object.assign({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "new" }, order);
  orders.unshift(savedOrder);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2) + "\n", "utf8");
  return savedOrder;
}

async function handleOrder(req, res) {
  try {
    const raw = await readBody(req);
    const order = JSON.parse(raw || "{}");
    const errors = validateOrder(order);
    if (errors.length) return sendJson(res, 400, { ok: false, errors });
    const saved = saveOrder(order);
    return sendJson(res, 201, { ok: true, orderId: saved.id, storePhone: STORE_PHONE_LOCAL, whatsappNumber: STORE_PHONE_WHATSAPP });
  } catch (error) {
    return sendJson(res, 500, { ok: false, errors: ["تعذر حفظ الطلب الآن."] });
  }
}

function serveStatic(req, res) {
  const filePath = safeStaticPath(req.url);
  if (!filePath) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream", "cache-control": "public, max-age=300" });
    res.end(data);
  });
}

ensureStore();
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/orders") return handleOrder(req, res);
  if (req.method === "GET" && req.url === "/api/health") return sendJson(res, 200, { ok: true, storePhone: STORE_PHONE_LOCAL });
  if (req.method === "GET") return serveStatic(req, res);
  sendJson(res, 405, { ok: false, errors: ["Method not allowed"] });
});
server.listen(PORT, () => console.log("Didi Store is running on http://localhost:" + PORT));
