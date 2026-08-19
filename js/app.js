(function(){
"use strict";

/* ============================================================
   Data
   ============================================================ */
var LS_TEMPLATE = "checklist:template";
var LS_RUNS = "checklist:runs";
var LS_ACTIVE = "checklist:activeRun";
var LS_THEME = "checklist:theme";
var LS_UPDATE_STATE = "checklist:templateUpdateState";

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

// Defaults now live in js/default-template.js (loaded before this file) so
// they're easy to find and edit without wading through app logic.
var DEFAULT_TEMPLATE = window.DEFAULT_TEMPLATE;
var TEMPLATE_UPDATES = window.TEMPLATE_UPDATES || [];

function deepClone(o){ return typeof structuredClone==="function"?structuredClone(o):JSON.parse(JSON.stringify(o)); }
function loadJSON(key, fallback){
  try{
    var raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function saveJSON(key, val){
  try{
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  }catch(e){
    return false;
  }
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

function templateVersion(tpl){
  return (tpl && typeof tpl.version === "number") ? tpl.version : 0;
}
function filterVisibleSections(sections){
  return (sections||[]).filter(function(s){ return !s.hidden; });
}
function visibleSectionsList(tpl){
  return filterVisibleSections(tpl && tpl.sections);
}
function visibleItemsList(section){
  return (section && section.items || []).filter(function(it){ return !it.hidden; });
}

function allItems(tpl){
  var out = [];
  visibleSectionsList(tpl).forEach(function(s){ visibleItemsList(s).forEach(function(it){ out.push({section:s, item:it}); }); });
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
    flightNoteHtml: "",
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

function runHasProgress(run){
  if(!run) return false;
  if(String(run.aircraft || "").trim() || String(run.wind || "").trim() || String(run.flightNote || "").trim()) return true;
  for(var k in (run.checks || {})){
    var check = run.checks[k];
    if(check && (check.ok || check.ts || String(check.note || "").trim())) return true;
  }
  return false;
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
        current = { id:uid("u-s"), title:"Bölüm "+sIdx, phase:"saha", blocking:false, items:[], origin:"user" };
        sections.push(current);
      }
      current.items.push({ id:uid("u-"), text:bStr, critical:false, origin:"user" });
      return;
    }
    if(!aIsNum && aStr !== ""){
      sIdx++;
      current = { id:uid("u-s"), title:stripSectionPrefix(aStr), phase:"saha", blocking:false, items:[], origin:"user" };
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

function normalizeImportedUserIds(tpl){
  var usedIds = {};
  (tpl.sections || []).forEach(function(section){
    var userSection = section.origin === "user" || /^u-/.test(section.id || "");
    if(userSection && !/^u-/.test(section.id || "")) section.id = uid("u-s");
    if(!section.id || usedIds[section.id]){
      section.id = uid("u-s");
      section.origin = "user";
    }
    usedIds[section.id] = true;
    if(!Array.isArray(section.items)) section.items = [];
    section.items.forEach(function(item){
      var userItem = item.origin === "user" || /^u-/.test(item.id || "");
      if(userItem && !/^u-/.test(item.id || "")) item.id = uid("u-");
      if(!item.id || usedIds[item.id]){
        item.id = uid("u-");
        item.origin = "user";
      }
      usedIds[item.id] = true;
    });
  });
  return tpl;
}

/* ============================================================
   Template updates

   Updates are independent, append-only migrations. Mandatory
   migrations cannot be declined. Optional migrations are applied
   only after an explicit decision, so a later mandatory release
   cannot accidentally include an earlier declined change.
   ============================================================ */
function sortedTemplateUpdates(){
  return TEMPLATE_UPDATES.slice().sort(function(a, b){ return a.sequence - b.sequence; });
}
function emptyTemplateUpdateState(){
  return { schema:1, applied:[], optionalDecisions:{} };
}
function normalizeTemplateUpdateState(raw){
  var clean = emptyTemplateUpdateState();
  if(!raw || typeof raw !== "object") return clean;
  if(Array.isArray(raw.applied)){
    raw.applied.forEach(function(id){ if(typeof id === "string" && clean.applied.indexOf(id) < 0) clean.applied.push(id); });
  }
  if(raw.optionalDecisions && typeof raw.optionalDecisions === "object"){
    Object.keys(raw.optionalDecisions).forEach(function(id){
      var decision = raw.optionalDecisions[id];
      if(decision === "accepted" || decision === "declined") clean.optionalDecisions[id] = decision;
    });
  }
  return clean;
}
function freshTemplateUpdateState(){
  var fresh = emptyTemplateUpdateState();
  sortedTemplateUpdates().forEach(function(update){
    if(update.type === "mandatory") fresh.applied.push(update.id);
  });
  return fresh;
}
function updateIsApplied(update){
  return state.updateState.applied.indexOf(update.id) >= 0;
}
function updateIsEffective(update){
  if(update.type === "mandatory") return true;
  return state.updateState.optionalDecisions[update.id] === "accepted";
}
function pendingEffectiveUpdates(){
  return sortedTemplateUpdates().filter(function(update){ return updateIsEffective(update) && !updateIsApplied(update); });
}
function nextOptionalUpdate(){
  return sortedTemplateUpdates().find(function(update){
    return update.type === "optional" && !updateIsApplied(update) && !state.updateState.optionalDecisions[update.id];
  }) || null;
}
function findTemplateSection(tpl, sectionId){
  return (tpl.sections || []).find(function(section){ return section.id === sectionId; }) || null;
}
function recoverBaselineSection(tpl, sectionId){
  var target = findTemplateSection(tpl, sectionId);
  if(target) return target;
  var defaults = (DEFAULT_TEMPLATE && DEFAULT_TEMPLATE.sections) || [];
  var defaultIndex = defaults.findIndex(function(section){ return section.id === sectionId; });
  if(defaultIndex < 0) return null;
  var def = defaults[defaultIndex];
  target = { id:def.id, title:def.title, phase:def.phase, blocking:!!def.blocking, items:[] };
  var index = tpl.sections.length;
  for(var i=defaultIndex-1;i>=0;i--){
    var previous = tpl.sections.findIndex(function(section){ return section.id === defaults[i].id; });
    if(previous >= 0){ index = previous + 1; break; }
  }
  tpl.sections.splice(index, 0, target);
  return target;
}
function insertionIndex(list, op){
  if(op.beforeId){
    var before = list.findIndex(function(entry){ return entry.id === op.beforeId; });
    if(before >= 0) return before;
  }
  if(op.afterId){
    var after = list.findIndex(function(entry){ return entry.id === op.afterId; });
    if(after >= 0) return after + 1;
  }
  if(op.position === "start") return 0;
  return list.length;
}
function removeItemForUpdate(tpl, op){
  (tpl.sections || []).forEach(function(section){
    if(op.hard){
      section.items = (section.items || []).filter(function(item){ return item.id !== op.id; });
    } else {
      section.items = (section.items || []).map(function(item){
        return item.id === op.id ? Object.assign({}, item, { hidden:true }) : item;
      });
    }
  });
}
function upsertItemForUpdate(tpl, op){
  var target = findTemplateSection(tpl, op.sectionId) || recoverBaselineSection(tpl, op.sectionId);
  if(!target) throw new Error("update-section-not-found:" + op.sectionId);
  var existing = null;
  (tpl.sections || []).forEach(function(section){
    section.items = (section.items || []).filter(function(item){
      if(item.id !== op.item.id) return true;
      if(!existing) existing = item;
      return false;
    });
  });
  var item = Object.assign({}, existing || {}, op.item);
  delete item.hidden;
  delete item.origin;
  var index = insertionIndex(target.items, op);
  target.items.splice(index, 0, item);
}
function setItemOrderForUpdate(tpl, op){
  var section = findTemplateSection(tpl, op.sectionId);
  if(!section) return;
  var wanted = {};
  op.ids.forEach(function(id, index){ wanted[id] = index; });
  var byId = {};
  section.items.forEach(function(item){
    if(item.hidden || !Object.prototype.hasOwnProperty.call(wanted, item.id)) return;
    if(!byId[item.id]) byId[item.id] = item;
    else item.hidden = true;
  });
  var ordered = op.ids.map(function(id){ return byId[id]; }).filter(Boolean);
  var cursor = 0;
  section.items = section.items.map(function(item){
    if(!item.hidden && Object.prototype.hasOwnProperty.call(wanted, item.id)) return ordered[cursor++];
    return item;
  });
}
function removeSectionForUpdate(tpl, sectionId){
  var result = [];
  (tpl.sections || []).forEach(function(section){
    if(section.id !== sectionId){
      result.push(section);
      return;
    }
    var userItems = (section.items || []).filter(function(item){
      return item.origin === "user" || /^u-/.test(item.id || "");
    });
    var hiddenSection = Object.assign({}, section, {
      hidden:true,
      items:(section.items || []).filter(function(item){ return userItems.indexOf(item) < 0; })
    });
    result.push(hiddenSection);
    if(userItems.length){
      result.push({
        id:uid("u-s"),
        title:(section.title || "Bölüm") + " — Kişisel",
        phase:section.phase || "saha",
        blocking:false,
        origin:"user",
        items:userItems
      });
    }
  });
  tpl.sections = result;
}
function upsertSectionForUpdate(tpl, op){
  var existing = null;
  tpl.sections = (tpl.sections || []).filter(function(section){
    if(section.id !== op.section.id) return true;
    if(!existing) existing = section;
    return false;
  });
  var section = Object.assign({}, existing || { items:[] }, op.section);
  if(!Array.isArray(section.items)) section.items = [];
  delete section.hidden;
  delete section.origin;
  tpl.sections.splice(insertionIndex(tpl.sections, op), 0, section);
}
function setSectionOrderForUpdate(tpl, op){
  var wanted = {};
  op.ids.forEach(function(id, index){ wanted[id] = index; });
  var byId = {};
  tpl.sections.forEach(function(section){
    if(section.hidden || !Object.prototype.hasOwnProperty.call(wanted, section.id)) return;
    if(!byId[section.id]) byId[section.id] = section;
    else section.hidden = true;
  });
  var ordered = op.ids.map(function(id){ return byId[id]; }).filter(Boolean);
  var cursor = 0;
  tpl.sections = tpl.sections.map(function(section){
    if(!section.hidden && Object.prototype.hasOwnProperty.call(wanted, section.id)) return ordered[cursor++];
    return section;
  });
}
function applyTemplateUpdateOperation(tpl, op){
  if(op.op === "removeItem") removeItemForUpdate(tpl, op);
  else if(op.op === "upsertItem") upsertItemForUpdate(tpl, op);
  else if(op.op === "setItemOrder") setItemOrderForUpdate(tpl, op);
  else if(op.op === "removeSection") removeSectionForUpdate(tpl, op.id);
  else if(op.op === "upsertSection") upsertSectionForUpdate(tpl, op);
  else if(op.op === "setSectionOrder") setSectionOrderForUpdate(tpl, op);
  else throw new Error("unknown-template-update-operation:" + op.op);
}
function applyTemplateUpdate(update){
  (update.operations || []).forEach(function(op){ applyTemplateUpdateOperation(state.template, op); });
  state.template.version = Math.max(templateVersion(state.template), update.version || 0);
}
function syncBlankRunToTemplate(){
  if(!state.run || runHasProgress(state.run)) return;
  state.run.templateSnapshot = deepClone(state.template.sections);
  ensureRunChecks(state.template, state.run);
  persistRun();
}
function applyEligibleTemplateUpdates(syncRun){
  var catalog = sortedTemplateUpdates();
  var pending = pendingEffectiveUpdates();
  if(!pending.length) return [];
  var firstSequence = pending[0].sequence;
  var newlyApplied = [];
  var originalTemplate = state.template;
  state.template = deepClone(originalTemplate);
  try{
    catalog.forEach(function(update){
      if(update.sequence < firstSequence) return;
      if(!updateIsEffective(update)) return;
      if(!updateIsApplied(update)) newlyApplied.push(update);
      applyTemplateUpdate(update);
    });
  }catch(error){
    state.template = originalTemplate;
    throw error;
  }
  if(!persistTemplate()){
    state.template = originalTemplate;
    throw new Error("template-update-save-failed");
  }
  newlyApplied.forEach(function(update){
    if(state.updateState.applied.indexOf(update.id) < 0) state.updateState.applied.push(update.id);
  });
  persistTemplateUpdateState();
  state.pendingTemplateUpdate = false;
  if(syncRun) syncBlankRunToTemplate();
  renderTemplateVersionBadge();
  return newlyApplied;
}
function updatesSummary(updates){
  return updates.map(function(update){ return update.summary; }).filter(Boolean).join(" ");
}
function showAppliedUpdateNotice(updates){
  if(!updates.length) return;
  var allOptional = updates.every(function(update){ return update.type === "optional"; });
  state.activeNotice = {
    kind:"applied",
    title: allOptional ? "İsteğe bağlı güncelleme uygulandı" : "Zorunlu güncelleme uygulandı",
    message: updatesSummary(updates)
  };
  renderNotice();
}
function showTemplateUpdateError(error){
  if(window.console && console.error) console.error(error);
  state.pendingTemplateUpdate = true;
  state.activeNotice = {
    kind:"error",
    title:"Liste güncellemesi uygulanamadı",
    message:"Yerel depolama kullanılamadığı için güncelleme kaydedilemedi. Depolama alanını kontrol edip uygulamayı yeniden açın."
  };
  renderNotice();
}
function refreshTemplateUpdateNotice(hasProgress){
  if(state.activeNotice && (state.activeNotice.kind === "applied" || state.activeNotice.kind === "error")){
    renderNotice();
    return;
  }
  var pending = pendingEffectiveUpdates();
  if(hasProgress && pending.length){
    state.pendingTemplateUpdate = true;
    var allOptional = pending.every(function(update){ return update.type === "optional"; });
    state.activeNotice = {
      kind:"deferred",
      title: allOptional ? "İsteğe bağlı güncelleme sıraya alındı" : "Zorunlu liste güncellemesi",
      message: updatesSummary(pending) + " Mevcut uçuş değiştirilmeyecek; güncelleme yeni uçuş başladığında uygulanacak."
    };
    renderNotice();
    return;
  }
  state.pendingTemplateUpdate = false;
  var optional = nextOptionalUpdate();
  if(optional){
    state.activeNotice = {
      kind:"optional",
      title:"İsteğe bağlı liste güncellemesi",
      message: (optional.title ? optional.title + ": " : "") + (optional.summary || "Yeni bir checklist güncellemesi hazır.") + " Aktif uçuş varsa mevcut liste değişmez; güncelleme sonraki uçuşta uygulanır.",
      update: optional
    };
  } else {
    state.activeNotice = null;
  }
  renderNotice();
}
function checkTemplateUpdates(hasProgress){
  var applied = [];
  try{
    if(!hasProgress) applied = applyEligibleTemplateUpdates(true);
  }catch(error){
    showTemplateUpdateError(error);
    return;
  }
  if(applied.length) showAppliedUpdateNotice(applied);
  else refreshTemplateUpdateNotice(hasProgress);
}
function focusAfterTemplateUpdateAction(){
  setTimeout(function(){
    var notice = state.activeNotice;
    if(notice && notice.kind === "optional"){
      var accept = document.getElementById("template-update-accept");
      if(accept) accept.focus();
    } else if(notice && notice.kind === "applied"){
      var dismiss = document.getElementById("template-notice-dismiss");
      if(dismiss) dismiss.focus();
    } else if(notice){
      var title = document.getElementById("template-notice-title");
      if(title) title.focus();
    } else {
      var stable = document.getElementById("search-toggle-btn");
      if(stable) stable.focus();
    }
  }, 0);
}
function acceptOptionalTemplateUpdate(){
  var notice = state.activeNotice;
  if(!notice || notice.kind !== "optional") return;
  state.updateState.optionalDecisions[notice.update.id] = "accepted";
  persistTemplateUpdateState();
  state.activeNotice = null;
  var hasProgress = runHasProgress(state.run);
  if(hasProgress){
    refreshTemplateUpdateNotice(true);
    focusAfterTemplateUpdateAction();
    return;
  }
  var applied;
  try{
    applied = applyEligibleTemplateUpdates(true);
  }catch(error){
    showTemplateUpdateError(error);
    focusAfterTemplateUpdateAction();
    return;
  }
  if(applied.length) showAppliedUpdateNotice(applied);
  else refreshTemplateUpdateNotice(false);
  focusAfterTemplateUpdateAction();
}
function declineOptionalTemplateUpdate(){
  var notice = state.activeNotice;
  if(!notice || notice.kind !== "optional") return;
  state.updateState.optionalDecisions[notice.update.id] = "declined";
  persistTemplateUpdateState();
  state.activeNotice = null;
  refreshTemplateUpdateNotice(runHasProgress(state.run));
  showToast("İsteğe bağlı güncelleme atlandı");
  focusAfterTemplateUpdateAction();
}
function dismissNotice(){
  if(!state.activeNotice || state.activeNotice.kind !== "applied") return;
  state.activeNotice = null;
  refreshTemplateUpdateNotice(runHasProgress(state.run));
  focusAfterTemplateUpdateAction();
}
function renderNotice(){
  var el = document.getElementById("template-notice");
  var titleEl = document.getElementById("template-notice-title");
  var textEl = document.getElementById("template-notice-text");
  var actionsEl = document.getElementById("template-notice-actions");
  var acceptBtn = document.getElementById("template-update-accept");
  var declineBtn = document.getElementById("template-update-decline");
  var dismissBtn = document.getElementById("template-notice-dismiss");
  if(!el || !titleEl || !textEl || !actionsEl || !acceptBtn || !declineBtn || !dismissBtn) return;
  if(!state.activeNotice){
    el.hidden = true;
    return;
  }
  var notice = state.activeNotice;
  titleEl.textContent = notice.title;
  textEl.textContent = notice.message;
  var isOptional = notice.kind === "optional";
  actionsEl.hidden = !isOptional;
  acceptBtn.hidden = !isOptional;
  declineBtn.hidden = !isOptional;
  dismissBtn.hidden = notice.kind !== "applied";
  acceptBtn.textContent = "Güncellemeyi uygula";
  el.hidden = false;
}
function renderTemplateVersionBadge(){
  var el = document.getElementById("tpl-version-badge");
  if(el) el.textContent = "Şablon v" + templateVersion(state.template);
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
  sectionObserver: null,
  flightNoteEditor: null,
  activeNotice: null,
  pendingTemplateUpdate: false,
  updateState: null
};

function init(){
  var storedTemplate = loadJSON(LS_TEMPLATE, null);
  state.template = storedTemplate || deepClone(DEFAULT_TEMPLATE);
  state.updateState = normalizeTemplateUpdateState(loadJSON(LS_UPDATE_STATE, null));
  if(!storedTemplate){
    state.updateState = freshTemplateUpdateState();
    persistTemplate();
    persistTemplateUpdateState();
  }
  state.runs = loadJSON(LS_RUNS, []);
  state.run = loadJSON(LS_ACTIVE, null);
  checkTemplateUpdates(runHasProgress(state.run));
  if(!state.run) state.run = createRun(state.template, state.runs);
  ensureRunChecks(state.template, state.run);
  saveJSON(LS_ACTIVE, state.run);
  if(window.FlightNoteEditor){
    state.flightNoteEditor = window.FlightNoteEditor.create({ root:document.getElementById("flight-note-editor") });
  }
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
  var items = visibleItemsList(section);
  var total = items.length, done = 0;
  items.forEach(function(it){ if(run.checks[it.id] && run.checks[it.id].ok) done++; });
  return { done:done, total:total };
}
function phaseCounts(phaseId, tpl, run){
  var total=0, done=0;
  visibleSectionsList(tpl).filter(function(s){ return s.phase===phaseId; }).forEach(function(s){
    var c = sectionCounts(s, run);
    total += c.total; done += c.done;
  });
  return { done:done, total:total };
}
function phaseList(tpl){
  var order = [], seen = {};
  visibleSectionsList(tpl).forEach(function(s){
    if(!seen[s.phase]){ seen[s.phase]=true; order.push(s.phase); }
  });
  return order;
}
var PHASE_LABEL = { "hazirlik":"HAZIRLIK", "saha":"SAHA", "ucus-sonrasi":"UÇUŞ SONRASI" };

function autoCurrentPhase(tpl, run){
  var sections = visibleSectionsList(tpl);
  for(var i=0;i<sections.length;i++){
    var c = sectionCounts(sections[i], run);
    if(c.done < c.total) return sections[i].phase;
  }
  return sections.length ? sections[sections.length-1].phase : null;
}
function isPhaseExpanded(phaseId){
  if(Object.prototype.hasOwnProperty.call(state.manualPhaseOverride, phaseId)){
    return state.manualPhaseOverride[phaseId];
  }
  return phaseId === autoCurrentPhase(state.template, state.run);
}



function sahaItemCountsFromSections(sections, run){
  var total=0, done=0;
  filterVisibleSections(sections).filter(function(s){ return s.phase==="saha"; }).forEach(function(s){
    visibleItemsList(s).forEach(function(it){
      total++;
      if(run.checks[it.id] && run.checks[it.id].ok) done++;
    });
  });
  return {done:done, total:total};
}
function sahaItemCounts(tpl, run){
  return sahaItemCountsFromSections(tpl.sections, run);
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
  renderNotice();
  renderTemplateVersionBadge();
}

function renderFlightHeader(){
  var r = state.run;
  document.getElementById("f-date").value = r.date || todayStr();
  document.getElementById("f-aircraft").value = r.aircraft || "";
  document.getElementById("f-wind").value = r.wind || "";
  if(state.flightNoteEditor){
    state.flightNoteEditor.setValue(r.flightNoteHtml || "", r.flightNote || "");
    if(r.flightNoteHtml && state.flightNoteEditor.getHtml() !== r.flightNoteHtml){
      r.flightNoteHtml = state.flightNoteEditor.getHtml();
      persistRun();
    }
  } else {
    document.getElementById("f-note").textContent = r.flightNote || "";
  }
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

    visibleSectionsList(state.template).filter(function(s){ return s.phase===phaseId; }).forEach(function(section){
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
      visibleItemsList(section).forEach(function(item, idx){
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
  updateItemNotePreview(notePreview, check.note);
  bodyEl.appendChild(notePreview);

  tap.appendChild(checkEl);
  tap.appendChild(bodyEl);

  var noteBtn = document.createElement("button");
  noteBtn.className = "item-note-btn";
  noteBtn.dataset.action = "toggle-note";
  noteBtn.dataset.id = item.id;
  noteBtn.setAttribute("aria-label", check.note ? "Notu düzenle" : "Not ekle");
  noteBtn.setAttribute("aria-expanded", "false");
  noteBtn.dataset.hasNote = check.note ? "true" : "false";
  noteBtn.dataset.editing = "false";
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
  ta.setAttribute("enterkeyhint", "done");
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
  updateItemNotePreview(notePreview, check.note);
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
  visibleSectionsList(state.template).forEach(function(s){
    visibleItemsList(s).forEach(function(it){
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
function flatSectionOrder(){ return visibleSectionsList(state.template).map(function(s){ return s.id; }); }
function currentNavIndex(){
  var sections = visibleSectionsList(state.template);
  for(var i=0;i<sections.length;i++){
    var s = sections[i];
    if(s.phase === "saha"){
      var sc = sectionCounts(s, state.run);
      if(sc.done < sc.total) return i;
    }
  }
  for(var i=0;i<sections.length;i++){
    var sc = sectionCounts(sections[i], state.run);
    if(sc.done < sc.total) return i;
  }
  return sections.length-1;
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
function updateItemNotePreview(preview, note){
  if(!preview) return;
  preview.textContent = "";
  preview.hidden = !note;
  if(!note) return;

  var label = document.createElement("span");
  label.className = "item-note-label";
  label.textContent = "Not:";
  var value = document.createElement("span");
  value.className = "item-note-value";
  value.textContent = String(note);
  preview.appendChild(label);
  preview.appendChild(value);
}

function handleItemNoteKeydown(event){
  var target = event.target;
  if(!target || !target.matches('[data-action="note-input"]')) return;
  if(event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  saveItemNote(target.dataset.id);
}

function toggleNoteEditor(itemId){
  var li = state.itemEls[itemId];
  if(!li) return;
  var editor = li.querySelector(".item-note-editor");
  var noteBtn = li.querySelector(".item-note-btn");
  if(!editor || !noteBtn) return;
  if(!editor.hidden){
    saveItemNote(itemId);
    return;
  }
  var check = state.run.checks[itemId];
  var ta = editor.querySelector("textarea");
  ta.value = check ? (check.note || "") : "";
  editor.hidden = false;
  noteBtn.dataset.editing = "true";
  noteBtn.textContent = "Kaydet";
  noteBtn.setAttribute("aria-label", "Notu kaydet");
  noteBtn.setAttribute("aria-expanded", "true");
  ta.focus();
}

function saveItemNote(itemId){
  var li = state.itemEls[itemId];
  var check = state.run.checks[itemId];
  if(!li || !check) return;
  var editor = li.querySelector(".item-note-editor");
  var noteBtn = li.querySelector(".item-note-btn");
  var ta = editor && editor.querySelector("textarea");
  if(!editor || !noteBtn || !ta) return;
  if(check.note !== ta.value){
    check.note = ta.value;
    check.ts = nowTs();
    persistRun();
    patchItem(itemId);
  }
  editor.hidden = true;
  noteBtn.dataset.editing = "false";
  noteBtn.textContent = "Not";
  noteBtn.setAttribute("aria-label", check.note ? "Notu düzenle" : "Not ekle");
  noteBtn.setAttribute("aria-expanded", "false");
  noteBtn.focus();
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
  return saveJSON(LS_ACTIVE, state.run);
}
function persistTemplate(){
  return saveJSON(LS_TEMPLATE, state.template);
}
function persistTemplateUpdateState(){
  return saveJSON(LS_UPDATE_STATE, state.updateState);
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
  var appliedUpdates;
  try{
    appliedUpdates = applyEligibleTemplateUpdates(false);
  }catch(error){
    showToast("Zorunlu liste güncellemesi kaydedilemedi; yeni uçuş başlatılmadı");
    return;
  }
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
  if(appliedUpdates.length) showAppliedUpdateNotice(appliedUpdates);
  else refreshTemplateUpdateNotice(false);
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
    var c = sahaItemCountsFromSections(r.templateSnapshot || state.template.sections, r);
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
  var snapshotSections = filterVisibleSections(r.templateSnapshot || state.template.sections);
  snapshotSections.forEach(function(section){
    var secEl = document.createElement("section");
    secEl.className = "checklist-section";
    var items = visibleItemsList(section);
    var c = { done:0, total:items.length };
    items.forEach(function(it){ if(r.checks[it.id] && r.checks[it.id].ok) c.done++; });
    var titleRow = document.createElement("div");
    titleRow.className = "section-title-row";
    titleRow.innerHTML = '<span class="section-title">'+escapeHtml(section.title)+'</span><span class="section-count mono">'+c.done+'/'+c.total+'</span>';
    secEl.appendChild(titleRow);
    var ul = document.createElement("ul");
    ul.className = "item-list";
    items.forEach(function(item, idx){
      var chk = r.checks[item.id] || {ok:false,note:""};
      var li = document.createElement("li");
      li.className = "item";
      li.dataset.ok = chk.ok ? "true":"false";
      li.innerHTML =
        '<span class="item-tap"><span class="item-check">'+(chk.ok?"✓":"")+'</span>'+
        '<span class="item-body"><span class="item-num mono">#'+String(idx+1).padStart(2,"0")+(item.critical?"  KRİTİK":"")+'</span>'+
        '<span class="item-text">'+escapeHtml(item.text)+'</span>'+
        (chk.note ? '<span class="item-note-preview"><span class="item-note-label">Not:</span><span class="item-note-value">'+escapeHtml(chk.note)+'</span></span>' : '')+
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

function buildPhasesForPdf(tpl, itemMapper, sectionCountText){
  return phaseList(tpl).map(function(phaseId){
    var sections = visibleSectionsList(tpl).filter(function(s){ return s.phase === phaseId; });
    return {
      label: PHASE_LABEL[phaseId] || phaseId,
      sections: sections.map(function(section){
        var items = visibleItemsList(section);
        return {
          title: section.title,
          countText: sectionCountText(section, items),
          items: items.map(function(item, idx){ return itemMapper(section, item, idx); })
        };
      })
    };
  }).filter(function(p){ return p.sections.length; });
}

function buildTemplatePdfSpec(){
  var tpl = state.template;
  var totalItems = 0, totalSections = 0;
  var phases = buildPhasesForPdf(tpl,
    function(section, item, idx){
      totalItems++;
      return { number:"#"+itemNumberLabel(section, idx), text:item.text, critical:!!item.critical, checked:null, note:null };
    },
    function(section, items){ totalSections++; return items.length+" madde"; }
  );
  return {
    documentTitle: tpl.name || "Checklist şablonu",
    filename: "checklist-sablon.pdf",
    generatedAt: new Date(),
    metaLines: [
      { label:"Şablon", value: tpl.name || "—" },
      { label:"Sürüm", value: "v"+templateVersion(tpl) },
      { label:"Bölüm sayısı", value: String(totalSections) },
      { label:"Madde sayısı", value: String(totalItems) }
    ],
    armStamp: null,
    notice: "Bu belge işaretlenmemiş boş bir şablon çıktısıdır.",
    phases: phases
  };
}

function buildRunPdfSpec(run){
  run = run || state.run;
  var tpl = run.templateSnapshot
    ? { name: state.template.name, version: state.template.version, sections: run.templateSnapshot }
    : state.template;
  var c = sahaItemCounts(tpl, run);
  var armed = c.total > 0 && c.done === c.total;
  var phases = buildPhasesForPdf(tpl,
    function(section, item, idx){
      var chk = run.checks[item.id] || {ok:false, note:""};
      return { number:"#"+itemNumberLabel(section, idx), text:item.text, critical:!!item.critical, checked:!!chk.ok, note: chk.note || null };
    },
    function(section){ var sc = sectionCounts(section, run); return sc.done+"/"+sc.total; }
  );
  return {
    documentTitle: (tpl.name || "Uçuş") + " — " + run.id,
    filename: "ucus-" + run.id + ".pdf",
    generatedAt: new Date(),
    metaLines: [
      { label:"Tarih", value: run.date },
      { label:"Uçak / Deneme no", value: run.aircraft },
      { label:"Rüzgar / Hava", value: run.wind }
    ],
    flightNote: run.flightNote || null,
    armStamp: armed ? "ARM DURUMU: HAZIR ✓" : "ARM DURUMU: TAMAMLANMADI ("+c.done+"/"+c.total+")",
    notice: null,
    phases: phases
  };
}

function exportTemplatePdf(){
  if(!window.PdfExport){ showToast("PDF motoru yüklenemedi"); return; }
  window.PdfExport.generate(buildTemplatePdfSpec(), false);
}
function printRunPdf(){
  if(!window.PdfExport){ showToast("PDF motoru yüklenemedi"); return; }
  var run = (state.view === "run-readonly" && state.historyRun) ? state.historyRun : state.run;
  window.PdfExport.generate(buildRunPdfSpec(run), true);
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
  var prevUpdateState = deepClone(state.updateState);
  var prevNotice = state.activeNotice;
  var appliedUpdates;
  try{
    state.template = normalizeImportedUserIds(deepClone(tpl));
    state.updateState = emptyTemplateUpdateState();
    state.updateState.optionalDecisions = deepClone(prevUpdateState.optionalDecisions || {});
    appliedUpdates = applyEligibleTemplateUpdates(false);
    state.run.checks = {};
    ensureRunChecks(state.template, state.run);
    state.run.templateSnapshot = deepClone(state.template.sections);
    persistTemplate();
    persistRun();
    state.manualPhaseOverride = {};
    navIndex = 0;
    renderAll();
    if(appliedUpdates.length) showAppliedUpdateNotice(appliedUpdates);
    else refreshTemplateUpdateNotice(runHasProgress(state.run));
  }catch(error){
    state.template = prevTemplate;
    state.run = prevRun;
    state.updateState = prevUpdateState;
    state.activeNotice = prevNotice;
    persistTemplate();
    persistRun();
    persistTemplateUpdateState();
    throw error;
  }
  showToast("Şablon içe aktarıldı", function(){
    state.template = prevTemplate;
    state.run = prevRun;
    state.updateState = prevUpdateState;
    state.activeNotice = prevNotice;
    persistTemplate();
    persistRun();
    persistTemplateUpdateState();
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
function templateComparisonShape(tpl){
  return {
    name:String((tpl && tpl.name) || ""),
    sections:visibleSectionsList(tpl).map(function(section){
      return {
        id:section.id,
        title:String(section.title || ""),
        phase:section.phase || "saha",
        blocking:!!section.blocking,
        items:visibleItemsList(section).map(function(item){
          return { id:item.id, text:String(item.text || ""), critical:!!item.critical };
        })
      };
    })
  };
}
function defaultTemplateForCurrentChoices(){
  var expected = deepClone(DEFAULT_TEMPLATE);
  var decisions = (state.updateState && state.updateState.optionalDecisions) || {};
  var catalog = sortedTemplateUpdates();
  var accepted = catalog.filter(function(update){
    return update.type === "optional" && decisions[update.id] === "accepted";
  });
  if(!accepted.length) return expected;
  var firstSequence = accepted[0].sequence;
  catalog.forEach(function(update){
    if(update.sequence < firstSequence) return;
    if(update.type !== "mandatory" && decisions[update.id] !== "accepted") return;
    (update.operations || []).forEach(function(op){ applyTemplateUpdateOperation(expected, op); });
    expected.version = Math.max(templateVersion(expected), update.version || 0);
  });
  return expected;
}
function templateDiffersFromDefault(){
  return JSON.stringify(templateComparisonShape(state.template)) !== JSON.stringify(templateComparisonShape(defaultTemplateForCurrentChoices()));
}
function updateResetTemplateButton(){
  var button = document.getElementById("reset-template-btn");
  if(button) button.hidden = !templateDiffersFromDefault();
}
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
      (section.hidden ? '<span class="edit-hidden-tag">kaldırıldı</span>' : '')+
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
        (item.hidden ? '<span class="edit-hidden-tag">kaldırıldı</span>' : '')+
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
  updateResetTemplateButton();
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
      sec5.items.push({ id: uid("u-"), text:"Yeni madde", critical:false, origin:"user" });
    }
  }
  persistTemplate();
  var isStructure = ["section-up","section-down","delete-section","item-up","item-down","delete-item","add-item"].indexOf(action) >= 0;
  if(isStructure) renderEdit();
  else updateResetTemplateButton();
}

function addSection(){
  var s = { id: uid("u-s"), title:"Yeni bölüm", phase:"saha", blocking:false, items:[], origin:"user" };
  state.template.sections.push(s);
  persistTemplate();
  renderEdit();
}

function resetTemplateToDefault(){
  var ok = window.confirm("Şablonu sıfırlamak yerel değişikliklerinizi silecek ve varsayılan şablonu geri yükleyecek. Bu işlem geri alınamaz. Devam edilsin mi?");
  if(!ok) return;
  var optionalDecisions = deepClone((state.updateState && state.updateState.optionalDecisions) || {});
  state.template = deepClone(DEFAULT_TEMPLATE);
  state.updateState = freshTemplateUpdateState();
  state.updateState.optionalDecisions = optionalDecisions;
  applyEligibleTemplateUpdates(false);
  persistTemplate();
  persistTemplateUpdateState();
  ensureRunChecks(state.template, state.run);
  state.run.templateSnapshot = deepClone(state.template.sections);
  persistRun();
  state.manualPhaseOverride = {};
  navIndex = 0;
  state.pendingTemplateUpdate = false;
  state.activeNotice = null;
  refreshTemplateUpdateNotice(runHasProgress(state.run));
  renderTemplateVersionBadge();
  renderEdit();
  showToast("Şablon sıfırlandı");
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
  listsRoot.addEventListener("keydown", handleItemNoteKeydown);
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
  document.getElementById("f-note").addEventListener("richchange", function(event){
    state.run.flightNote = event.detail.text;
    state.run.flightNoteHtml = event.detail.text ? event.detail.html : "";
    persistRun();
  });
  if(!state.flightNoteEditor){
    document.getElementById("f-note").addEventListener("input", function(){
      state.run.flightNote = this.textContent || "";
      persistRun();
    });
  }

  document.getElementById("menu-btn").addEventListener("click", function(){
    renderThemePicker();
    var tplToggle = document.querySelector('[data-action="toggle-export-tpl"]');
    if(tplToggle){
      tplToggle.setAttribute("aria-expanded", "false");
      document.querySelector('.menu-group[data-group="export-tpl"] .menu-subrow').hidden = true;
    }
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
    if(action === "toggle-export-tpl"){
      var sub = document.querySelector('.menu-group[data-group="export-tpl"] .menu-subrow');
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      sub.hidden = expanded;
      return;
    }
    document.getElementById("menu-overlay").hidden = true;
    if(action === "history") switchView("history");
    else if(action === "edit") switchView("edit");
    else if(action === "export-run") exportRun();
    else if(action === "export-tpl-pdf") exportTemplatePdf();
    else if(action === "export-tpl-json") exportTemplate();
    else if(action === "import-tpl") document.getElementById("file-import-tpl").click();
    else if(action === "import-run") document.getElementById("file-import-run").click();
    else if(action === "print") printRunPdf();
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
  document.getElementById("reset-template-btn").addEventListener("click", resetTemplateToDefault);

  document.getElementById("template-notice-dismiss").addEventListener("click", dismissNotice);
  document.getElementById("template-update-accept").addEventListener("click", acceptOptionalTemplateUpdate);
  document.getElementById("template-update-decline").addEventListener("click", declineOptionalTemplateUpdate);

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
