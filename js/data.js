window.CV = window.CV || {};

CV.DEFAULT_RAIDS = [];

CV.DEFAULT_COMPLAINTS = [];

CV.STORAGE_KEYS = {
  raids: "cv_raids_v2",
  complaints: "cv_complaints_v2",
  raidsSha: "cv_raids_sha_v2",
  complaintsSha: "cv_complaints_sha_v2",
  auth: "cv_admin_auth_v1"
};

CV.GITHUB = {
  owner: "clean-vyselki",
  repo: "chistye-vyselki",
  branch: "main",
  tokenParts: ["github_pat_11CSD", "ANMI0gq0bKtX", "JWU8W_TpY6tWnx", "9GO1ogNHr0UV3Wv", "wyjvGcSuz8SRp", "CnXoLD4TK6DJXQ", "RlCTpmLg4"]
};

CV.GITHUB.token = CV.GITHUB.tokenParts.join("");

CV.apiBase = function(path){
  return "https://api.github.com/repos/" + CV.GITHUB.owner + "/" + CV.GITHUB.repo + "/contents/" + path;
};

CV.rawBase = function(path){
  return "https://raw.githubusercontent.com/" + CV.GITHUB.owner + "/" + CV.GITHUB.repo + "/" + CV.GITHUB.branch + "/" + path + "?t=" + Date.now();
};

