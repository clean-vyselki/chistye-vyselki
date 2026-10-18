(function(){
  "use strict";

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "bear123";

  const loginWrap = document.getElementById("loginWrap");
  const adminApp = document.getElementById("adminApp");

  function renderAdminShell(){
    adminApp.style.display = "block";
    loginWrap.style.display = "none";
    adminApp.innerHTML = '' +
      '<div class="admin-bar">' +
        '<div class="container">' +
          '<span class="pill">' + CV.icon("shield") + 'Админ-панель</span>' +
          '<span style="opacity:.8">Чистые Выселки</span>' +
          '<span style="margin-left:auto;display:flex;gap:8px;align-items:center">' +
            '<a href="../index.html" class="pill" style="color:#fff;text-decoration:none">' + CV.icon("home") + 'На сайт</a>' +
            '<button class="pill" id="logoutBtn" style="border:none;cursor:pointer;color:#fff">' + CV.icon("logout") + 'Выйти</button>' +
          '</span>' +
        '</div>' +
      '</div>' +
      '<div class="admin-layout">' +
        '<aside class="admin-sidebar" id="adminSidebar">' +
          '<div class="label">Разделы</div>' +
          '<button class="admin-nav-item active" data-panel="dashboard">' + CV.icon("chart") + 'Обзор</button>' +
          '<button class="admin-nav-item" data-panel="raids">' + CV.icon("trash") + 'Рейды</button>' +
          '<button class="admin-nav-item" data-panel="upcoming">' + CV.icon("calendar") + 'Будущие рейды</button>' +
          '<button class="admin-nav-item" data-panel="complaints">' + CV.icon("inbox") + 'Жалобы</button>' +
          '<div class="spacer"></div>' +
          '<div class="label">Данные</div>' +
          '<button class="admin-nav-item" data-panel="export">' + CV.icon("download") + 'Экспорт / Импорт</button>' +
        '</aside>' +
        '<main class="admin-content">' +
          '<section class="panel active" id="panel-dashboard"></section>' +
          '<section class="panel" id="panel-raids"></section>' +
          '<section class="panel" id="panel-upcoming"></section>' +
          '<section class="panel" id="panel-complaints"></section>' +
          '<section class="panel" id="panel-export"></section>' +
        '</main>' +
      '</div>';

    document.getElementById("logoutBtn").addEventListener("click", function(){
      CV.setAuthed(false);
      location.reload();
    });

    document.querySelectorAll("#adminSidebar .admin-nav-item").forEach(function(btn){
      btn.addEventListener("click", function(){
        const target = btn.dataset.panel;
        document.querySelectorAll("#adminSidebar .admin-nav-item").forEach(function(x){x.classList.remove("active");});
        btn.classList.add("active");
        document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("active");});
        document.getElementById("panel-" + target).classList.add("active");
        renderPanel(target);
      });
    });

    renderPanel("dashboard");
    syncFromRemote();
  }

  let currentPanel = "dashboard";

  function syncFromRemote(){
    Promise.all([CV.fetchRaids(), CV.fetchComplaints()])
      .then(function(){
        if(adminApp.style.display === "block"){
          renderPanel(currentPanel);
        }
      })
      .catch(function(){});
  }

  function renderPanel(name){
    currentPanel = name;
    if(name === "dashboard") renderDashboard();
    else if(name === "raids") renderRaidsPanel();
    else if(name === "upcoming") renderUpcomingPanel();
    else if(name === "complaints") renderComplaintsPanel();
    else if(name === "export") renderExportPanel();
  }

  function renderDashboard(){
    const raids = CV.loadRaids();
    const complaints = CV.loadComplaints();
    const past = raids.filter(function(r){return r.type === "past";});
    const upcoming = raids.filter(function(r){return r.type === "upcoming";});
    const newComplaints = complaints.filter(function(c){return c.status === "new";});
    const el = document.getElementById("panel-dashboard");
    el.innerHTML = '' +
      '<h1>Обзор</h1>' +
      '<p class="sub">Сводка по рейдам и жалобам сообщества Чистые Выселки.</p>' +
      '<div class="grid grid-raids" style="margin-bottom:24px">' +
        '<div class="card"><div class="card-body"><h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("trash") + 'Всего рейдов</h3><div style="font-size:32px;font-weight:700;color:var(--green-800)">' + raids.length + '</div></div></div>' +
        '<div class="card"><div class="card-body"><h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("check") + 'Проведено</h3><div style="font-size:32px;font-weight:700;color:var(--green-800)">' + past.length + '</div></div></div>' +
        '<div class="card"><div class="card-body"><h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("calendar") + 'Запланировано</h3><div style="font-size:32px;font-weight:700;color:var(--green-800)">' + upcoming.length + '</div></div></div>' +
        '<div class="card"><div class="card-body"><h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("inbox") + 'Новых жалоб</h3><div style="font-size:32px;font-weight:700;color:' + (newComplaints.length ? "var(--danger)" : "var(--green-800)") + '">' + newComplaints.length + '</div></div></div>' +
      '</div>' +
      '<div class="card"><div class="card-body">' +
        '<h3 style="margin:0 0 12px">Быстрые действия</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          '<button class="btn btn-solid btn-sm" data-action="add-past">' + CV.icon("plus") + 'Добавить прошедший рейд</button>' +
          '<button class="btn btn-solid btn-sm" data-action="add-upcoming">' + CV.icon("plus") + 'Добавить будущий рейд</button>' +
          '<button class="btn btn-ghost btn-sm" data-action="goto-complaints">' + CV.icon("inbox") + 'Перейти к жалобам</button>' +
        '</div>' +
      '</div></div>';

    el.querySelectorAll("[data-action]").forEach(function(b){
      b.addEventListener("click", function(){
        const a = b.dataset.action;
        if(a === "add-past") openRaidModal("past");
        else if(a === "add-upcoming") openRaidModal("upcoming");
        else if(a === "goto-complaints") switchPanel("complaints");
      });
    });
  }

  function switchPanel(name){
    const btn = document.querySelector('[data-panel="' + name + '"]');
    if(btn) btn.click();
  }

  function renderRaidsPanel(){
    const raids = CV.loadRaids().filter(function(r){return r.type === "past";});
    const el = document.getElementById("panel-raids");
    el.innerHTML = '' +
      '<h1>Прошедшие рейды</h1>' +
      '<p class="sub">Отчёты о проведённых рейдах. Можно добавить новый или отредактировать существующий.</p>' +
      '<div class="toolbar">' +
        '<input class="search" id="raidsSearch" placeholder="Поиск по названию или адресу...">' +
        '<button class="btn btn-solid btn-sm" id="addPastBtn">' + CV.icon("plus") + 'Добавить рейд</button>' +
      '</div>' +
      '<div id="raidsTableWrap"></div>';

    document.getElementById("addPastBtn").addEventListener("click", function(){
      openRaidModal("past");
    });
    document.getElementById("raidsSearch").addEventListener("input", function(){
      renderRaidsTable(this.value);
    });
    renderRaidsTable("");
  }

  function renderRaidsTable(q){
    const wrap = document.getElementById("raidsTableWrap");
    let raids = CV.loadRaids().filter(function(r){return r.type === "past";});
    q = (q || "").toLowerCase().trim();
    if(q){
      raids = raids.filter(function(r){
        return (r.title||"").toLowerCase().indexOf(q) > -1 ||
               (r.location||"").toLowerCase().indexOf(q) > -1;
      });
    }
    raids.sort(function(a,b){return (b.date||"").localeCompare(a.date||"");});
    if(!raids.length){
      wrap.innerHTML = '<div class="empty">' + CV.icon("inbox") + '<h3>Пока нет рейдов</h3><p>Нажмите «Добавить рейд», чтобы создать первый.</p></div>';
      return;
    }
    wrap.innerHTML = '<table class="table"><thead><tr><th>Фото</th><th>Название</th><th>Дата</th><th>Место</th><th>Участников</th><th>Мешков</th><th style="width:80px">Действия</th></tr></thead><tbody>' +
      raids.map(function(r){
        const img = firstImage(r);
        const thumb = img
          ? '<img class="thumb" src="' + img + '" alt="">'
          : '<div class="thumb" style="display:flex;align-items:center;justify-content:center">' + CV.icon("image") + '</div>';
        const photoIndicator = (r.images && r.images.length > 1) ? '<span class="thumb-count" style="position:static;display:inline-flex;margin-top:4px">' + r.images.length + ' фото</span>' : '';
        return '<tr>' +
          '<td>' + thumb + photoIndicator + '</td>' +
          '<td><strong>' + CV.escapeHtml(r.title) + '</strong></td>' +
          '<td>' + CV.escapeHtml(CV.formatDate(r.date)) + '</td>' +
          '<td>' + CV.escapeHtml(r.location) + '</td>' +
          '<td>' + (r.participants || 0) + '</td>' +
          '<td>' + (r.bags || 0) + '</td>' +
          '<td><div class="actions">' +
            '<button class="icon-btn" data-edit="' + r.id + '" title="Редактировать">' + CV.icon("edit") + '</button>' +
            '<button class="icon-btn danger" data-del="' + r.id + '" title="Удалить">' + CV.icon("trash2") + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join("") + '</tbody></table>';

    wrap.querySelectorAll("[data-edit]").forEach(function(b){
      b.addEventListener("click", function(){ openRaidModal("past", b.dataset.edit); });
    });
    wrap.querySelectorAll("[data-del]").forEach(function(b){
      b.addEventListener("click", function(){ deleteRaid(b.dataset.del); });
    });
  }

  function renderUpcomingPanel(){
    const el = document.getElementById("panel-upcoming");
    el.innerHTML = '' +
      '<h1>Будущие рейды</h1>' +
      '<p class="sub">Запланированные акции, которые появятся на главной странице в разделе «Предстоящие рейды».</p>' +
      '<div class="toolbar">' +
        '<input class="search" id="upSearch" placeholder="Поиск по названию или адресу...">' +
        '<button class="btn btn-solid btn-sm" id="addUpBtn">' + CV.icon("plus") + 'Добавить будущий рейд</button>' +
      '</div>' +
      '<div id="upTableWrap"></div>';

    document.getElementById("addUpBtn").addEventListener("click", function(){
      openRaidModal("upcoming");
    });
    document.getElementById("upSearch").addEventListener("input", function(){
      renderUpTable(this.value);
    });
    renderUpTable("");
  }

  function renderUpTable(q){
    const wrap = document.getElementById("upTableWrap");
    let raids = CV.loadRaids().filter(function(r){return r.type === "upcoming";});
    q = (q || "").toLowerCase().trim();
    if(q){
      raids = raids.filter(function(r){
        return (r.title||"").toLowerCase().indexOf(q) > -1 ||
               (r.location||"").toLowerCase().indexOf(q) > -1;
      });
    }
    raids.sort(function(a,b){return (a.date||"").localeCompare(b.date||"");});
    if(!raids.length){
      wrap.innerHTML = '<div class="empty">' + CV.icon("calendar") + '<h3>Нет будущих рейдов</h3><p>Нажмите «Добавить будущий рейд», чтобы запланировать акцию.</p></div>';
      return;
    }
    wrap.innerHTML = '<table class="table"><thead><tr><th>Фото</th><th>Название</th><th>Дата</th><th>Время</th><th>Место</th><th style="width:80px">Действия</th></tr></thead><tbody>' +
      raids.map(function(r){
        const img = firstImage(r);
        const thumb = img
          ? '<img class="thumb" src="' + img + '" alt="">'
          : '<div class="thumb" style="display:flex;align-items:center;justify-content:center">' + CV.icon("image") + '</div>';
        const photoIndicator = (r.images && r.images.length > 1) ? '<span class="thumb-count" style="position:static;display:inline-flex;margin-top:4px">' + r.images.length + ' фото</span>' : '';
        return '<tr>' +
          '<td>' + thumb + photoIndicator + '</td>' +
          '<td><strong>' + CV.escapeHtml(r.title) + '</strong></td>' +
          '<td>' + CV.escapeHtml(CV.formatDate(r.date)) + '</td>' +
          '<td>' + (r.time || "—") + '</td>' +
          '<td>' + CV.escapeHtml(r.location) + '</td>' +
          '<td><div class="actions">' +
            '<button class="icon-btn" data-edit="' + r.id + '" title="Редактировать">' + CV.icon("edit") + '</button>' +
            '<button class="icon-btn danger" data-del="' + r.id + '" title="Удалить">' + CV.icon("trash2") + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join("") + '</tbody></table>';

    wrap.querySelectorAll("[data-edit]").forEach(function(b){
      b.addEventListener("click", function(){ openRaidModal("upcoming", b.dataset.edit); });
    });
    wrap.querySelectorAll("[data-del]").forEach(function(b){
      b.addEventListener("click", function(){ deleteRaid(b.dataset.del); });
    });
  }

  function firstImage(r){
    if(r.images && r.images.length) return r.images[0];
    if(r.image) return r.image;
    return "";
  }

  function openRaidModal(type, id){
    let raid = null;
    if(id){
      const raids = CV.loadRaids();
      raid = raids.filter(function(r){return r.id === id;})[0];
    }
    const isEdit = !!raid;
    const data = raid || {
      type: type,
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      images: [],
      tags: [],
      participants: 0,
      bags: 0
    };
    let photos = [];
    let photoFiles = [];
    if(data.images && data.images.length) photos = data.images.slice();
    else if(data.image) photos = [data.image];

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop open";
    backdrop.innerHTML = '' +
      '<div class="modal">' +
        '<div class="modal-head">' +
          '<h3>' + (isEdit ? "Редактировать рейд" : (type === "upcoming" ? "Новый будущий рейд" : "Новый прошедший рейд")) + '</h3>' +
          '<button class="icon-btn" data-close="1">' + CV.icon("x") + '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="field">' +
            '<label>Название рейда *</label>' +
            '<input type="text" id="mTitle" value="' + CV.escapeHtml(data.title) + '" placeholder="Например: Очистка берега реки">' +
          '</div>' +
          '<div class="row-2">' +
            '<div class="field"><label>Дата *</label><input type="date" id="mDate" value="' + (data.date || "") + '"></div>' +
            '<div class="field"><label>Время</label><input type="time" id="mTime" value="' + (data.time || "") + '"></div>' +
          '</div>' +
          '<div class="field">' +
            '<label>Где был рейд / где будет *</label>' +
            '<input type="text" id="mLocation" value="' + CV.escapeHtml(data.location) + '" placeholder="Улица, номер, ориентир">' +
          '</div>' +
          '<div class="field">' +
            '<label>Описание *</label>' +
            '<textarea id="mDesc" placeholder="Что сделали, сколько собрали, кто участвовал...">' + CV.escapeHtml(data.description) + '</textarea>' +
          '</div>' +
          '<div class="field">' +
            '<label>Теги (через запятую)</label>' +
            '<input type="text" id="mTags" value="' + CV.escapeHtml((data.tags || []).join(", ")) + '" placeholder="Берег, Пластик, Волонтёры">' +
          '</div>' +
          (type === "past"
            ? '<div class="row-2">' +
                '<div class="field"><label>Участников</label><input type="number" id="mPeople" value="' + (data.participants || 0) + '" min="0"></div>' +
                '<div class="field"><label>Мешков собрано</label><input type="number" id="mBags" value="' + (data.bags || 0) + '" min="0"></div>' +
              '</div>'
            : '') +
          '<div class="field">' +
            '<label>Фото рейда (можно несколько)</label>' +
            '<label class="file-drop" for="mPhoto">' +
              CV.icon("upload") +
              '<span id="mPhotoLabel">Добавить фото — можно выбрать несколько</span>' +
              '<span class="filename" id="mFileName"></span>' +
            '</label>' +
            '<input type="file" id="mPhoto" accept="image/*" multiple style="display:none">' +
            '<div class="thumb-grid" id="mThumbs"></div>' +
          '</div>' +
        '</div>' +
        '<div class="modal-foot">' +
          '<button class="btn btn-ghost btn-sm" data-close="1">Отмена</button>' +
          '<button class="btn btn-solid btn-sm" id="mSave">' + CV.icon("check") + 'Сохранить</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);

    function renderThumbs(){
      const wrap = document.getElementById("mThumbs");
      if(!photos.length){
        wrap.innerHTML = '<div class="thumb-empty" style="grid-column:1/-1">Нет загруженных фото. Можно добавить несколько — они будут показаны галереей.</div>';
        return;
      }
      wrap.innerHTML = photos.map(function(p, i){
        return '<div class="thumb-item">' +
          '<img src="' + p + '" alt="">' +
          (photos.length > 1 ? '<span class="thumb-count">' + (i+1) + '/' + photos.length + '</span>' : '') +
          '<button type="button" class="thumb-del" data-i="' + i + '" title="Удалить">' + CV.icon("x") + '</button>' +
        '</div>';
      }).join("");
      wrap.querySelectorAll(".thumb-del").forEach(function(b){
        b.addEventListener("click", function(){
          const i = parseInt(b.dataset.i, 10);
          photos.splice(i, 1);
          photoFiles.splice(i, 1);
          renderThumbs();
        });
      });
      document.getElementById("mPhotoLabel").textContent = photos.length ? "Добавить ещё фото" : "Добавить фото — можно выбрать несколько";
    }

    document.getElementById("mPhoto").addEventListener("change", function(e){
      const files = Array.prototype.slice.call(e.target.files);
      if(!files.length) return;
      let pending = files.length;
      let added = 0;
      files.forEach(function(file){
        if(file.size > 15 * 1024 * 1024){
          CV.toast("Файл " + file.name + " больше 15 МБ, пропущен");
          pending--;
          if(pending === 0){ renderThumbs(); if(added>0) CV.toast("Добавлено фото: " + added); }
          return;
        }
        const reader = new FileReader();
        reader.onload = function(ev){
          photos.push(ev.target.result);
          photoFiles.push(file);
          added++;
          pending--;
          if(pending === 0){
            renderThumbs();
            CV.toast("Добавлено фото: " + added);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = "";
    });

    renderThumbs();

    function close(){
      backdrop.classList.remove("open");
      setTimeout(function(){
        if(backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 200);
    }

    backdrop.querySelectorAll("[data-close]").forEach(function(b){
      b.addEventListener("click", close);
    });
    backdrop.addEventListener("click", function(e){
      if(e.target === backdrop) close();
    });

    document.getElementById("mSave").addEventListener("click", function(){
      const title = document.getElementById("mTitle").value.trim();
      const date = document.getElementById("mDate").value;
      const time = document.getElementById("mTime").value;
      const location = document.getElementById("mLocation").value.trim();
      const description = document.getElementById("mDesc").value.trim();
      const tagsRaw = document.getElementById("mTags").value.trim();
      const tags = tagsRaw ? tagsRaw.split(",").map(function(t){return t.trim();}).filter(Boolean) : [];
      const people = type === "past" ? (parseInt(document.getElementById("mPeople").value,10) || 0) : 0;
      const bags = type === "past" ? (parseInt(document.getElementById("mBags").value,10) || 0) : 0;

      if(!title || !date || !location || !description){
        CV.toast("Заполните обязательные поля");
        return;
      }

      const saveBtn = document.getElementById("mSave");
      const originalHtml = saveBtn.innerHTML;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:cvSpin .8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Сохранение...';

      const uploadNewPhotos = function(){
        const uploadTasks = photos.map(function(p, idx){
          if(p.indexOf("data:") === 0){
            return CV.resizeImage(photoFiles[idx], 1400, 0.82)
              .then(function(resized){
                const fname = "raid-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).slice(2,6) + ".jpg";
                return CV.uploadPhotoRemote(resized.base64, fname);
              })
              .then(function(url){ return { idx: idx, url: url }; });
          }
          return Promise.resolve({ idx: idx, url: p });
        });
        return Promise.all(uploadTasks).then(function(results){
          return results.sort(function(a,b){ return a.idx - b.idx; }).map(function(r){ return r.url; });
        });
      };

      uploadNewPhotos()
        .then(function(finalUrls){
          const raids = CV.loadRaids();
          if(isEdit){
            for(let i = 0; i < raids.length; i++){
              if(raids[i].id === id){
                raids[i].title = title;
                raids[i].date = date;
                raids[i].time = time;
                raids[i].location = location;
                raids[i].description = description;
                raids[i].tags = tags;
                raids[i].images = finalUrls;
                delete raids[i].image;
                if(type === "past"){
                  raids[i].participants = people;
                  raids[i].bags = bags;
                }
                break;
              }
            }
          }else{
            raids.push({
              id: CV.genId("r"),
              type: type,
              title: title,
              date: date,
              time: time,
              location: location,
              description: description,
              tags: tags,
              images: finalUrls,
              participants: people,
              bags: bags
            });
          }
          return CV.saveRaidsRemote(raids, (isEdit ? "Update raid " : "Add raid ") + title);
        })
        .then(function(){
          close();
          CV.toast(isEdit ? "Рейд обновлён" : "Рейд добавлен");
          renderPanel(type === "past" ? "raids" : "upcoming");
        })
        .catch(function(err){
          CV.toast("Ошибка: " + err.message);
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalHtml;
        });
    });
  }

  function deleteRaid(id){
    if(!confirm("Удалить этот рейд? Действие нельзя отменить.")) return;
    let raids = CV.loadRaids();
    const raid = raids.filter(function(r){return r.id === id;})[0];
    raids = raids.filter(function(r){return r.id !== id;});
    CV.toast("Удаляю...");
    const deletePhotos = raid && raid.images && raid.images.length
      ? Promise.all(raid.images.map(function(url){ return CV.deletePhotoRemote(url); }))
      : Promise.resolve();
    deletePhotos
      .then(function(){ return CV.saveRaidsRemote(raids, "Delete raid " + (raid ? raid.title : id)); })
      .then(function(){
        CV.toast("Рейд удалён");
        const activePanel = document.querySelector(".admin-nav-item.active").dataset.panel;
        renderPanel(activePanel);
      })
      .catch(function(err){
        CV.toast("Ошибка удаления: " + err.message);
      });
  }

  function renderComplaintsPanel(){
    const el = document.getElementById("panel-complaints");
    const complaints = CV.loadComplaints().sort(function(a,b){
      return (b.createdAt||"").localeCompare(a.createdAt||"");
    });
    el.innerHTML = '' +
      '<h1>Жалобы</h1>' +
      '<p class="sub">Жалобы, отправленные через форму на сайте. Хранятся в локальном хранилище этого браузера.</p>' +
      '<div class="toolbar">' +
        '<select id="cFilter" style="padding:10px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:14px">' +
          '<option value="all">Все жалобы</option>' +
          '<option value="new">Новые</option>' +
          '<option value="in-progress">В работе</option>' +
          '<option value="done">Решено</option>' +
          '<option value="rejected">Отклонено</option>' +
        '</select>' +
        '<button class="btn btn-ghost btn-sm" id="clearComplaints">' + CV.icon("trash2") + 'Очистить все</button>' +
      '</div>' +
      '<div id="complaintsList"></div>';

    function draw(){
      const filter = document.getElementById("cFilter").value;
      let list = CV.loadComplaints().sort(function(a,b){
        return (b.createdAt||"").localeCompare(a.createdAt||"");
      });
      if(filter !== "all") list = list.filter(function(c){return c.status === filter;});
      const wrap = document.getElementById("complaintsList");
      if(!list.length){
        wrap.innerHTML = '<div class="empty">' + CV.icon("inbox") + '<h3>Нет жалоб</h3><p>Когда жители отправят жалобы через форму на сайте, они появятся здесь.</p></div>';
        return;
      }
      wrap.innerHTML = list.map(function(c){
        const date = new Date(c.createdAt);
        const dateStr = isNaN(date) ? "" : date.toLocaleString("ru-RU");
        const statusMap = {
          "new": {label:"Новая", color:"var(--danger)"},
          "in-progress": {label:"В работе", color:"var(--warn)"},
          "done": {label:"Решено", color:"var(--green-700)"},
          "rejected": {label:"Отклонено", color:"var(--muted)"}
        };
        const st = statusMap[c.status] || statusMap["new"];
        const photo = c.photo
          ? '<div class="preview-img" style="margin-top:8px"><img src="' + c.photo + '" alt=""></div>'
          : '';
        return '<div class="card" style="margin-bottom:14px">' +
          '<div class="card-body">' +
            '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">' +
              '<div>' +
                '<h3 style="margin:0 0 4px">' + CV.escapeHtml(c.name) + '</h3>' +
                '<div class="card-meta">' +
                  '<span>' + CV.icon("location") + CV.escapeHtml(c.address) + '</span>' +
                  '<span>' + CV.icon("clock") + CV.escapeHtml(dateStr) + '</span>' +
                '</div>' +
              '</div>' +
              '<span class="card-badge" style="background:' + st.color + '">' + CV.icon("flag") + st.label + '</span>' +
            '</div>' +
            '<p class="card-desc" style="margin-top:10px">' + CV.escapeHtml(c.problem) + '</p>' +
            photo +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">' +
              '<button class="btn btn-ghost btn-sm" data-status="in-progress" data-id="' + c.id + '">В работу</button>' +
              '<button class="btn btn-ghost btn-sm" data-status="done" data-id="' + c.id + '">Решено</button>' +
              '<button class="btn btn-ghost btn-sm" data-status="rejected" data-id="' + c.id + '">Отклонить</button>' +
              '<button class="btn btn-ghost btn-sm" data-status="new" data-id="' + c.id + '">Сбросить</button>' +
              '<button class="icon-btn danger" data-del-complaint="' + c.id + '" title="Удалить">' + CV.icon("trash2") + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join("");

      wrap.querySelectorAll("[data-status]").forEach(function(b){
        b.addEventListener("click", function(){
          setComplaintStatus(b.dataset.id, b.dataset.status);
        });
      });
      wrap.querySelectorAll("[data-del-complaint]").forEach(function(b){
        b.addEventListener("click", function(){
          deleteComplaint(b.dataset.delComplaint);
        });
      });
    }

    document.getElementById("cFilter").addEventListener("change", draw);
    document.getElementById("clearComplaints").addEventListener("click", function(){
      if(!confirm("Удалить ВСЕ жалобы? Это действие нельзя отменить.")) return;
      CV.toast("Удаляю...");
      CV.saveComplaintsRemote([], "Clear all complaints")
        .then(function(){
          CV.toast("Все жалобы удалены");
          draw();
        })
        .catch(function(err){ CV.toast("Ошибка: " + err.message); });
    });
    draw();
  }

  function setComplaintStatus(id, status){
    const list = CV.loadComplaints();
    for(let i = 0; i < list.length; i++){
      if(list[i].id === id){list[i].status = status; break;}
    }
    CV.saveComplaintsRemote(list, "Set complaint " + id + " status to " + status)
      .then(function(){
        CV.toast("Статус обновлён");
        renderPanel("complaints");
      })
      .catch(function(err){ CV.toast("Ошибка: " + err.message); });
  }

  function deleteComplaint(id){
    let list = CV.loadComplaints();
    const complaint = list.filter(function(c){return c.id === id;})[0];
    list = list.filter(function(c){return c.id !== id;});
    CV.toast("Удаляю...");
    const delPhoto = complaint && complaint.photo
      ? CV.deletePhotoRemote(complaint.photo)
      : Promise.resolve();
    delPhoto
      .then(function(){ return CV.saveComplaintsRemote(list, "Delete complaint " + id); })
      .then(function(){
        CV.toast("Жалоба удалена");
        renderPanel("complaints");
      })
      .catch(function(err){ CV.toast("Ошибка: " + err.message); });
  }

  function renderExportPanel(){
    const el = document.getElementById("panel-export");
    const raids = CV.loadRaids();
    const complaints = CV.loadComplaints();
    el.innerHTML = '' +
      '<h1>Экспорт и импорт данных</h1>' +
      '<p class="sub">Все данные хранятся в браузере (localStorage). Чтобы перенести их на GitHub Pages и сделать видимыми для всех посетителей сайта, экспортируйте JSON и закоммитьте файл в репозиторий.</p>' +
      '<div class="grid grid-raids">' +
        '<div class="card"><div class="card-body">' +
          '<h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("download") + 'Экспорт рейдов</h3>' +
          '<p class="card-desc">Скачайте текущие рейды в формате JSON. Замените этим файлом js/raids-export.json или добавьте данные в js/data.js.</p>' +
          '<button class="btn btn-solid btn-sm" id="exportRaidsBtn">' + CV.icon("download") + 'Скачать raids.json</button>' +
        '</div></div>' +
        '<div class="card"><div class="card-body">' +
          '<h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("download") + 'Экспорт жалоб</h3>' +
          '<p class="card-desc">Скачайте список жалоб. Можно использовать для архива или переноса.</p>' +
          '<button class="btn btn-solid btn-sm" id="exportComplaintsBtn">' + CV.icon("download") + 'Скачать complaints.json</button>' +
        '</div></div>' +
        '<div class="card"><div class="card-body">' +
          '<h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("upload") + 'Импорт рейдов</h3>' +
          '<p class="card-desc">Загрузите JSON с рейдами. Текущие рейды будут заменены.</p>' +
          '<input type="file" id="importRaidsInput" accept="application/json" style="margin-bottom:8px">' +
          '<button class="btn btn-ghost btn-sm" id="importRaidsBtn">' + CV.icon("upload") + 'Импортировать</button>' +
        '</div></div>' +
        '<div class="card"><div class="card-body">' +
          '<h3 style="display:flex;align-items:center;gap:8px">' + CV.icon("trash2") + 'Сброс</h3>' +
          '<p class="card-desc">Удалить все данные и вернуть демо-рейды по умолчанию.</p>' +
          '<button class="btn btn-danger btn-sm" id="resetBtn">' + CV.icon("trash2") + 'Сбросить всё</button>' +
        '</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:20px"><div class="card-body">' +
        '<h3 style="margin:0 0 8px">Данные хранятся онлайн</h3>' +
        '<p class="card-desc" style="margin:0">Все рейды, фото и жалобы сохраняются прямо в репозиторий GitHub через API. Любое изменение в админ-панели сразу видно всем посетителям сайта — никаких отдельных коммитов делать не нужно.</p>' +
      '</div></div>';

    document.getElementById("exportRaidsBtn").addEventListener("click", function(){
      downloadJSON("raids.json", raids);
    });
    document.getElementById("exportComplaintsBtn").addEventListener("click", function(){
      downloadJSON("complaints.json", complaints);
    });
    document.getElementById("importRaidsBtn").addEventListener("click", function(){
      const input = document.getElementById("importRaidsInput");
      const file = input.files && input.files[0];
      if(!file){CV.toast("Выберите файл"); return;}
      const reader = new FileReader();
      reader.onload = function(e){
        try{
          const data = JSON.parse(e.target.result);
          if(!Array.isArray(data)) throw new Error("not array");
          CV.toast("Импортирую...");
          CV.saveRaidsRemote(data, "Import raids from JSON file")
            .then(function(){
              CV.toast("Импортировано рейдов: " + data.length);
              renderPanel("export");
            })
            .catch(function(err){ CV.toast("Ошибка: " + err.message); });
        }catch(err){
          CV.toast("Ошибка: неверный формат");
        }
      };
      reader.readAsText(file);
    });
    document.getElementById("resetBtn").addEventListener("click", function(){
      if(!confirm("Сбросить все данные к демо?")) return;
      CV.toast("Сбрасываю...");
      Promise.all([
        CV.saveRaidsRemote(CV.clone(CV.DEFAULT_RAIDS), "Reset raids to default"),
        CV.saveComplaintsRemote([], "Reset complaints to default")
      ])
        .then(function(){
          CV.toast("Данные сброшены");
          renderPanel("export");
        })
        .catch(function(err){ CV.toast("Ошибка: " + err.message); });
    });
  }

  function downloadJSON(filename, data){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function setupLogoCheck(){
    const slots = document.querySelectorAll(".brand-logo");
    if(!slots.length) return;
    const test = new Image();
    test.onload = function(){
      slots.forEach(function(slot){
        slot.innerHTML = '<img src="../logo.png" alt="Логотип Чистые Выселки">';
      });
    };
    test.src = "../logo.png";
  }

  function init(){
    setupLogoCheck();
    const loginForm = document.getElementById("loginForm");
    const loginAlert = document.getElementById("loginAlert");

    if(CV.isAuthed()){
      renderAdminShell();
      return;
    }

    loginForm.addEventListener("submit", function(e){
      e.preventDefault();
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value;
      if(u === ADMIN_USER && p === ADMIN_PASS){
        CV.setAuthed(true);
        renderAdminShell();
      }else{
        loginAlert.innerHTML = '<div class="alert alert-error">' + CV.icon("alert") + '<div>Неверный логин или пароль.</div></div>';
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
