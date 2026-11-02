
require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "MAG_TUMAN_MAG AI" });
});

app.get("/api/config", (_req, res) => {
  res.json({
    appName: "MAG_TUMAN_MAG AI",
    imageEnabled: Boolean(process.env.OPENAI_API_KEY),
    videoEnabled: false
  });
});

app.post("/api/generate-image", async (req, res) => {
  const prompt = String(req.body?.prompt || "").trim();

  if (!prompt) {
    return res.status(400).json({ error: "Напиши описание изображения." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "Генерация изображений пока не подключена."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Не удалось создать изображение."
      });
    }

    const image = data.data?.[0]?.b64_json;

    if (!image) {
      return res.status(502).json({
        error: "Сервис не вернул изображение."
      });
    }

    res.json({ image: `data:image/png;base64,${image}` });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({
      error: "Ошибка сервера при создании изображения."
    });
  }
});

app.post("/api/generate-video", (_req, res) => {
  res.status(503).json({
    error: "Для генерации видео нужно подключить отдельный видеосервис."
  });
});

app.post("/telegram/webhook", async (req, res) => {
  console.log("TELEGRAM UPDATE:", JSON.stringify(req.body));

  res.sendStatus(200);

  const token = process.env.BOT_TOKEN;
  const message = req.body?.message;

  if (!token || !message?.chat?.id || !message?.text) {
    console.log("Нет текстового сообщения или BOT_TOKEN.");
    return;
  }

  if (message.text.startsWith("/start")) {
    const webAppUrl = process.env.WEB_APP_URL;

    if (!webAppUrl) {
      console.error("Не задан WEB_APP_URL.");
      return;
    }

    const payload = {
      chat_id: message.chat.id,
      text: "Добро пожаловать в MAG_TUMAN_MAG AI!",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "Открыть приложение",
            web_app: { url: webAppUrl }
          }
        ]]
      }
    };

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      console.log("TELEGRAM SEND MESSAGE:", result);
    } catch (err) {
      console.error("Telegram reply error:", err);
    }
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`MAG_TUMAN_MAG AI listening on ${port}`);

  const token = process.env.BOT_TOKEN;
  const webAppUrl = process.env.WEB_APP_URL;

  if (!token || !webAppUrl) {
    console.error("Не заданы BOT_TOKEN или WEB_APP_URL в Render.");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${webAppUrl.replace(/\/+$/, "")}/telegram/webhook`
        })
      }
    );

    const result = await response.json();
    console.log("Telegram webhook setup:", result);
  } catch (err) {
    console.error("Webhook setup error:", err);
  }
});
