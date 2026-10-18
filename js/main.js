(function(){
  "use strict";

  const raids = CV.loadRaids();

  function renderStats(){
    const past = raids.filter(function(r){return r.type === "past";});
    const bags = past.reduce(function(s,r){return s + (Number(r.bags)||0);},0);
    const people = past.reduce(function(s,r){return s + (Number(r.participants)||0);},0);
    document.getElementById("statRaids").textContent = past.length;
    document.getElementById("statBags").textContent = bags;
    document.getElementById("statPeople").textContent = people;
  }

  function raidCard(r){
    const isUpcoming = r.type === "upcoming";
    const badge = isUpcoming
      ? '<span class="card-badge upcoming">' + CV.icon("clock") + 'Будет</span>'
      : '<span class="card-badge">' + CV.icon("check") + 'Проведён</span>';
    const imgBlock = r.image
      ? '<img src="' + r.image + '" alt="' + CV.escapeHtml(r.title) + '">'
      : '<div class="placeholder">' + CV.icon("image") + '</div>';
    const tags = (r.tags || []).map(function(t){
      return '<span class="tag">' + CV.escapeHtml(t) + '</span>';
    }).join("");
    const meta = [];
    meta.push('<span>' + CV.icon("calendar") + CV.escapeHtml(CV.formatDate(r.date)) + '</span>');
    if(r.time) meta.push('<span>' + CV.icon("clock") + CV.escapeHtml(r.time) + '</span>');
    if(r.location) meta.push('<span>' + CV.icon("location") + CV.escapeHtml(r.location) + '</span>');
    const extra = [];
    if(!isUpcoming){
      if(r.participants) extra.push('<span class="tag" style="background:var(--green-50)">' + CV.icon("users") + ' ' + r.participants + ' чел.</span>');
      if(r.bags) extra.push('<span class="tag" style="background:var(--green-50)">' + CV.icon("bag") + ' ' + r.bags + ' мешков</span>');
    }
    return '<article class="card">' +
      '<div class="card-img">' + badge + imgBlock + '</div>' +
      '<div class="card-body">' +
        '<h3>' + CV.escapeHtml(r.title) + '</h3>' +
        '<div class="card-meta">' + meta.join("") + '</div>' +
        '<p class="card-desc">' + CV.escapeHtml(r.description) + '</p>' +
        '<div class="card-tags">' + tags + extra.join("") + '</div>' +
      '</div>' +
    '</article>';
  }

  function renderRaids(filter){
    const grid = document.getElementById("raidsGrid");
    let list = raids.slice().sort(function(a,b){
      return (a.date || "").localeCompare(b.date || "");
    });
    if(filter === "past") list = list.filter(function(r){return r.type === "past";});
    else if(filter === "upcoming") list = list.filter(function(r){return r.type === "upcoming";});

    if(!list.length){
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        CV.icon("inbox") +
        '<h3>Пока пусто</h3>' +
        '<p>В этой категории ещё нет записей.</p>' +
      '</div>';
      return;
    }
    grid.innerHTML = list.map(raidCard).join("");
  }

  function renderUpcoming(){
    const wrap = document.getElementById("upcomingList");
    const now = Date.now();
    const list = raids.filter(function(r){
      return r.type === "upcoming" && (!r.date || new Date(r.date).getTime() >= now - 86400000);
    }).sort(function(a,b){
      return (a.date || "").localeCompare(b.date || "");
    });

    if(!list.length){
      wrap.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        CV.icon("calendar") +
        '<h3>Нет запланированных рейдов</h3>' +
        '<p>Следите за обновлениями — новые акции появятся здесь.</p>' +
      '</div>';
      return;
    }

    wrap.innerHTML = list.map(function(r){
      const d = CV.formatDateShort(r.date);
      const tags = (r.tags || []).map(function(t){
        return '<span class="tag">' + CV.escapeHtml(t) + '</span>';
      }).join("");
      return '<article class="upcoming-item">' +
        '<div class="date-block"><div class="d">' + d.d + '</div><div class="m">' + d.m + '</div></div>' +
        '<div class="upcoming-info">' +
          '<h3>' + CV.escapeHtml(r.title) + '</h3>' +
          '<p>' + CV.icon("location") + CV.escapeHtml(r.location) + '</p>' +
          '<p>' + CV.icon("clock") + (r.time || "—") + ' • ' + CV.escapeHtml(CV.formatDate(r.date)) + '</p>' +
          (r.description ? '<p style="margin-top:6px;color:var(--ink)">' + CV.escapeHtml(r.description) + '</p>' : '') +
          '<div class="card-tags" style="margin-top:8px">' + tags + '</div>' +
        '</div>' +
        '<div class="upcoming-actions">' +
          '<a href="#complaint" class="btn btn-ghost btn-sm">' + CV.icon("alert") + 'Сообщить о месте</a>' +
        '</div>' +
      '</article>';
    }).join("");
  }

  function setupTabs(){
    const tabs = document.querySelectorAll("#raidTabs .tab");
    tabs.forEach(function(t){
      t.addEventListener("click", function(){
        tabs.forEach(function(x){x.classList.remove("active");});
        t.classList.add("active");
        renderRaids(t.dataset.filter);
      });
    });
  }

  function setupBurger(){
    const burger = document.getElementById("burger");
    const links = document.getElementById("navLinks");
    if(!burger || !links) return;
    burger.addEventListener("click", function(){
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        links.classList.remove("open");
      });
    });
  }

  function setupComplaintForm(){
    const form = document.getElementById("complaintForm");
    const photo = document.getElementById("cPhoto");
    const photoLabel = document.getElementById("cPhotoLabel");
    const fileName = document.getElementById("cFileName");
    const preview = document.getElementById("cPreview");
    const alertBox = document.getElementById("complaintAlert");
    let photoData = "";

    photo.addEventListener("change", function(){
      const file = photo.files && photo.files[0];
      if(!file){
        photoData = "";
        photoLabel.textContent = "Нажмите, чтобы прикрепить фото";
        fileName.textContent = "";
        preview.style.display = "none";
        preview.innerHTML = "";
        return;
      }
      if(file.size > 4 * 1024 * 1024){
        alertBox.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Файл слишком большой. Максимум 4 МБ.</div></div>';
        photo.value = "";
        return;
      }
      fileName.textContent = file.name;
      photoLabel.textContent = "Фото выбрано";
      const reader = new FileReader();
      reader.onload = function(e){
        photoData = e.target.result;
        preview.style.display = "block";
        preview.innerHTML = '<img src="' + photoData + '" alt="превью">';
      };
      reader.readAsDataURL(file);
    });

    form.addEventListener("submit", function(e){
      e.preventDefault();
      const name = document.getElementById("cName").value.trim();
      const address = document.getElementById("cAddress").value.trim();
      const problem = document.getElementById("cProblem").value.trim();
      if(!name || !address || !problem){
        alertBox.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Заполните все обязательные поля.</div></div>';
        return;
      }
      const complaints = CV.loadComplaints();
      complaints.unshift({
        id: CV.genId("c"),
        name: name,
        address: address,
        problem: problem,
        photo: photoData,
        status: "new",
        createdAt: new Date().toISOString()
      });
      CV.saveComplaints(complaints);
      form.reset();
      photoData = "";
      photoLabel.textContent = "Нажмите, чтобы прикрепить фото";
      fileName.textContent = "";
      preview.style.display = "none";
      preview.innerHTML = "";
      alertBox.innerHTML = '<div class="alert alert-success">' + CV.icon("check") + '<div>Спасибо! Жалоба отправлена. Мы рассмотрим её и добавим место в план рейдов.</div></div>';
      CV.toast("Жалоба отправлена");
    });
  }

  function setupFab(){
    const fab = document.getElementById("fabTop");
    if(!fab) return;
    window.addEventListener("scroll", function(){
      if(window.scrollY > 600) fab.style.display = "flex";
      else fab.style.display = "none";
    });
    fab.addEventListener("click", function(){
      window.scrollTo({top:0, behavior:"smooth"});
    });
  }

  function setupYear(){
    const el = document.getElementById("year");
    if(el) el.textContent = new Date().getFullYear();
  }

  function setupLogoCheck(){
    const slots = document.querySelectorAll(".brand-logo");
    if(!slots.length) return;
    const test = new Image();
    test.onload = function(){
      slots.forEach(function(slot){
        slot.innerHTML = '<img src="logo.png" alt="Логотип Чистые Выселки">';
      });
    };
    test.src = "logo.png";
  }

  document.addEventListener("DOMContentLoaded", function(){
    renderStats();
    renderRaids("all");
    renderUpcoming();
    setupTabs();
    setupBurger();
    setupComplaintForm();
    setupFab();
    setupYear();
    setupLogoCheck();
  });
})();
