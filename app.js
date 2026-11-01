const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const promptEl = document.getElementById("prompt");
const imageBtn = document.getElementById("imageBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

imageBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) { statusEl.textContent = "Сначала напиши описание изображения."; return; }
  imageBtn.disabled = true;
  resultEl.hidden = true;
  statusEl.textContent = "Создаю изображение…";
  try {
    const r = await fetch("/api/generate-image", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({prompt})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Не удалось создать изображение.");
    resultEl.src = data.image;
    resultEl.hidden = false;
    statusEl.textContent = "Готово!";
  } catch (e) { statusEl.textContent = e.message; }
  finally { imageBtn.disabled = false; }
});

document.getElementById("videoBtn").addEventListener("click", async () => {
  const el = document.getElementById("videoStatus");
  try {
    const r = await fetch("/api/generate-video", {method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
    const data = await r.json();
    el.textContent = data.error || "Видео пока не подключено.";
  } catch { el.textContent = "Не удалось проверить видеосервис."; }
});
