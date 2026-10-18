window.CV = window.CV || {};

CV.DEFAULT_RAIDS = [
  {
    id: "r-001",
    type: "past",
    title: "Очистка берега реки Журавка",
    date: "2025-09-14",
    time: "09:00",
    location: "Станица Выселки, ул. Береговая, 1-15",
    description: "Собрали 42 мешка бытового мусора вдоль берега реки. Очистили от пластика и металла зону отдыха и подходы к воде. Участвовали 18 волонтёров.",
    image: "",
    tags: ["Берег", "Пластик", "Металл"],
    participants: 18,
    bags: 42
  },
  {
    id: "r-002",
    type: "past",
    title: "Субботник у парка Победы",
    date: "2025-08-23",
    time: "08:30",
    location: "Парк Победы, ул. Ленина, 50",
    description: "Уборка парковой зоны, сбор листвы, бытового мусора и веток. Вывезено три контейнера отходов. Совместно с администрацией поселения.",
    image: "",
    tags: ["Парк", "Листва", "Совместно"],
    participants: 27,
    bags: 35
  },
  {
    id: "r-003",
    type: "past",
    title: "Очистка лесополосы у трассы Р-217",
    date: "2025-07-12",
    time: "10:00",
    location: "Лесополоса вдоль трассы Р-217",
    description: "Убрана обочина на протяжении 1,2 км. Собраны пластиковые бутылки, упаковка и строительный мусор. Приняли участие местные жители и волонтёры из Краснодара.",
    image: "",
    tags: ["Трасса", "Строймусор", "Пластик"],
    participants: 14,
    bags: 28
  },
  {
    id: "r-004",
    type: "upcoming",
    title: "Большой осенний рейд по улицам Восточная и Садовая",
    date: "2026-10-25",
    time: "09:00",
    location: "Ул. Восточная и ул. Садовая",
    description: "Планируем масштабная уборка двух улиц с большим скоплением бытового мусора. Приглашаем всех неравнодушных жителей. Встречаемся у магазина Магнит на ул. Восточная, 12. Принесите перчатки, воду и хорошее настроение.",
    image: "",
    tags: ["Осень", "Две улицы", "Волонтёры"],
    participants: 0,
    bags: 0
  },
  {
    id: "r-005",
    type: "upcoming",
    title: "Очистка родника у хутора Бузыган",
    date: "2026-11-08",
    time: "10:30",
    location: "Родник у хутора Бузыган",
    description: "Очистка территории вокруг родника от бытового мусора и сухостоя. Планируем установить небольшой информационный стенд. Встречаемся у въезда в хутор.",
    image: "",
    tags: ["Родник", "Природа", "Стенд"],
    participants: 0,
    bags: 0
  }
];

CV.DEFAULT_COMPLAINTS = [];

CV.STORAGE_KEYS = {
  raids: "cv_raids_v1",
  complaints: "cv_complaints_v1",
  auth: "cv_admin_auth_v1"
};

CV.loadRaids = function(){
  try{
    const stored = localStorage.getItem(CV.STORAGE_KEYS.raids);
    if(stored) return JSON.parse(stored);
  }catch(e){}
  return JSON.parse(JSON.stringify(CV.DEFAULT_RAIDS));
};

CV.saveRaids = function(raids){
  localStorage.setItem(CV.STORAGE_KEYS.raids, JSON.stringify(raids));
};

CV.loadComplaints = function(){
  try{
    const stored = localStorage.getItem(CV.STORAGE_KEYS.complaints);
    if(stored) return JSON.parse(stored);
  }catch(e){}
  return JSON.parse(JSON.stringify(CV.DEFAULT_COMPLAINTS));
};

CV.saveComplaints = function(complaints){
  localStorage.setItem(CV.STORAGE_KEYS.complaints, JSON.stringify(complaints));
};

CV.genId = function(prefix){
  return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,7);
};

CV.formatDate = function(dateStr){
  if(!dateStr) return "";
  const months = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const d = new Date(dateStr);
  if(isNaN(d)) return dateStr;
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
};

CV.formatDateShort = function(dateStr){
  if(!dateStr) return {d:"--",m:"---"};
  const months = ["ЯНВ","ФЕВ","МАР","АПР","МАЯ","ИЮН","ИЮЛ","АВГ","СЕН","ОКТ","НОЯ","ДЕК"];
  const d = new Date(dateStr);
  if(isNaN(d)) return {d:"--",m:"---"};
  return {d:String(d.getDate()).padStart(2,"0"), m:months[d.getMonth()]};
};

CV.escapeHtml = function(str){
  if(str == null) return "";
  return String(str).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
};

CV.isAuthed = function(){
  try{
    return sessionStorage.getItem(CV.STORAGE_KEYS.auth) === "1";
  }catch(e){return false;}
};

CV.setAuthed = function(val){
  if(val) sessionStorage.setItem(CV.STORAGE_KEYS.auth,"1");
  else sessionStorage.removeItem(CV.STORAGE_KEYS.auth);
};

CV.toast = function(message){
  let el = document.getElementById("cv-toast");
  if(!el){
    el = document.createElement("div");
    el.id = "cv-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg><span>' + CV.escapeHtml(message) + '</span>';
  el.classList.add("show");
  clearTimeout(CV._toastTimer);
  CV._toastTimer = setTimeout(function(){el.classList.remove("show");}, 2600);
};
