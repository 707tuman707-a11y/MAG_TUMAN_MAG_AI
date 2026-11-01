require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const DEMO_MODE = process.env.DEMO_MODE === "true";

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

function validateTelegramInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now()/1000 - authDate > 86400) return null;
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const a = Buffer.from(calculated, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { return JSON.parse(params.get("user") || "null"); } catch { return null; }
}

function auth(req, res, next) {
  const initData = req.headers["x-telegram-init-data"] || "";
  const user = validateTelegramInitData(initData);
  if (user) { req.tgUser = user; return next(); }
  if (DEMO_MODE) {
    req.tgUser = { id: 100001, first_name: "Гость", username: "demo_user" };
    return next();
  }
  return res.status(401).json({ error: "Telegram authentication required" });
}

app.get("/api/config", (req, res) => res.json({ demoMode: DEMO_MODE, appName: "MAG_TUMAN_MAG AI" }));
app.get("/api/me", auth, (req, res) => {
  res.json({
    user: { id: req.tgUser.id, name: req.tgUser.first_name || "Пользователь",
      username: req.tgUser.username || "" },
    balance: 181, plan: "Стартовый", generations: 0
  });
});
app.get("/api/tasks", auth, (req, res) => res.json([
  { id: 1, title: "Познакомиться с MAG_TUMAN_MAG AI", reward: 10, done: false },
  { id: 2, title: "Создать первую картинку", reward: 15, done: false },
  { id: 3, title: "Поделиться приложением с другом", reward: 20, done: false }
]));
app.post("/api/generate", auth, async (req, res) => {
  const { type, prompt } = req.body || {};
  if (!["image", "video", "prompt"].includes(type) || !prompt || prompt.length > 3000)
    return res.status(400).json({ error: "Укажите тип и описание (до 3000 символов)." });
  // Provider integrations are intentionally not faked. Connect your chosen AI API here.
  return res.status(503).json({
    error: "AI-провайдер ещё не подключён.",
    detail: "Добавьте API-ключ и интеграцию в services/ai.js. Интерфейс и Telegram-авторизация уже готовы."
  });
});
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`MAG_TUMAN_MAG AI running on port ${PORT}`));