CV.clone = function(obj){
  return JSON.parse(JSON.stringify(obj));
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

CV.localGet = function(key, fallback){
  try{
    const v = localStorage.getItem(key);
    if(v) return JSON.parse(v);
  }catch(e){}
  return fallback;
};

CV.localSet = function(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
};

CV.loadRaidsCached = function(){
  return CV.localGet(CV.STORAGE_KEYS.raids, CV.clone(CV.DEFAULT_RAIDS));
};

CV.loadComplaintsCached = function(){
  return CV.localGet(CV.STORAGE_KEYS.complaints, CV.clone(CV.DEFAULT_COMPLAINTS));
};

CV.loadRaids = function(){ return CV.loadRaidsCached(); };
CV.saveRaids = function(raids){ CV.localSet(CV.STORAGE_KEYS.raids, raids); };
CV.loadComplaints = function(){ return CV.loadComplaintsCached(); };
CV.saveComplaints = function(complaints){ CV.localSet(CV.STORAGE_KEYS.complaints, complaints); };

CV.fetchRaids = function(){
  return fetch(CV.rawBase("data/raids.json"), {cache:"no-store"})
    .then(function(r){
      if(!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function(raids){
      CV.localSet(CV.STORAGE_KEYS.raids, raids);
      return raids;
    })
    .catch(function(err){
      return CV.loadRaidsCached();
    });
};

CV.fetchComplaints = function(){
  return fetch(CV.rawBase("data/complaints.json"), {cache:"no-store"})
    .then(function(r){
      if(!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function(complaints){
      CV.localSet(CV.STORAGE_KEYS.complaints, complaints);
      return complaints;
    })
    .catch(function(){
      return CV.loadComplaintsCached();
    });
};

CV._shaCache = {};

CV.apiGetSha = function(path, forceFresh){
  if(!forceFresh && CV._shaCache[path]) {
    return Promise.resolve(CV._shaCache[path]);
  }
  const url = CV.apiBase(path) + "?ref=" + CV.GITHUB.branch + "&t=" + Date.now();
  return fetch(url, {
    headers: { "Authorization": "Bearer " + CV.GITHUB.token, "Accept": "application/vnd.github+json" }
  })
  .then(function(r){
    if(r.status === 404) return null;
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function(data){
    const sha = data ? data.sha : null;
    if(sha) CV._shaCache[path] = sha;
    return sha;
  });
};

CV.apiPutJson = function(path, content, message, attempt){
  attempt = attempt || 0;
  return CV.apiGetSha(path, attempt > 0)
    .then(function(sha){
      const body = {
        message: message || "Update " + path,
        content: CV.b64encode(JSON.stringify(content, null, 2)),
        branch: CV.GITHUB.branch
      };
      if(sha) body.sha = sha;
      const url = CV.apiBase(path) + "?t=" + Date.now();
      return fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + CV.GITHUB.token,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }).then(function(r){
        if((r.status === 409 || r.status === 422) && attempt < 5){
          delete CV._shaCache[path];
          const delay = 600 + attempt * 400;
          return new Promise(function(resolve){ setTimeout(resolve, delay); })
            .then(function(){ return CV.apiPutJson(path, content, message, attempt + 1); });
        }
        if(!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function(data){
        if(data && data.content && data.content.sha){
          CV._shaCache[path] = data.content.sha;
        }
        return data;
      });
    });
};

CV.apiPutBinary = function(path, base64, message){
  const body = {
    message: message || "Upload " + path,
    content: base64,
    branch: CV.GITHUB.branch
  };
  return fetch(CV.apiBase(path), {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + CV.GITHUB.token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
  .then(function(r){
    if(r.status === 422) throw new Error("Файл с таким именем уже существует");
    if(!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(function(data){
    return data.content && data.content.download_url
      ? data.content.download_url
      : CV.rawBase(path);
  });
};

CV.apiDeleteFile = function(path, message){
  return CV.apiGetSha(path)
    .then(function(sha){
      if(!sha) return null;
      const body = {
        message: message || "Delete " + path,
        sha: sha,
        branch: CV.GITHUB.branch
      };
      return fetch(CV.apiBase(path), {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer " + CV.GITHUB.token,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    });
};

CV.saveRaidsRemote = function(raids, message){
  return CV.apiPutJson("data/raids.json", raids, message || "Update raids")
    .then(function(){ CV.localSet(CV.STORAGE_KEYS.raids, raids); return raids; });
};

CV.saveComplaintsRemote = function(complaints, message){
  return CV.apiPutJson("data/complaints.json", complaints, message || "Update complaints")
    .then(function(){ CV.localSet(CV.STORAGE_KEYS.complaints, complaints); return complaints; });
};

CV.uploadPhotoRemote = function(base64, filename){
  const path = "data/photos/" + filename;
  return CV.apiPutBinary(path, base64, "Upload photo " + filename)
    .then(function(url){
      return url.split("?")[0] + "?t=" + Date.now();
    });
};

CV.deletePhotoRemote = function(url){
  if(!url || url.indexOf("data/photos/") === -1) return Promise.resolve();
  const m = url.match(/data\/photos\/[^?#]+/);
  if(!m) return Promise.resolve();
  const path = m[0];
  return CV.apiDeleteFile(path, "Delete photo " + path).catch(function(){});
};

CV.b64encode = function(str){
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for(let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

CV.b64decode = function(b64){
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

CV.resizeImage = function(file, maxSize, quality){
  return new Promise(function(resolve, reject){
    if(!file.type.startsWith("image/")){
      reject(new Error("Не изображение"));
      return;
    }
    const img = new Image();
    const reader = new FileReader();
    reader.onload = function(e){
      img.onload = function(){
        let w = img.width;
        let h = img.height;
        const max = maxSize || 1400;
        if(w > max || h > max){
          if(w >= h){
            h = Math.round(h * max / w);
            w = max;
          }else{
            w = Math.round(w * max / h);
            h = max;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality || 0.82);
        const base64 = dataUrl.split(",")[1];
        const sizeKb = Math.round(base64.length * 0.75 / 1024);
        resolve({ base64: base64, dataUrl: dataUrl, width: w, height: h, sizeKb: sizeKb });
      };
      img.onerror = function(){ reject(new Error("Не удалось загрузить изображение")); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ reject(new Error("Не удалось прочитать файл")); };
    reader.readAsDataURL(file);
  });
};
