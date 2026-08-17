(function(){
"use strict";

/* ============================================================
   Data
   ============================================================ */
var LS_TEMPLATE = "checklist:template";
var LS_RUNS = "checklist:runs";
var LS_ACTIVE = "checklist:activeRun";
var LS_THEME = "checklist:theme";

/* ============================================================
   Theme
   ============================================================ */
var PALETTE_PAPER = { "warm-light":"#EDE7DA", "warm-dark":"#14181A", "light":"#FFFFFF", "black":"#000000" };
function getThemePref(){ return localStorage.getItem(LS_THEME) || "current"; }
function setThemePref(pref){ localStorage.setItem(LS_THEME, pref); applyTheme(); }
function systemIsDark(){ return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); }
function resolvePalette(pref){
  if(pref === "light") return "light";
  if(pref === "black") return "black";
  if(pref === "system") return systemIsDark() ? "black" : "light";
  return systemIsDark() ? "warm-dark" : "warm-light";
}
function applyTheme(){
  var palette = resolvePalette(getThemePref());
  if(palette === "warm-light") document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", palette);
  var meta = document.getElementById("theme-color-meta");
  if(meta) meta.setAttribute("content", PALETTE_PAPER[palette]);
}
function renderThemePicker(){
  var current = getThemePref();
  document.querySelectorAll('#theme-picker [data-action="set-theme"]').forEach(function(btn){
    btn.dataset.active = (btn.dataset.theme === current) ? "true" : "false";
  });
}

var DEFAULT_TEMPLATE = {"name": "Uçuş Öncesi Checklist", "version": 1, "sections": [{"id": "s1", "title": "HAZIRLIK", "phase": "hazirlik", "blocking": false, "items": [{"id": "s1i1", "text": "Pusula kalibrasyonları yapıldı", "critical": false}, {"id": "s1i2", "text": "Uçak bataryaları ve kumanda (verici) bataryası tam şarj", "critical": false}, {"id": "s1i3", "text": "Yer istasyonu (GCS) bilgisayarının şarjı tam", "critical": false}, {"id": "s1i4", "text": "Görev planı (mission) Mission Planner'a yüklendi ve waypoint'ler gözden geçirildi", "critical": false}, {"id": "s1i5", "text": "Yedek pervane", "critical": false}, {"id": "s1i6", "text": "Yedek uçuş bataryası (şarjlı) ve yedek kumanda pili", "critical": false}, {"id": "s1i7", "text": "Yedek vida/somun, control horn", "critical": false}]}, {"id": "s1a", "title": "TAKIM ÇANTASI", "phase": "hazirlik", "blocking": false, "items": [{"id": "s1ai1", "text": "Yedek pervane", "critical": false}, {"id": "s1ai2", "text": "Yedek GPS", "critical": false}, {"id": "s1ai3", "text": "Uçak Pili / İnverter Pili", "critical": false}, {"id": "s1ai4", "text": "Yedek Pil", "critical": false}, {"id": "s1ai5", "text": "Servo Yekeler", "critical": false}, {"id": "s1ai6", "text": "Pervane Somunları", "critical": false}, {"id": "s1ai7", "text": "Yedek Somun", "critical": false}, {"id": "s1ai8", "text": "Pervane Sıkma Teli", "critical": false}, {"id": "s1ai9", "text": "Tornavida Seti", "critical": false}, {"id": "s1ai10", "text": "Yıldız Tornavida", "critical": false}, {"id": "s1ai11", "text": "Pense", "critical": false}, {"id": "s1ai12", "text": "Karga Burun", "critical": false}, {"id": "s1ai13", "text": "Yan Keski", "critical": false}, {"id": "s1ai14", "text": "Maket Bıçağı", "critical": false}, {"id": "s1ai15", "text": "Matkap", "critical": false}, {"id": "s1ai16", "text": "Multimetre", "critical": false}, {"id": "s1ai17", "text": "Su Terazisi", "critical": false}, {"id": "s1ai18", "text": "Hızlı Yapıştırıcı", "critical": false}, {"id": "s1ai19", "text": "Bantlar (Kağıt, Lifli, Çift Taraflı)", "critical": false}, {"id": "s1ai20", "text": "Kelepçe", "critical": false}, {"id": "s1ai21", "text": "Cırt Cırt", "critical": false}, {"id": "s1ai22", "text": "Lastik", "critical": false}, {"id": "s1ai23", "text": "Silikon Çubuklar", "critical": false}, {"id": "s1ai24", "text": "Vida Kutusu", "critical": false}, {"id": "s1ai25", "text": "USB Kablo (Anten Tracker için)", "critical": false}, {"id": "s1ai26", "text": "Çakmak", "critical": false}, {"id": "s1ai27", "text": "İnverter", "critical": false}, {"id": "s1ai28", "text": "2x Tabure", "critical": false}]}, {"id": "s2", "title": "SAHADA — MONTAJ SONRASI", "phase": "saha", "blocking": false, "items": [{"id": "s2i1", "text": "Kanat/kuyruk bağlantı pimleri ve kilitler tam oturmuş, boşluk yok", "critical": false}, {"id": "s2i2", "text": "Menteşeler (aileron/elevatör/rudder) elle kontrol — yırtık/gevşek yok", "critical": false}, {"id": "s2i3", "text": "Pervane/motor tutturması sıkı, pervane hasarsız", "critical": false}, {"id": "s2i4", "text": "Motor dönüş yönü doğru (kısa gaz testiyle doğrulandı)", "critical": false}, {"id": "s2i5", "text": "Ağırlık merkezi (CG) elle dengeleme testiyle doğru noktada", "critical": false}, {"id": "s2i6", "text": "GPS/RC/video anten bağlantıları sağlam, GPS anteni açık gökyüzüne bakıyor", "critical": false}, {"id": "s2i7", "text": "Kalkış alanı ve rota üzerinde engel/insan yok", "critical": false}, {"id": "s2i8", "text": "Rüzgar yönü belirlendi, kalkış rüzgara karşı planlandı", "critical": false}]}, {"id": "s3", "title": "YER İSTASYONU / YAZILIM", "phase": "saha", "blocking": false, "items": [{"id": "s3i1", "text": "Raspberry Pi - Pixhawk UART bağlantısı kontrol edildi", "critical": false}, {"id": "s3i2", "text": "Görev bilgisayarı (RPi) açıldı, wifi bağlantısı ssh ile test edildi, görüntü işleme yazılımı başlatıldı ve çalıştığı doğrulandı", "critical": false}, {"id": "s3i3", "text": "Mission Planner'da uçağın GPS konumu (harita üzerinde ikon) geldi", "critical": false}, {"id": "s3i4", "text": "Mission Planner'da video aktarımı/HUD görüntüsü düzgün geliyor", "critical": false}, {"id": "s3i5", "text": "Anten tracker home pozisyonu doğru girildi", "critical": false}, {"id": "s3i6", "text": "Anten tracker uçağı takip ediyor (kısa test hareketiyle doğrulandı)", "critical": false}, {"id": "s3i7", "text": "OBS'de uçuş öncesi ekran kaydı başlatıldı", "critical": false}]}, {"id": "s4", "title": "ARM ÖNCESİ", "phase": "saha", "blocking": true, "items": [{"id": "s4i1", "text": "Stabilize modda elle eğ: sağ kanat aşağı → sağ aileron YUKARI (gözle doğrula)", "critical": true}, {"id": "s4i2", "text": "Burun aşağı hareket ettir → elevatör YUKARI (gözle doğrula)", "critical": true}, {"id": "s4i3", "text": "Rudder: sağ komut → kuyruk sağa (gözle doğrula)", "critical": true}, {"id": "s4i4", "text": "GPS, Pusula, Servo gibi ayar gerektiren parça değiştiyse konfigürasyonu tekrar yapıldı", "critical": true}, {"id": "s4i5", "text": "Dataflash log kaydı başladı (hata mesajı yok)", "critical": false}, {"id": "s4i6", "text": "Manuel kumanda kontrolleri yapıldı", "critical": false}, {"id": "s4i7", "text": "Uçuş modu anahtarı tüm pozisyonlarda doğru modu gösteriyor (TX/MP'den kontrol)", "critical": false}, {"id": "s4i8", "text": "Gaz kolu boşta motor idle/duruyor, arm-disarm doğru çalışıyor", "critical": false}, {"id": "s4i9", "text": "GPS fix alındı, HDOP (1-2 arası) kabul edilebilir seviyede (MP'den bak)", "critical": false}, {"id": "s4i10", "text": "Batarya voltajı GCS üzerinden kontrol edildi", "critical": false}, {"id": "s4i11", "text": "Failsafe (RC/GCS/batarya) ayarları aktif ve biliniyor", "critical": false}]}, {"id": "s5", "title": "UÇUŞ SONRASI", "phase": "ucus-sonrasi", "blocking": false, "items": [{"id": "s5i1", "text": "Batarya sıcaklığı ve hasar kontrolü yapıldı", "critical": false}, {"id": "s5i2", "text": "OBS kaydı durduruldu, dosya kontrol edildi", "critical": false}, {"id": "s5i3", "text": "Log indirildi ve yedeklendi", "critical": false}, {"id": "s5i4", "text": "Görev bilgisayarı (RPi) terminalden düzgün kapatıldı (fişten çekmeden önce)", "critical": false}, {"id": "s5i5", "text": "Gövde/kanat/kuyrukta görünür hasar taraması yapıldı", "critical": false}, {"id": "s5i6", "text": "Uçuş notu: süre, mod, gözlemlenen sorun (varsa) yazıldı", "critical": false}]}]};

function deepClone(o){ return typeof structuredClone==="function"?structuredClone(o):JSON.parse(JSON.stringify(o)); }
function loadJSON(key, fallback){
  try{
    var raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function saveJSON(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
}
function uid(prefix){
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}
function todayStr(){
  var d = new Date();
  var mm = String(d.getMonth()+1).padStart(2,"0");
  var dd = String(d.getDate()).padStart(2,"0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}
function nowTs(){ return Math.floor(Date.now()/1000); }
function formatTime(ts){
  if(!ts) return null;
  var d = new Date(ts*1000);
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}

function allItems(tpl){
  var out = [];
  tpl.sections.forEach(function(s){ s.items.forEach(function(it){ out.push({section:s, item:it}); }); });
  return out;
}

function createRun(tpl, existingRuns){
  var date = todayStr();
  var seq = 1;
  (existingRuns||[]).concat(state.run ? [state.run] : []).forEach(function(r){
    if(r.date === date){
      var n = parseInt((r.id||"").split("-").pop(), 10);
      if(!isNaN(n) && n >= seq) seq = n + 1;
    }
  });
  var run = {
    id: date + "-" + String(seq).padStart(2,"0"),
    date: date,
    startedAt: nowTs(),
    endedAt: null,
    aircraft: "",
    wind: "",
    flightNote: "",
    checks: {},
    templateSnapshot: deepClone(tpl.sections)
  };
  allItems(tpl).forEach(function(pair){
    run.checks[pair.item.id] = { ok:false, note:"", ts:null };
  });
  return run;
}

function ensureRunChecks(tpl, run){
  allItems(tpl).forEach(function(pair){
    if(!run.checks[pair.item.id]) run.checks[pair.item.id] = { ok:false, note:"", ts:null };
  });
}

/* ============================================================
   xlsx / template parsing (shared by hardcoded default & import)
   ============================================================ */
function stripSectionPrefix(title){
  return title.replace(/^\d+(\.[a-zçğıöşüA-ZÇĞİÖŞÜ])?\)\s*/, "").trim();
}

function parseWorkbookToSections(wb){
  if(!wb || !wb.SheetNames || !wb.SheetNames.length) return [];
  var sheet = wb.Sheets[wb.SheetNames[0]];
  if(!sheet) return [];
  var rows = XLSX.utils.sheet_to_json(sheet, {header:1, raw:true, defval:null});
  var sections = [];
  var current = null;
  var sIdx = 0;
  rows.forEach(function(row){
    var a = row[0], b = row[1];
    var aStr = (a===null||a===undefined) ? "" : String(a).trim();
    var bStr = (b===null||b===undefined) ? "" : String(b).trim();
    if(aStr === "" && bStr === "") return;
    if(/^Tarih\s*:/i.test(aStr) || /^CHECKLIST/i.test(aStr)) return;
    if(/^#$/.test(aStr) && /^madde$/i.test(bStr)) return;
    var aIsNum = /^-?\d+([.,]\d+)?$/.test(aStr.replace(/\s/g, ""));
    if(aIsNum && bStr !== ""){
      if(!current){
        sIdx++;
        current = { id:"s"+sIdx, title:"Bölüm "+sIdx, phase:"saha", blocking:false, items:[] };
        sections.push(current);
      }
      current.items.push({ id: current.id+"i"+(current.items.length+1), text: bStr, critical:false });
      return;
    }
    if(!aIsNum && aStr !== ""){
      sIdx++;
      current = { id:"s"+sIdx, title:stripSectionPrefix(aStr), phase:"saha", blocking:false, items:[] };
      sections.push(current);
      return;
    }
  });
  return sections.filter(function(s){ return s.items.length > 0; });
}

function importTemplateFromWorkbook(wb, name){
  var sections = parseWorkbookToSections(wb);
  if(sections.length === 0){
    throw new Error("no-sections-found");
  }
  return { name: name || "İçe aktarılan şablon", version:1, sections: sections };
}

/* ============================================================
   State
   ============================================================ */
var state = {
  template: null,
  run: null,
  runs: [],
  view: "run",
  historyRun: null,
  manualPhaseOverride: {},
  itemEls: {},
  sectionEls: {},
  phaseEls: {},
  searchQuery: "",
  sectionObserver: null
};

function init(){
  state.template = loadJSON(LS_TEMPLATE, null) || deepClone(DEFAULT_TEMPLATE);
  state.runs = loadJSON(LS_RUNS, []);
  var activeRun = loadJSON(LS_ACTIVE, null);
  if(!activeRun){ activeRun = createRun(state.template, state.runs); }
  state.run = activeRun;
  ensureRunChecks(state.template, state.run);
  saveJSON(LS_ACTIVE, state.run);
  renderAll();
  bindGlobalEvents();
  setupWakeLock();
  applyTheme();
  if(window.matchMedia){
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){
      var pref = getThemePref();
      if(pref === "current" || pref === "system") applyTheme();
    });
  }
}

/* ============================================================
   Derived helpers
   ============================================================ */
function sectionCounts(section, run){
  var total = section.items.length, done = 0;
  section.items.forEach(function(it){ if(run.checks[it.id] && run.checks[it.id].ok) done++; });
  return { done:done, total:total };
}
function phaseCounts(phaseId, tpl, run){
  var total=0, done=0;
  tpl.sections.filter(function(s){ return s.phase===phaseId; }).forEach(function(s){
    var c = sectionCounts(s, run);
    total += c.total; done += c.done;
  });
  return { done:done, total:total };
}
function phaseList(tpl){
  var order = [], seen = {};
  tpl.sections.forEach(function(s){
    if(!seen[s.phase]){ seen[s.phase]=true; order.push(s.phase); }
  });
  return order;
}
var PHASE_LABEL = { "hazirlik":"HAZIRLIK", "saha":"SAHA", "ucus-sonrasi":"UÇUŞ SONRASI" };

function autoCurrentPhase(tpl, run){
  for(var i=0;i<tpl.sections.length;i++){
    var s = tpl.sections[i];
    var c = sectionCounts(s, run);
    if(c.done < c.total) return s.phase;
  }
  return tpl.sections.length ? tpl.sections[tpl.sections.length-1].phase : null;
}
function isPhaseExpanded(phaseId){
  if(Object.prototype.hasOwnProperty.call(state.manualPhaseOverride, phaseId)){
    return state.manualPhaseOverride[phaseId];
  }
  return phaseId === autoCurrentPhase(state.template, state.run);
}



function sahaItemCounts(tpl, run){
  var total=0, done=0;
  tpl.sections.filter(function(s){ return s.phase==="saha"; }).forEach(function(s){
    s.items.forEach(function(it){
      total++;
      if(run.checks[it.id] && run.checks[it.id].ok) done++;
    });
  });
  return {done:done, total:total};
}

/* ============================================================
   Render: full
   ============================================================ */
function renderAll(){
  renderFlightHeader();
  renderLists();
  renderArmBadge();
  renderNavRow();
  renderProgress();
}

function renderFlightHeader(){
  var r = state.run;
  document.getElementById("f-date").value = r.date || todayStr();
  document.getElementById("f-aircraft").value = r.aircraft || "";
  document.getElementById("f-wind").value = r.wind || "";
  document.getElementById("f-note").value = r.flightNote || "";
}

function itemNumberLabel(section, idx){
  return String(idx+1).padStart(2,"0");
}

function renderLists(){
  var root = document.getElementById("lists-root");
  root.innerHTML = "";
  state.itemEls = {}; state.sectionEls = {}; state.phaseEls = {};
  if(state.sectionObserver){ state.sectionObserver.disconnect(); state.sectionObserver = null; }
  var phases = phaseList(state.template);
  phases.forEach(function(phaseId){
    var phaseDiv = document.createElement("div");
    phaseDiv.className = "phase";
    phaseDiv.dataset.phase = phaseId;

    var header = document.createElement("button");
    header.className = "phase-header";
    header.dataset.action = "toggle-phase";
    header.dataset.phase = phaseId;
    var pc = phaseCounts(phaseId, state.template, state.run);
    header.innerHTML =
      '<span class="phase-name">'+PHASE_LABEL[phaseId]+'</span>'+
      '<span class="phase-progress mono">'+pc.done+'/'+pc.total+'</span>'+
      '<span class="phase-chevron">'+(isPhaseExpanded(phaseId) ? "▾" : "▸")+'</span>';
    phaseDiv.appendChild(header);

    var body = document.createElement("div");
    body.className = "phase-body";
    if(!isPhaseExpanded(phaseId)) body.hidden = true;

    state.template.sections.filter(function(s){ return s.phase===phaseId; }).forEach(function(section){
      var secEl = document.createElement("section");
      secEl.className = "checklist-section";
      secEl.dataset.id = section.id;

      var titleRow = document.createElement("div");
      titleRow.className = "section-title-row";
      var sc = sectionCounts(section, state.run);
      var isComplete = sc.total > 0 && sc.done === sc.total;
      titleRow.dataset.complete = isComplete ? "true" : "false";
      if(section.title.trim().toUpperCase() === (PHASE_LABEL[phaseId]||"").toUpperCase()){
        titleRow.classList.add("phase-merged");
      }
      titleRow.innerHTML =
        '<span class="section-title">'+escapeHtml(section.title)+'</span>'+
        '<span class="section-count mono">'+sc.done+'/'+sc.total+(isComplete ? ' ✓':'')+'</span>';
      secEl.appendChild(titleRow);

      var ul = document.createElement("ul");
      ul.className = "item-list";
      section.items.forEach(function(item, idx){
        var li = buildItemEl(section, item, idx);
        ul.appendChild(li);
        state.itemEls[item.id] = li;
      });
      secEl.appendChild(ul);

      body.appendChild(secEl);
      state.sectionEls[section.id] = { el: secEl, titleRow: titleRow };
    });

    phaseDiv.appendChild(body);
    root.appendChild(phaseDiv);
    state.phaseEls[phaseId] = { el: phaseDiv, header: header, body: body };
  });
  setupSectionObserver();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}

function buildItemEl(section, item, idx){
  var check = state.run.checks[item.id] || { ok:false, note:"", ts:null };
  var li = document.createElement("li");
  li.className = "item";
  li.dataset.id = item.id;
  li.dataset.ok = check.ok ? "true" : "false";
  li.dataset.critical = item.critical ? "true" : "false";

  var row = document.createElement("div");
  row.className = "item-row";

  var tap = document.createElement("button");
  tap.className = "item-tap";
  tap.dataset.action = "toggle-item";
  tap.dataset.id = item.id;
  tap.setAttribute("aria-pressed", check.ok ? "true" : "false");

  var checkEl = document.createElement("span");
  checkEl.className = "item-check";
  checkEl.setAttribute("aria-hidden","true");
  checkEl.textContent = check.ok ? "✓" : "";

  var bodyEl = document.createElement("span");
  bodyEl.className = "item-body";
  var numEl = document.createElement("span");
  numEl.className = "item-num mono";
  numEl.textContent = "#"+itemNumberLabel(section, idx);
  if(item.critical){
    var critTag = document.createElement("span");
    critTag.className = "item-crit-tag";
    critTag.textContent = "  KRİTİK";
    numEl.appendChild(critTag);
  }
  var textEl = document.createElement("span");
  textEl.className = "item-text";
  textEl.textContent = item.text;
  bodyEl.appendChild(numEl);
  bodyEl.appendChild(textEl);

  var notePreview = document.createElement("span");
  notePreview.className = "item-note-preview";
  notePreview.hidden = !check.note;
  notePreview.textContent = check.note || "";
  bodyEl.appendChild(notePreview);

  tap.appendChild(checkEl);
  tap.appendChild(bodyEl);

  var noteBtn = document.createElement("button");
  noteBtn.className = "item-note-btn";
  noteBtn.dataset.action = "toggle-note";
  noteBtn.dataset.id = item.id;
  noteBtn.setAttribute("aria-label","Not ekle");
  noteBtn.dataset.hasNote = check.note ? "true" : "false";
  noteBtn.textContent = "Not";

  row.appendChild(tap);
  row.appendChild(noteBtn);
  li.appendChild(row);

  var noteEditor = document.createElement("div");
  noteEditor.className = "item-note-editor";
  noteEditor.hidden = true;
  noteEditor.dataset.id = item.id;
  var ta = document.createElement("textarea");
  ta.value = check.note || "";
  ta.placeholder = "Not...";
  ta.dataset.action = "note-input";
  ta.dataset.id = item.id;
  noteEditor.appendChild(ta);
  li.appendChild(noteEditor);

  attachLongPress(tap, item.id);

  return li;
}

/* ============================================================
   Patch: single item (avoid full re-render)
   ============================================================ */
function patchItem(itemId){
  var pair = findItemPair(itemId);
  if(!pair) return;
  var li = state.itemEls[itemId];
  if(!li) return;
  var check = state.run.checks[itemId];
  li.dataset.ok = check.ok ? "true" : "false";
  var tap = li.querySelector(".item-tap");
  tap.setAttribute("aria-pressed", check.ok ? "true" : "false");
  var checkEl = li.querySelector(".item-check");
  checkEl.textContent = check.ok ? "✓" : "";
  if(check.ok && !prefersReducedMotion()){
    checkEl.classList.remove("item-check-pop");
    void checkEl.offsetWidth;
    checkEl.classList.add("item-check-pop");
  }
  var notePreview = li.querySelector(".item-note-preview");
  notePreview.hidden = !check.note;
  notePreview.textContent = check.note || "";
  var noteBtn = li.querySelector(".item-note-btn");
  noteBtn.dataset.hasNote = check.note ? "true" : "false";

  patchSectionCount(pair.section.id);
  patchPhaseCount(pair.section.phase);
  renderArmBadge();
  renderProgress();
}

function patchSectionCount(sectionId){
  var section = state.template.sections.find(function(s){ return s.id===sectionId; });
  var rec = state.sectionEls[sectionId];
  if(!section || !rec) return;
  var sc = sectionCounts(section, state.run);
  var isComplete = sc.total > 0 && sc.done === sc.total;
  rec.titleRow.querySelector(".section-count").textContent = sc.done+"/"+sc.total+(isComplete ? " ✓" : "");
  rec.titleRow.dataset.complete = isComplete ? "true" : "false";
}

function patchPhaseCount(phaseId){
  var rec = state.phaseEls[phaseId];
  if(!rec) return;
  var pc = phaseCounts(phaseId, state.template, state.run);
  rec.header.querySelector(".phase-progress").textContent = pc.done+"/"+pc.total;
}

function findItemPair(itemId){
  for(var i=0;i<state.template.sections.length;i++){
    var s = state.template.sections[i];
    for(var j=0;j<s.items.length;j++){
      if(s.items[j].id === itemId) return { section:s, item:s.items[j] };
    }
  }
  return null;
}

/* ============================================================
   ARM badge (topbar) + progress bar
   ============================================================ */
var lastGateArmed = null;
function renderArmBadge(){
  var c = sahaItemCounts(state.template, state.run);
  var armed = c.total > 0 && c.done === c.total;
  var badge = document.getElementById("arm-badge");
  if(!badge) return;
  badge.dataset.armed = armed ? "true" : "false";
  document.getElementById("arm-label").textContent = "ARM";
  document.getElementById("arm-count").textContent = c.done+"/"+c.total;
  var ps = document.getElementById("arm-print-status");
  if(ps) ps.textContent = armed ? "ARM DURUMU: HAZIR ✓" : "ARM DURUMU: TAMAMLANMADI ("+c.done+"/"+c.total+")";
  if(lastGateArmed === false && armed === true){
    vibrate([30,40,30,40,60]);
  } else if(lastGateArmed === true && armed === false){
    vibrate([20,30,80]);
  }
  lastGateArmed = armed;
}

function renderProgress(){
  var total = 0, done = 0;
  state.template.sections.forEach(function(s){
    s.items.forEach(function(it){
      total++;
      if(state.run.checks[it.id] && state.run.checks[it.id].ok) done++;
    });
  });
  var pct = total > 0 ? Math.round((done/total)*100) : 0;
  document.getElementById("progress-fill").style.width = pct + "%";
}

/* ============================================================
   Section nav (bottom bar prev/next)
   ============================================================ */
function flatSectionOrder(){ return state.template.sections.map(function(s){ return s.id; }); }
function currentNavIndex(){
  var order = flatSectionOrder();
  for(var i=0;i<state.template.sections.length;i++){
    var s = state.template.sections[i];
    if(s.phase === "saha"){
      var sc = sectionCounts(s, state.run);
      if(sc.done < sc.total) return i;
    }
  }
  for(var i=0;i<state.template.sections.length;i++){
    var s = state.template.sections[i];
    var sc = sectionCounts(s, state.run);
    if(sc.done < sc.total) return i;
  }
  return order.length-1;
}
var navIndex = 0;
function renderNavRow(){
  var order = flatSectionOrder();
  document.getElementById("nav-pos").textContent = (navIndex+1)+"/"+order.length;
}
function navigateSection(delta){
  var order = flatSectionOrder();
  navIndex = Math.max(0, Math.min(order.length-1, navIndex+delta));
  scrollToSection(order[navIndex]);
  renderNavRow();
}
function scrollToSection(sectionId){
  var pair = findItemPair.bind(null);
  var section = state.template.sections.find(function(s){ return s.id===sectionId; });
  if(!section) return;
  expandPhase(section.phase);
  var rec = state.sectionEls[sectionId];
  if(rec){
    requestAnimationFrame(function(){
      var y = rec.el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top:y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }
}
function expandPhase(phaseId){
  state.manualPhaseOverride[phaseId] = true;
  var rec = state.phaseEls[phaseId];
  if(rec){
    rec.body.hidden = false;
    rec.header.querySelector(".phase-chevron").textContent = "▾";
  }
}
function prefersReducedMotion(){
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ============================================================
   Observer (Scroll sync)
   ============================================================ */
function setupSectionObserver(){
  if(typeof IntersectionObserver === "undefined") return;
  state.sectionObserver = new IntersectionObserver(function(entries){
    var visible = [];
    entries.forEach(function(e){ if(e.isIntersecting) visible.push(e.target.dataset.id); });
    if(visible.length > 0){
      var order = flatSectionOrder();
      var first = visible[0];
      var idx = order.indexOf(first);
      if(idx >= 0 && idx !== navIndex){
        navIndex = idx;
        renderNavRow();
      }
    }
  }, { rootMargin: "-40% 0px -40% 0px" });
  Object.keys(state.sectionEls).forEach(function(k){
    state.sectionObserver.observe(state.sectionEls[k].el);
  });
}

/* ============================================================
   Toggle logic
   ============================================================ */
function toggleItem(itemId){
  var check = state.run.checks[itemId];
  var pair = findItemPair(itemId);
  if(!check || !pair) return;

  var li = state.itemEls[itemId];
  check.ok = !check.ok;
  check.ts = nowTs();
  if(check.ok) vibrate(30);
  persistRun();
  patchItem(itemId);
}

function vibrate(pattern){
  if(navigator.vibrate){ try{ navigator.vibrate(pattern); }catch(e){} }
}

/* ============================================================
   Notes
   ============================================================ */
function toggleNoteEditor(itemId){
  var li = state.itemEls[itemId];
  if(!li) return;
  var editor = li.querySelector(".item-note-editor");
  editor.hidden = !editor.hidden;
  if(!editor.hidden){
    var ta = editor.querySelector("textarea");
    ta.focus();
  }
}
var noteDebounce = {};
function onNoteInput(itemId, value){
  var check = state.run.checks[itemId];
  if(!check) return;
  check.note = value;
  check.ts = nowTs();
  clearTimeout(noteDebounce[itemId]);
  noteDebounce[itemId] = setTimeout(function(){
    persistRun();
    patchItem(itemId);
  }, 400);
}

/* ============================================================
   Long press
   ============================================================ */
function attachLongPress(el, itemId){
  var timer = null, moved = false, fired = false, startX=0, startY=0;
  el.addEventListener("pointerdown", function(e){
    moved = false; fired = false;
    startX = e.clientX; startY = e.clientY;
    timer = setTimeout(function(){
      fired = true;
      toggleNoteEditor(itemId);
    }, 550);
  });
  el.addEventListener("pointermove", function(e){
    if(Math.abs(e.clientX-startX) > 10 || Math.abs(e.clientY-startY) > 10){
      moved = true;
      clearTimeout(timer);
    }
  });
  el.addEventListener("pointerup", function(){ clearTimeout(timer); });
  el.addEventListener("pointercancel", function(){ clearTimeout(timer); });
  el.addEventListener("click", function(e){
    if(fired || moved){ e.preventDefault(); e.stopPropagation(); fired=false; moved=false; return; }
    toggleItem(itemId);
  });
}

/* ============================================================
   Persistence
   ============================================================ */
function persistRun(){
  saveJSON(LS_ACTIVE, state.run);
}
function persistTemplate(){
  saveJSON(LS_TEMPLATE, state.template);
}
function persistRuns(){
  while(state.runs.length > 100) state.runs.pop();
  try{
    saveJSON(LS_RUNS, state.runs);
  }catch(e){
    if(state.runs.length > 5){
      state.runs.splice(Math.floor(state.runs.length * 0.8));
      saveJSON(LS_RUNS, state.runs);
    }
  }
}

/* ============================================================
   New flight
   ============================================================ */
function startNewFlight(){
  var prev = state.run;
  prev.endedAt = nowTs();
  state.runs.unshift(prev);
  persistRuns();
  state.run = createRun(state.template, state.runs);
  state.manualPhaseOverride = {};
  lastGateArmed = null;
  navIndex = 0;
  persistRun();
  renderAll();
  showToast("Yeni uçuş başlatıldı");
}

function bindNewFlightBtn(){
  var btn = document.getElementById("new-flight-btn");
  if(!btn) return;
  var timer = null, holding = false;
  function startHold(e){
    if(e.button && e.button !== 0) return;
    e.preventDefault();
    holding = true;
    btn.dataset.holding = "true";
    timer = setTimeout(function(){
      if(holding){
        btn.dataset.holding = "false";
        holding = false;
        vibrate([50,50,50]);
        startNewFlight();
      }
    }, 500);
  }
  function endHold(){
    if(holding){
      holding = false;
      btn.dataset.holding = "false";
      clearTimeout(timer);
    }
  }
  btn.addEventListener("pointerdown", startHold);
  btn.addEventListener("pointerup", endHold);
  btn.addEventListener("pointerleave", endHold);
  btn.addEventListener("pointercancel", endHold);
  btn.addEventListener("contextmenu", function(e){ e.preventDefault(); });
}

/* ============================================================
   Search
   ============================================================ */
function onSearch(q){
  state.searchQuery = q.toLowerCase();
  var clear = document.getElementById("search-clear");
  if(state.searchQuery){
    if(clear) clear.hidden = false;
    var matchedSections = {};
    var matchedPhases = {};
    Object.keys(state.itemEls).forEach(function(k){
      var pair = findItemPair(k);
      var match = pair && pair.item.text.toLowerCase().indexOf(state.searchQuery) >= 0;
      state.itemEls[k].style.display = match ? "block" : "none";
      if(match && pair){
         matchedSections[pair.section.id] = true;
         matchedPhases[pair.section.phase] = true;
      }
    });
    Object.keys(state.sectionEls).forEach(function(secId){
      var secRec = state.sectionEls[secId];
      if(secRec && secRec.el) {
        secRec.el.style.display = matchedSections[secId] ? "block" : "none";
      }
    });
    Object.keys(state.phaseEls).forEach(function(phaseId){
      var pRec = state.phaseEls[phaseId];
      if(pRec && pRec.el) {
        if(matchedPhases[phaseId]){
          pRec.el.style.display = "block";
          expandPhase(phaseId);
        } else {
          pRec.el.style.display = "none";
        }
      }
    });
  } else {
    if(clear) clear.hidden = true;
    Object.keys(state.itemEls).forEach(function(k){
      if(state.itemEls[k]) state.itemEls[k].style.display = "block";
    });
    Object.keys(state.sectionEls).forEach(function(secId){
      var secRec = state.sectionEls[secId];
      if(secRec && secRec.el) secRec.el.style.display = "block";
    });
    Object.keys(state.phaseEls).forEach(function(phaseId){
      var pRec = state.phaseEls[phaseId];
      if(pRec && pRec.el) pRec.el.style.display = "block";
    });
  }
}

/* ============================================================
   History
   ============================================================ */
function renderHistoryList(){
  var wrap = document.getElementById("history-list");
  wrap.innerHTML = "";
  var all = state.runs;
  if(all.length === 0){
    wrap.innerHTML = '<div class="history-empty">Henüz geçmiş uçuş yok.</div>';
    return;
  }
  all.forEach(function(r){
    var c = sahaItemCounts(state.template, r);
    var div = document.createElement("div");
    div.className = "history-item";
    var armed = c.total>0 && c.done===c.total;
    var timeLabel = formatTime(r.endedAt) || formatTime(r.startedAt);
    div.innerHTML =
      '<button class="history-open" data-action="open-history" data-id="'+r.id+'">'+
        '<span><span class="hi-date">'+r.date+(timeLabel?' <span class="mono">'+timeLabel+'</span>':'')+'</span>'+
        '<span class="hi-meta"> '+escapeHtml(r.aircraft||"—")+'</span></span>'+
        '<span class="hi-status" data-armed="'+armed+'">'+(armed?"ARM'A HAZIR":"tamamlanmadı")+'</span>'+
      '</button>'+
      '<button class="history-delete" data-action="delete-history" data-id="'+r.id+'" aria-label="Uçuşu sil">Sil</button>';
    wrap.appendChild(div);
  });
}

function deleteHistoryRun(runId){
  var idx = state.runs.findIndex(function(r){ return r.id===runId; });
  if(idx < 0) return;
  var removed = state.runs.splice(idx,1)[0];
  persistRuns();
  renderHistoryList();
  showToast("Uçuş silindi: "+removed.date, function(){
    state.runs.splice(idx,0,removed);
    persistRuns();
    renderHistoryList();
  });
}

function openHistoryRun(runId){
  var r = state.runs.find(function(x){ return x.id===runId; });
  if(!r) return;
  state.historyRun = r;
  document.getElementById("readonly-flight-header").innerHTML =
    '<strong>'+r.date+'</strong> · '+escapeHtml(r.aircraft||"—")+' · '+escapeHtml(r.wind||"—")+
    (r.flightNote ? '<br>'+escapeHtml(r.flightNote) : '');
  var root = document.getElementById("readonly-lists-root");
  root.innerHTML = "";
  state.template.sections.forEach(function(section){
    var secEl = document.createElement("section");
    secEl.className = "checklist-section";
    var c = { done:0, total:section.items.length };
    section.items.forEach(function(it){ if(r.checks[it.id] && r.checks[it.id].ok) c.done++; });
    var titleRow = document.createElement("div");
    titleRow.className = "section-title-row";
    titleRow.innerHTML = '<span class="section-title">'+escapeHtml(section.title)+'</span><span class="section-count mono">'+c.done+'/'+c.total+'</span>';
    secEl.appendChild(titleRow);
    var ul = document.createElement("ul");
    ul.className = "item-list";
    section.items.forEach(function(item, idx){
      var chk = r.checks[item.id] || {ok:false,note:""};
      var li = document.createElement("li");
      li.className = "item";
      li.dataset.ok = chk.ok ? "true":"false";
      li.innerHTML =
        '<span class="item-tap"><span class="item-check">'+(chk.ok?"✓":"")+'</span>'+
        '<span class="item-body"><span class="item-num mono">#'+String(idx+1).padStart(2,"0")+(item.critical?"  KRİTİK":"")+'</span>'+
        '<span class="item-text">'+escapeHtml(item.text)+'</span>'+
        (chk.note ? '<span class="item-note-preview">'+escapeHtml(chk.note)+'</span>' : '')+
        '</span></span>';
      ul.appendChild(li);
    });
    secEl.appendChild(ul);
    root.appendChild(secEl);
  });
  document.getElementById("readonly-lists-root").parentElement.classList.add("readonly");
  switchView("run-readonly");
}

/* ============================================================
   Export / Import
   ============================================================ */
function exportRun(){
  var blob = new Blob([JSON.stringify(state.run, null, 2)], {type:"application/json"});
  downloadBlob(blob, "ucus-"+state.run.id+".json");
}
function exportTemplate(){
  var blob = new Blob([JSON.stringify(state.template, null, 2)], {type:"application/json"});
  downloadBlob(blob, "checklist-sablon.json");
}
function downloadBlob(blob, filename){
  var a = document.createElement("a");
  var url = URL.createObjectURL(blob);
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

function importTemplateFile(file){
  if(file.size > 2 * 1024 * 1024){ showToast("Dosya çok büyük (maks 2MB)"); return; }
  var name = file.name || "";
  var reader = new FileReader();
  if(/\.json$/i.test(name)){
    reader.onload = function(){
      try{
        var tpl = JSON.parse(reader.result);
        if(!tpl.sections || !tpl.sections.length) throw new Error("invalid");
        applyImportedTemplate(tpl);
      }catch(e){ showToast("Şablon dosyası okunamadı"); }
    };
    reader.readAsText(file);
  } else if(/\.xlsx$/i.test(name)){
    reader.onload = function(){
      try{
        var data = new Uint8Array(reader.result);
        var wb = XLSX.read(data, {type:"array"});
        var tpl = importTemplateFromWorkbook(wb, name.replace(/\.xlsx$/i,""));
        applyImportedTemplate(tpl);
      }catch(e){
        if(e && e.message === "no-sections-found"){
          showToast("Dosyada madde bulunamadı — sütun A/B düzenini kontrol edin");
        } else {
          showToast("Excel dosyası okunamadı");
        }
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    showToast("Desteklenmeyen dosya türü");
  }
}
function applyImportedTemplate(tpl){
  var prevTemplate = deepClone(state.template);
  var prevRun = deepClone(state.run);
  state.template = tpl;
  state.run.checks = {};
  ensureRunChecks(state.template, state.run);
  persistTemplate();
  persistRun();
  state.manualPhaseOverride = {};
  navIndex = 0;
  renderAll();
  showToast("Şablon içe aktarıldı", function(){
    state.template = prevTemplate;
    state.run = prevRun;
    persistTemplate();
    persistRun();
    state.manualPhaseOverride = {};
    navIndex = 0;
    renderAll();
  });
}
function importRunFile(file){
  if(file.size > 2 * 1024 * 1024){ showToast("Dosya çok büyük (maks 2MB)"); return; }
  var reader = new FileReader();
  reader.onload = function(){
    try{
      var r = JSON.parse(reader.result);
      if(!r.checks) throw new Error("invalid");
      state.runs.unshift(state.run);
      persistRuns();
      state.run = r;
      ensureRunChecks(state.template, state.run);
      persistRun();
      renderAll();
      showToast("Uçuş içe aktarıldı");
    }catch(e){ showToast("Uçuş dosyası okunamadı"); }
  };
  reader.readAsText(file);
}

/* ============================================================
   Toast (undo)
   ============================================================ */
function showToast(msg, undoFn){
  var wrap = document.getElementById("toast-wrap");
  var t = document.createElement("div");
  t.className = "toast";
  var span = document.createElement("span");
  span.textContent = msg;
  t.appendChild(span);
  if(undoFn){
    var btn = document.createElement("button");
    btn.textContent = "Geri al";
    btn.addEventListener("click", function(){
      undoFn();
      wrap.removeChild(t);
    });
    t.appendChild(btn);
  }
  wrap.appendChild(t);
  setTimeout(function(){ if(t.parentElement) wrap.removeChild(t); }, 6000);
}

/* ============================================================
   Edit mode
   ============================================================ */
function renderEdit(){
  var root = document.getElementById("edit-root");
  root.innerHTML = "";
  state.template.sections.forEach(function(section, sIdx){
    var div = document.createElement("div");
    div.className = "edit-section";
    div.dataset.id = section.id;

    var titleRow = document.createElement("div");
    titleRow.className = "edit-section-title-row";
    titleRow.innerHTML =
      '<div class="edit-updown">'+
        '<button data-action="section-up" data-id="'+section.id+'" '+(sIdx===0?"disabled":"")+'>▲</button>'+
        '<button data-action="section-down" data-id="'+section.id+'" '+(sIdx===state.template.sections.length-1?"disabled":"")+'>▼</button>'+
      '</div>'+
      '<input type="text" value="'+escapeAttr(section.title)+'" data-action="section-title" data-id="'+section.id+'">'+
      '<button class="edit-icon-btn" data-action="delete-section" data-id="'+section.id+'">✕</button>';
    div.appendChild(titleRow);

    var flags = document.createElement("div");
    flags.className = "edit-flags";
    flags.innerHTML =
      '<label>faz: <select data-action="section-phase" data-id="'+section.id+'">'+
        ["hazirlik","saha","ucus-sonrasi"].map(function(p){
          return '<option value="'+p+'" '+(section.phase===p?"selected":"")+'>'+PHASE_LABEL[p]+'</option>';
        }).join("")+
      '</select></label>';
    div.appendChild(flags);

    section.items.forEach(function(item, iIdx){
      var row = document.createElement("div");
      row.className = "edit-item-row";
      row.innerHTML =
        '<div class="edit-updown">'+
          '<button data-action="item-up" data-sid="'+section.id+'" data-id="'+item.id+'" '+(iIdx===0?"disabled":"")+'>▲</button>'+
          '<button data-action="item-down" data-sid="'+section.id+'" data-id="'+item.id+'" '+(iIdx===section.items.length-1?"disabled":"")+'>▼</button>'+
        '</div>'+
        '<input type="text" value="'+escapeAttr(item.text)+'" data-action="item-text" data-sid="'+section.id+'" data-id="'+item.id+'">'+
        '<label class="edit-crit"><input type="checkbox" data-action="item-critical" data-sid="'+section.id+'" data-id="'+item.id+'" '+(item.critical?"checked":"")+'> krit.</label>'+
        '<button class="edit-icon-btn" data-action="delete-item" data-sid="'+section.id+'" data-id="'+item.id+'">✕</button>';
      div.appendChild(row);
    });

    var addBtn = document.createElement("button");
    addBtn.className = "edit-add-item";
    addBtn.dataset.action = "add-item";
    addBtn.dataset.sid = section.id;
    addBtn.textContent = "+ Madde ekle";
    div.appendChild(addBtn);

    root.appendChild(div);
  });
}
function escapeAttr(s){ return escapeHtml(s).replace(/"/g,"&quot;"); }

function editAction(action, ds, inputEl){
  var tpl = state.template;
  if(action === "section-title"){
    var s = tpl.sections.find(function(x){ return x.id===ds.id; });
    if(s) s.title = inputEl.value;
  } else if(action === "section-phase"){
    var s3 = tpl.sections.find(function(x){ return x.id===ds.id; });
    if(s3) s3.phase = inputEl.value;
  } else if(action === "section-up" || action === "section-down"){
    var idx = tpl.sections.findIndex(function(x){ return x.id===ds.id; });
    var swapWith = action==="section-up" ? idx-1 : idx+1;
    if(swapWith>=0 && swapWith<tpl.sections.length){
      var tmp = tpl.sections[idx]; tpl.sections[idx]=tpl.sections[swapWith]; tpl.sections[swapWith]=tmp;
    }
  } else if(action === "delete-section"){
    var idx2 = tpl.sections.findIndex(function(x){ return x.id===ds.id; });
    if(idx2 >= 0){
      var removed = tpl.sections.splice(idx2,1)[0];
      showToast("Bölüm silindi: "+removed.title, function(){
        tpl.sections.splice(idx2,0,removed);
        persistTemplate(); renderEdit();
      });
    }
  } else if(action === "item-text"){
    var sec = tpl.sections.find(function(x){ return x.id===ds.sid; });
    var it = sec && sec.items.find(function(x){ return x.id===ds.id; });
    if(it) it.text = inputEl.value;
  } else if(action === "item-critical"){
    var sec2 = tpl.sections.find(function(x){ return x.id===ds.sid; });
    var it2 = sec2 && sec2.items.find(function(x){ return x.id===ds.id; });
    if(it2) it2.critical = inputEl.checked;
  } else if(action === "item-up" || action === "item-down"){
    var sec3 = tpl.sections.find(function(x){ return x.id===ds.sid; });
    if(sec3){
      var iidx = sec3.items.findIndex(function(x){ return x.id===ds.id; });
      var swap = action==="item-up" ? iidx-1 : iidx+1;
      if(swap>=0 && swap<sec3.items.length){
        var tmp2 = sec3.items[iidx]; sec3.items[iidx]=sec3.items[swap]; sec3.items[swap]=tmp2;
      }
    }
  } else if(action === "delete-item"){
    var sec4 = tpl.sections.find(function(x){ return x.id===ds.sid; });
    if(sec4){
      var iidx2 = sec4.items.findIndex(function(x){ return x.id===ds.id; });
      if(iidx2>=0){
        var removedItem = sec4.items.splice(iidx2,1)[0];
        showToast("Madde silindi: "+removedItem.text, function(){
          sec4.items.splice(iidx2,0,removedItem);
          persistTemplate(); renderEdit();
        });
      }
    }
  } else if(action === "add-item"){
    var sec5 = tpl.sections.find(function(x){ return x.id===ds.sid; });
    if(sec5){
      sec5.items.push({ id: uid(sec5.id+"i"), text:"Yeni madde", critical:false });
    }
  }
  persistTemplate();
  var isStructure = ["section-up","section-down","delete-section","item-up","item-down","delete-item","add-item"].indexOf(action) >= 0;
  if(isStructure) renderEdit();
}

function addSection(){
  var s = { id: uid("s"), title:"Yeni bölüm", phase:"saha", blocking:false, items:[] };
  state.template.sections.push(s);
  persistTemplate();
  renderEdit();
}

/* ============================================================
   View switching
   ============================================================ */
function switchView(view){
  state.view = view;
  document.getElementById("view-run").hidden = view !== "run";
  document.getElementById("view-history").hidden = view !== "history";
  document.getElementById("view-run-readonly").hidden = view !== "run-readonly";
  document.getElementById("view-edit").hidden = view !== "edit";
  document.getElementById("bottombar").hidden = view !== "run";
  window.scrollTo(0,0);
  if(view === "history") renderHistoryList();
  if(view === "edit") renderEdit();
  if(view === "run"){ renderAll(); }
}

/* ============================================================
   Events
   ============================================================ */
function bindGlobalEvents(){
  var listsRoot = document.getElementById("lists-root");
  listsRoot.addEventListener("click", function(e){
    var toggleBtn = e.target.closest('[data-action="toggle-phase"]');
    if(toggleBtn){
      var phaseId = toggleBtn.dataset.phase;
      var currentlyExpanded = isPhaseExpanded(phaseId);
      state.manualPhaseOverride[phaseId] = !currentlyExpanded;
      var rec = state.phaseEls[phaseId];
      rec.body.hidden = currentlyExpanded;
      rec.header.querySelector(".phase-chevron").textContent = currentlyExpanded ? "▸" : "▾";
      return;
    }
    var noteBtn = e.target.closest('[data-action="toggle-note"]');
    if(noteBtn){
      toggleNoteEditor(noteBtn.dataset.id);
      return;
    }
  });
  listsRoot.addEventListener("input", function(e){
    if(e.target.matches('[data-action="note-input"]')){
      onNoteInput(e.target.dataset.id, e.target.value);
    }
  });

  document.getElementById("nav-prev").addEventListener("click", function(){ navigateSection(-1); });
  document.getElementById("nav-next").addEventListener("click", function(){ navigateSection(1); });
  bindNewFlightBtn();

  var searchInp = document.getElementById("search-input");
  var searchClr = document.getElementById("search-clear");
  var searchToggle = document.getElementById("search-toggle-btn");
  var searchWrap = document.getElementById("topbar-search");
  var appTitle = document.getElementById("app-title");
  if(searchToggle && searchWrap){
    searchToggle.addEventListener("click", function(){
      searchWrap.hidden = !searchWrap.hidden;
      if(appTitle) appTitle.hidden = !searchWrap.hidden;
      
      if(!searchWrap.hidden) {
        searchInp.focus();
        searchToggle.textContent = "Kapat";
      } else {
        searchInp.value = "";
        onSearch("");
        searchToggle.textContent = "Ara";
      }
    });
  }
  if(searchInp){
    searchInp.addEventListener("input", function(e){ onSearch(e.target.value); });
    searchClr.addEventListener("click", function(){
      searchInp.value = "";
      onSearch("");
      searchInp.focus();
    });
  }

  document.getElementById("f-date").addEventListener("change", function(){ state.run.date = this.value || todayStr(); persistRun(); });
  document.getElementById("f-aircraft").addEventListener("input", function(){ state.run.aircraft = this.value; persistRun(); });
  document.getElementById("f-wind").addEventListener("input", function(){ state.run.wind = this.value; persistRun(); });
  document.getElementById("f-note").addEventListener("input", function(){ state.run.flightNote = this.value; persistRun(); });

  document.getElementById("menu-btn").addEventListener("click", function(){
    renderThemePicker();
    document.getElementById("menu-overlay").hidden = false;
  });
  document.getElementById("menu-overlay").addEventListener("click", function(e){
    if(e.target.id === "menu-overlay"){ document.getElementById("menu-overlay").hidden = true; return; }
    var btn = e.target.closest("[data-action]");
    if(!btn) return;
    var action = btn.dataset.action;
    if(action === "set-theme"){
      setThemePref(btn.dataset.theme);
      renderThemePicker();
      return;
    }
    document.getElementById("menu-overlay").hidden = true;
    if(action === "history") switchView("history");
    else if(action === "edit") switchView("edit");
    else if(action === "export-run") exportRun();
    else if(action === "export-tpl") exportTemplate();
    else if(action === "import-tpl") document.getElementById("file-import-tpl").click();
    else if(action === "import-run") document.getElementById("file-import-run").click();
    else if(action === "print") window.print();
    else if(action === "close"){ /* noop */ }
  });

  document.getElementById("file-import-tpl").addEventListener("change", function(){
    if(this.files && this.files[0]) importTemplateFile(this.files[0]);
    this.value = "";
  });
  document.getElementById("file-import-run").addEventListener("change", function(){
    if(this.files && this.files[0]) importRunFile(this.files[0]);
    this.value = "";
  });

  document.querySelectorAll('[data-back]').forEach(function(btn){
    btn.addEventListener("click", function(){ switchView("run"); });
  });

  document.getElementById("history-list").addEventListener("click", function(e){
    var openBtn = e.target.closest('[data-action="open-history"]');
    if(openBtn){ openHistoryRun(openBtn.dataset.id); return; }
    var delBtn = e.target.closest('[data-action="delete-history"]');
    if(delBtn){ deleteHistoryRun(delBtn.dataset.id); return; }
  });

  document.getElementById("edit-root").addEventListener("click", function(e){
    var btn = e.target.closest("[data-action]");
    if(!btn) return;
    if(btn.tagName === "INPUT" || btn.tagName === "SELECT") return;
    var action = btn.dataset.action;
    if(["section-up","section-down","delete-section","item-up","item-down","delete-item","add-item"].indexOf(action) >= 0){
      editAction(action, btn.dataset, null);
    }
  });
  document.getElementById("edit-root").addEventListener("change", function(e){
    var el = e.target;
    var action = el.dataset.action;
    if(!action) return;
    if(["section-title","section-phase","item-text","item-critical"].indexOf(action) >= 0){
      editAction(action, el.dataset, el);
    }
  });
  document.getElementById("edit-add-section").addEventListener("click", addSection);

  window.addEventListener("beforeprint", function(){
    if(state.view !== "run" && state.view !== "run-readonly"){
      /* print current run view by default */
    }
  });
}

/* ============================================================
   Wake lock
   ============================================================ */
var wakeLock = null;
function setupWakeLock(){
  if(!("wakeLock" in navigator)) return;
  requestWakeLock();
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "visible" && (state.view==="run")) requestWakeLock();
  });
}
function requestWakeLock(){
  navigator.wakeLock.request("screen").then(function(lock){
    wakeLock = lock;
  }).catch(function(){});
}

/* ============================================================
   Boot
   ============================================================ */
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

if("serviceWorker" in navigator && location.protocol !== "file:"){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("./sw.js").catch(function(){});
  });
}

})();
