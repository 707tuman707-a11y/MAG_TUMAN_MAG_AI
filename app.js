const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor?.("#0a1020"); tg.setBackgroundColor?.("#080d1d"); }
const initData = tg?.initData || "";
const headers = {"Content-Type":"application/json","X-Telegram-Init-Data":initData};
let currentType = "image";
const $ = id => document.getElementById(id);
async function api(url, options={}) {
  const r = await fetch(url,{...options,headers:{...headers,...(options.headers||{})}});
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}
function openModal(type){
  currentType=type; $("modal").classList.remove("hidden"); $("notice").textContent="";
  const titles={image:"Генерация изображения",video:"Генерация видео",prompt:"Промпт по фото",assistant:"ИИ-ассистент"};
  $("modalTitle").textContent=titles[type]||"Создать";
  $("modalHint").textContent=type==="prompt"?"Прикрепи фотографию — функция анализа подключается через AI-провайдера.":"Опиши результат, который хочешь получить.";
  $("uploadBox").style.display=type==="prompt"?"block":"none";
  $("generateBtn").textContent=type==="assistant"?"Отправить":"Создать";
}
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.open)));
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("buyBtn").onclick=()=>{ $("notice").textContent="Подключите Telegram Payments или платёжного провайдера, чтобы принимать оплату."; openModal("assistant"); $("modalTitle").textContent="Покупка кредитов"; };
$("generateBtn").onclick=async()=>{
  const prompt=$("promptInput").value.trim();
  if(!prompt){$("notice").textContent="Сначала напиши описание.";return;}
  $("generateBtn").disabled=true;$("generateBtn").textContent="Отправка...";
  try{await api("/api/generate",{method:"POST",body:JSON.stringify({type:currentType,prompt})});}
  catch(e){$("notice").textContent=e.message;}
  finally{$("generateBtn").disabled=false;$("generateBtn").textContent="Создать";}
};
$("uploadBox").onclick=()=>$("photoInput").click();
document.querySelectorAll("[data-tab='profile']").forEach(b=>b.onclick=()=>$("profileModal").classList.remove("hidden"));
document.querySelectorAll("[data-close-profile]").forEach(b=>b.onclick=()=>$("profileModal").classList.add("hidden"));
$("tasksBtn").onclick=async()=>{ $("tasksModal").classList.remove("hidden"); try{const tasks=await api("/api/tasks");$("taskList").innerHTML=tasks.map(t=>`<div><span>${t.title}</span><b>◇ ${t.reward}</b></div>`).join("");}catch(e){$("taskList").textContent=e.message;} };
document.querySelectorAll("[data-close-tasks]").forEach(b=>b.onclick=()=>$("tasksModal").classList.add("hidden"));
$("allTrends").onclick=()=>document.querySelector(".feature-list").scrollIntoView({behavior:"smooth"});
(async()=>{try{const me=await api("/api/me");$("userName").textContent=me.user.name;$("userHandle").textContent=me.user.username?"@"+me.user.username:"Telegram user";$("balanceTop").textContent=me.balance;$("balanceProfile").textContent=me.balance;}catch(e){$("notice").textContent=e.message;}})();
