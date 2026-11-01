require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => res.json({ ok: true, app: "MAG_TUMAN_MAG AI" }));
app.get("/api/config", (_req, res) => {
  res.json({ appName: "MAG_TUMAN_MAG AI", imageEnabled: Boolean(process.env.OPENAI_API_KEY), videoEnabled: false });
});

app.post("/api/generate-image", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "Напиши описание изображения." });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Генерация изображений пока не подключена. На Render добавь OPENAI_API_KEY." });
  }
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024" })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Не удалось создать изображение." });
    }
    const image = data.data?.[0]?.b64_json;
    if (!image) return res.status(502).json({ error: "Сервис не вернул изображение." });
    res.json({ image: `data:image/png;base64,${image}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера при создании изображения." });
  }
});

app.post("/api/generate-video", (_req, res) => {
  res.status(503).json({ error: "Генерация видео пока не подключена. Для неё нужен отдельный видеосервис и его API-ключ." });
});

app.post("/telegram/webhook", async (req, res) => {
  res.sendStatus(200);
  const token = process.env.BOT_TOKEN;
  const message = req.body?.message;
  if (!token || !message?.chat?.id || !message?.text) return;
  if (message.text.startsWith("/start")) {
    const webAppUrl = process.env.WEB_APP_URL;
    const payload = {
      chat_id: message.chat.id,
      text: "Добро пожаловать в MAG_TUMAN_MAG AI!",
      ...(webAppUrl ? { reply_markup: { inline_keyboard: [[{ text: "Открыть приложение", web_app: { url: webAppUrl } }]] } } : {})
    };
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error("Telegram reply error:", e); }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`MAG_TUMAN_MAG AI listening on ${port}`));
