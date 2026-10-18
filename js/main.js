(function(){
  "use strict";

  let raids = CV.loadRaidsCached();
  let activeFilter = "all";

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
    const allImages = (r.images && r.images.length) ? r.images.slice() : (r.image ? [r.image] : []);
    const photoCount = allImages.length;
    const imgBlock = photoCount
      ? '<img src="' + allImages[0] + '" alt="' + CV.escapeHtml(r.title) + '">'
      : '<div class="placeholder">' + CV.icon("image") + '</div>';
    const photoBadge = photoCount > 1
      ? '<span class="photo-badge">' + CV.icon("camera") + photoCount + '</span>'
      : '';
    const clickableAttrs = photoCount ? ' data-raid-id="' + r.id + '" role="button" tabindex="0" aria-label="Открыть фото рейда"' : '';
    const imgWrap = photoCount
      ? '<div class="card-img-clickable"' + clickableAttrs + '>' + badge + photoBadge + imgBlock + '</div>'
      : '<div class="card-img">' + badge + photoBadge + imgBlock + '</div>';
    const tags = (r.tags || []).map(function(t){
      return '<span class="tag">' + CV.escapeHtml(t) + '</span>';
    }).join("");
    const meta = [];
    meta.push('<span>' + CV.icon("calendar") + CV.escapeHtml(CV.formatDate(r.date)) + '</span>');
    if(r.time) meta.push('<span>' + CV.icon("clock") + CV.escapeHtml(r.time) + '</span>');
    if(r.location) meta.push('<span>' + CV.icon("location") + CV.escapeHtml(r.location) + '</span>');
    const extra = [];
    if(!isUpcoming){
      if(r.participants) extra.push('<span class="tag">' + CV.icon("users") + r.participants + ' чел.</span>');
      if(r.bags) extra.push('<span class="tag">' + CV.icon("bag") + r.bags + ' мешков</span>');
    }
    return '<article class="card">' +
      imgWrap +
      '<div class="card-body">' +
        '<h3>' + CV.escapeHtml(r.title) + '</h3>' +
        '<div class="card-meta">' + meta.join("") + '</div>' +
        '<p class="card-desc">' + CV.escapeHtml(r.description) + '</p>' +
        (photoCount > 1
          ? '<button type="button" class="btn btn-ghost btn-sm gallery-trigger" data-raid-id="' + r.id + '" style="margin-top:4px;align-self:flex-start">' + CV.icon("image") + 'Смотреть все ' + photoCount + ' фото</button>'
          : (photoCount === 1
            ? '<button type="button" class="btn btn-ghost btn-sm gallery-trigger" data-raid-id="' + r.id + '" style="margin-top:4px;align-self:flex-start">' + CV.icon("image") + 'Открыть фото</button>'
            : '')) +
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
      const isAll = filter === "all";
      const msg = isAll
        ? "Пока нет рейдов. Как только админ добавит первый — он появится здесь."
        : (filter === "past" ? "Пока нет прошедших рейдов." : "Пока нет будущих рейдов.");
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        CV.icon("sprout") +
        '<h3>Пока пусто</h3>' +
        '<p>' + msg + '</p>' +
      '</div>';
      return;
    }
    grid.innerHTML = list.map(raidCard).join("");
    bindGalleryTriggers();
  }

  function getRaidById(id){
    for(let i = 0; i < raids.length; i++){
      if(raids[i].id === id) return raids[i];
    }
    return null;
  }

  function getRaidImages(r){
    if(!r) return [];
    if(r.images && r.images.length) return r.images.slice();
    if(r.image) return [r.image];
    return [];
  }

  function bindGalleryTriggers(){
    const triggers = document.querySelectorAll("[data-raid-id]");
    triggers.forEach(function(el){
      if(el.dataset.bound === "1") return;
      el.dataset.bound = "1";
      el.addEventListener("click", function(e){
        e.preventDefault();
        openLightbox(el.dataset.raidId);
      });
      el.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){
          e.preventDefault();
          openLightbox(el.dataset.raidId);
        }
      });
    });
  }

  let lightboxState = {images: [], index: 0, raid: null};

  function openLightbox(raidId){
    const raid = getRaidById(raidId);
    if(!raid) return;
    const images = getRaidImages(raid);
    if(!images.length) return;
    lightboxState = {images: images, index: 0, raid: raid};
    renderLightbox();
    document.addEventListener("keydown", onLightboxKey);
    document.body.style.overflow = "hidden";
  }

  function onLightboxKey(e){
    if(e.key === "Escape") closeLightbox();
    else if(e.key === "ArrowRight") lightboxNext();
    else if(e.key === "ArrowLeft") lightboxPrev();
  }

  function lightboxNext(){
    if(!lightboxState.images.length) return;
    lightboxState.index = (lightboxState.index + 1) % lightboxState.images.length;
    renderLightboxContent();
  }

  function lightboxPrev(){
    if(!lightboxState.images.length) return;
    lightboxState.index = (lightboxState.index - 1 + lightboxState.images.length) % lightboxState.images.length;
    renderLightboxContent();
  }

  function closeLightbox(){
    const el = document.getElementById("cvLightbox");
    if(el) el.parentNode.removeChild(el);
    document.removeEventListener("keydown", onLightboxKey);
    document.body.style.overflow = "";
    lightboxState = {images: [], index: 0, raid: null};
  }

  function renderLightboxContent(){
    const counter = document.getElementById("lbCounter");
    const main = document.getElementById("lbMain");
    const dots = document.getElementById("lbDots");
    if(!counter || !main || !dots) return;
    const total = lightboxState.images.length;
    const i = lightboxState.index;
    counter.textContent = (i + 1) + " / " + total;
    main.innerHTML = '<img src="' + lightboxState.images[i] + '" alt="' + CV.escapeHtml(lightboxState.raid.title || "Фото рейда") + '">';
    dots.innerHTML = lightboxState.images.map(function(src, idx){
      return '<button class="lb-dot' + (idx === i ? " active" : "") + '" data-i="' + idx + '" aria-label="Фото ' + (idx + 1) + '"></button>';
    }).join("");
    dots.querySelectorAll(".lb-dot").forEach(function(b){
      b.addEventListener("click", function(){
        lightboxState.index = parseInt(b.dataset.i, 10);
        renderLightboxContent();
      });
    });
  }

  function renderLightbox(){
    let el = document.getElementById("cvLightbox");
    if(el) el.parentNode.removeChild(el);
    const total = lightboxState.images.length;
    el = document.createElement("div");
    el.id = "cvLightbox";
    el.className = "lightbox";
    el.innerHTML = '' +
      '<div class="lb-backdrop" id="lbBackdrop"></div>' +
      '<button class="lb-close" id="lbClose" aria-label="Закрыть">' + CV.icon("x") + '</button>' +
      (total > 1 ? '<button class="lb-nav lb-prev" id="lbPrev" aria-label="Назад">' + CV.icon("arrow") + '</button>' : '') +
      (total > 1 ? '<button class="lb-nav lb-next" id="lbNext" aria-label="Вперёд" style="transform:rotate(180deg)">' + CV.icon("arrow") + '</button>' : '') +
      '<div class="lb-content">' +
        '<div class="lb-stage" id="lbMain"></div>' +
        '<div class="lb-info">' +
          '<h3>' + CV.escapeHtml(lightboxState.raid.title || "Фото рейда") + '</h3>' +
          (lightboxState.raid.location ? '<p>' + CV.icon("location") + CV.escapeHtml(lightboxState.raid.location) + '</p>' : '') +
          '<span class="lb-counter" id="lbCounter">1 / ' + total + '</span>' +
        '</div>' +
        (total > 1 ? '<div class="lb-dots" id="lbDots"></div>' : '<div id="lbDots" style="display:none"></div>') +
      '</div>';
    document.body.appendChild(el);
    renderLightboxContent();
    el.style.display = "flex";
    el.classList.add("open");
    document.getElementById("lbBackdrop").addEventListener("click", closeLightbox);
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    if(total > 1){
      document.getElementById("lbPrev").addEventListener("click", lightboxPrev);
      document.getElementById("lbNext").addEventListener("click", lightboxNext);
    }
    el.addEventListener("click", function(e){
      if(e.target === el) closeLightbox();
    });
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
        activeFilter = t.dataset.filter;
        renderRaids(activeFilter);
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
    const submitBtn = form.querySelector('button[type="submit"]');
    let photoFile = null;
    let photoDataUrl = "";

    photo.addEventListener("change", function(){
      const file = photo.files && photo.files[0];
      if(!file){
        photoFile = null;
        photoDataUrl = "";
        photoLabel.textContent = "Нажмите, чтобы прикрепить фото";
        fileName.textContent = "";
        preview.style.display = "none";
        preview.innerHTML = "";
        return;
      }
      if(file.size > 10 * 1024 * 1024){
        alertBox.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Файл слишком большой. Максимум 10 МБ.</div></div>';
        photo.value = "";
        return;
      }
      photoFile = file;
      fileName.textContent = file.name;
      photoLabel.textContent = "Фото выбрано";
      const reader = new FileReader();
      reader.onload = function(e){
        photoDataUrl = e.target.result;
        preview.style.display = "block";
        preview.innerHTML = '<img src="' + photoDataUrl + '" alt="превью">';
      };
      reader.readAsDataURL(file);
    });

    function setSubmitLoading(loading){
      if(!submitBtn) return;
      if(loading){
        submitBtn.disabled = true;
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:cvSpin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Отправка...';
      }else{
        submitBtn.disabled = false;
        if(submitBtn.dataset.originalHtml) submitBtn.innerHTML = submitBtn.dataset.originalHtml;
      }
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      const name = document.getElementById("cName").value.trim();
      const address = document.getElementById("cAddress").value.trim();
      const problem = document.getElementById("cProblem").value.trim();
      if(!name || !address || !problem){
        alertBox.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Заполните все обязательные поля.</div></div>';
        return;
      }

      setSubmitLoading(true);
      alertBox.innerHTML = "";

      const submitComplaint = function(photoUrl){
        const complaint = {
          id: CV.genId("c"),
          name: name,
          address: address,
          problem: problem,
          photo: photoUrl || "",
          status: "new",
          createdAt: new Date().toISOString()
        };
        return CV.fetchComplaints().then(function(complaints){
          complaints.unshift(complaint);
          return CV.saveComplaintsRemote(complaints, "New complaint from " + name);
        });
      };

      let uploadedPhotoUrl = "";
      let uploadChain;
      if(photoFile){
        const photoName = "c-" + Date.now() + "-" + Math.random().toString(36).slice(2,8) + ".jpg";
        uploadChain = CV.resizeImage(photoFile, 1400, 0.82)
          .then(function(resized){
            return CV.uploadPhotoRemote(resized.base64, photoName);
          })
          .then(function(url){
            uploadedPhotoUrl = url;
            return url;
          })
          .catch(function(err){
            throw new Error("Не удалось загрузить фото: " + err.message);
          });
      }else{
        uploadChain = Promise.resolve("");
      }

      uploadChain
        .then(function(photoUrl){ return submitComplaint(photoUrl); })
        .then(function(){
          form.reset();
          photoFile = null;
          photoDataUrl = "";
          uploadedPhotoUrl = "";
          photoLabel.textContent = "Нажмите, чтобы прикрепить фото";
          fileName.textContent = "";
          preview.style.display = "none";
          preview.innerHTML = "";
          alertBox.innerHTML = '<div class="alert alert-success">' + CV.icon("check") + '<div>Спасибо! Жалоба отправлена. Мы рассмотрим её и добавим место в план рейдов.</div></div>';
          CV.toast("Жалоба отправлена");
        })
        .catch(function(err){
          if(uploadedPhotoUrl){
            CV.deletePhotoRemote(uploadedPhotoUrl).catch(function(){});
          }
          alertBox.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Не удалось отправить жалобу: ' + CV.escapeHtml(err.message) + '. Попробуйте позже.</div></div>';
        })
        .then(function(){ setSubmitLoading(false); });
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

  function refreshFromRemote(){
    CV.fetchRaids().then(function(freshRaids){
      raids = freshRaids;
      renderStats();
      renderRaids(activeFilter);
      renderUpcoming();
    }).catch(function(){});
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
    refreshFromRemote();
  });
})();
