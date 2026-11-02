
document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#111018");
    tg.setBackgroundColor("#111018");
  }

  const promptEl = document.getElementById("prompt");
  const imageBtn = document.getElementById("imageBtn");
  const statusEl = document.getElementById("status");
  const resultEl = document.getElementById("result");
  const videoBtn = document.getElementById("videoBtn");
  const videoStatus = document.getElementById("videoStatus");

  if (!promptEl || !imageBtn || !statusEl || !resultEl) {
    console.error("Не найдены элементы интерфейса.");
    return;
  }

  imageBtn.addEventListener("click", async () => {
    const prompt = promptEl.value.trim();

    if (!prompt) {
      statusEl.textContent = "Сначала напиши описание изображения.";
      return;
    }

    imageBtn.disabled = true;
    resultEl.hidden = true;
    statusEl.textContent = "Создаю изображение…";

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать изображение.");
      }

      resultEl.src = data.image;
      resultEl.hidden = false;
      statusEl.textContent = "Готово!";
    } catch (error) {
      statusEl.textContent = error.message || "Ошибка создания изображения.";
    } finally {
      imageBtn.disabled = false;
    }
  });

  if (videoBtn) {
    videoBtn.addEventListener("click", async () => {
      videoBtn.disabled = true;
      videoStatus.textContent = "Проверяю видеосервис…";

      try {
        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}"
        });

        const data = await response.json();
        videoStatus.textContent = data.error || "Видео пока не подключено.";
      } catch {
        videoStatus.textContent = "Не удалось проверить видеосервис.";
      } finally {
        videoBtn.disabled = false;
      }
    });
  }
});
