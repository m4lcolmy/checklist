/* ============================================================
   PDF export engine (jsPDF, vector-drawn — no headless browser print).
   Consumes a plain-data "spec" built by app.js from state.template /
   state.run, so this file has no knowledge of app internals.
   ============================================================ */
(function(){
"use strict";

var PAGE_W = 210, PAGE_H = 297;          // A4, mm
var MARGIN_L = 14, MARGIN_R = 14;
var CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
var CONTENT_TOP = 21;                     // first y below running header
var CONTENT_BOTTOM = 278;                 // last y above running footer
var FONT = "Roboto";

var INK = [17,20,22];
var MUTED = [104,104,104];
var HAIRLINE = [208,208,208];
var RULE = [40,40,40];
var FILL_LIGHT = [244,243,239];
var BAR = [24,24,24];

var SECTION_HEADER_H = 9.6;
var PHASE_HEADER_H = 11.5;
var MIN_ITEM_RESERVE = 7.6; // shortest possible item row (measureItem's floor)

var COL_CHECK_X = MARGIN_L;
var COL_CHECK_SIZE = 3.8;
var COL_NUM_X = MARGIN_L + 6.2;
var COL_CRIT_X = COL_NUM_X + 7.4;
var COL_CRIT_W = 19;
var COL_TEXT_X = COL_CRIT_X + COL_CRIT_W;
var COL_TEXT_W = MARGIN_L + CONTENT_W - COL_TEXT_X;

function fontsReady(){
  return !!(window.PDF_FONTS && window.PDF_FONTS.regular && window.PDF_FONTS.bold);
}

function newDoc(){
  var doc = new window.jspdf.jsPDF({ unit:"mm", format:"a4", compress:true });
  if(fontsReady()){
    doc.addFileToVFS("Roboto-Regular.ttf", window.PDF_FONTS.regular);
    doc.addFont("Roboto-Regular.ttf", FONT, "normal");
    doc.addFileToVFS("Roboto-Bold.ttf", window.PDF_FONTS.bold);
    doc.addFont("Roboto-Bold.ttf", FONT, "bold");
    doc.setFont(FONT, "normal");
  }
  return doc;
}
function setFont(doc, weight, size, color){
  doc.setFont(fontsReady() ? FONT : "helvetica", weight === "bold" ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor.apply(doc, color || INK);
}
function pad2(n){ return String(n).padStart(2,"0"); }
function formatDateTime(d){
  return pad2(d.getDate())+"."+pad2(d.getMonth()+1)+"."+d.getFullYear()+" "+pad2(d.getHours())+":"+pad2(d.getMinutes());
}

/* ---------- low level drawing ---------- */
function drawCheckbox(doc, x, yTop, checked){
  var size = COL_CHECK_SIZE;
  doc.setLineWidth(0.35);
  doc.setDrawColor.apply(doc, INK);
  if(checked){
    doc.setFillColor.apply(doc, INK);
    doc.rect(x, yTop, size, size, "FD");
    doc.setDrawColor(255,255,255);
    doc.setLineWidth(0.55);
    doc.line(x+size*0.20, yTop+size*0.52, x+size*0.42, yTop+size*0.76);
    doc.line(x+size*0.42, yTop+size*0.76, x+size*0.82, yTop+size*0.22);
  } else {
    doc.setFillColor(255,255,255);
    doc.rect(x, yTop, size, size, "S");
  }
}
function drawCriticalPill(doc, x, yTop){
  setFont(doc, "bold", 6.3, INK);
  var label = "KRİTİK";
  var tw = doc.getTextWidth(label);
  var boxW = Math.min(COL_CRIT_W - 1.5, tw + 3);
  var boxH = 4.1;
  doc.setLineWidth(0.3);
  doc.setDrawColor.apply(doc, INK);
  doc.setFillColor(255,255,255);
  doc.rect(x, yTop, boxW, boxH, "S");
  doc.text(label, x + boxW/2, yTop + boxH/2 + 1.15, { align:"center" });
}

/* ---------- cursor-driven page flow ---------- */
function Flow(doc){
  this.doc = doc;
  this.y = CONTENT_TOP;
}
Flow.prototype.addPage = function(){
  this.doc.addPage();
  this.y = CONTENT_TOP;
};
Flow.prototype.ensureRoom = function(h){
  if(this.y + h > CONTENT_BOTTOM){ this.addPage(); return true; }
  return false;
};

Flow.prototype.drawPhaseHeader = function(label){
  // Reserve room for the phase header AND the section header + first item
  // that must follow it — never leave a phase title dangling alone at a
  // page bottom with its content pushed to the next page.
  this.ensureRoom(PHASE_HEADER_H + SECTION_HEADER_H + MIN_ITEM_RESERVE);
  var doc = this.doc, y = this.y;
  doc.setFillColor.apply(doc, BAR);
  doc.rect(MARGIN_L, y, 2.2, 6.4, "F");
  setFont(doc, "bold", 12.5, INK);
  doc.text(label, MARGIN_L + 4.5, y + 4.9);
  doc.setDrawColor.apply(doc, RULE);
  doc.setLineWidth(0.45);
  doc.line(MARGIN_L, y + 8.4, MARGIN_L + CONTENT_W, y + 8.4);
  this.y = y + PHASE_HEADER_H;
};

Flow.prototype.drawSectionHeader = function(title, countText, isContinuation){
  // A section header is only ever (re-)drawn where at least one item row
  // can follow it on the same page — otherwise it's pushed to the next
  // page outright. Repeated headers carry no "(devam)" label: item numbers
  // already show the reader this is a continuation (#18, #19, ...).
  this.ensureRoom(SECTION_HEADER_H + (isContinuation ? 0 : MIN_ITEM_RESERVE));
  var doc = this.doc, y = this.y;
  doc.setFillColor.apply(doc, FILL_LIGHT);
  doc.rect(MARGIN_L, y, CONTENT_W, 7, "F");
  setFont(doc, "bold", 10.3, INK);
  doc.text(title, MARGIN_L + 2.5, y + 4.7);
  if(countText){
    setFont(doc, "normal", 9, MUTED);
    doc.text(countText, MARGIN_L + CONTENT_W - 2.5, y + 4.7, { align:"right" });
  }
  doc.setDrawColor.apply(doc, RULE);
  doc.setLineWidth(0.25);
  doc.line(MARGIN_L, y + 7, MARGIN_L + CONTENT_W, y + 7);
  this.y = y + SECTION_HEADER_H;
};

Flow.prototype.measureItem = function(item){
  var doc = this.doc;
  setFont(doc, "normal", 9.5, INK);
  var lines = doc.splitTextToSize(item.text || "", COL_TEXT_W);
  var h = Math.max(4.6, lines.length * 4.15);
  var noteLines = [];
  if(item.note){
    setFont(doc, "normal", 8, MUTED);
    noteLines = doc.splitTextToSize("Not: " + item.note, COL_TEXT_W - 2);
    h += noteLines.length * 3.55 + 1.3;
  }
  return { lines:lines, noteLines:noteLines, h: h + 3 };
};

Flow.prototype.drawItem = function(item, m){
  var doc = this.doc, y = this.y;
  var topPad = 1.6;
  drawCheckbox(doc, COL_CHECK_X, y + topPad + 0.3, item.checked === true);
  setFont(doc, "normal", 8.3, MUTED);
  doc.text(item.number, COL_NUM_X, y + topPad + 3.1);
  if(item.critical) drawCriticalPill(doc, COL_CRIT_X, y + topPad + 0.1);
  setFont(doc, item.checked === true ? "normal" : "normal", 9.5, INK);
  var ty = y + topPad + 3.1;
  m.lines.forEach(function(line){
    doc.text(line, COL_TEXT_X, ty);
    ty += 4.15;
  });
  if(m.noteLines.length){
    ty += 0.6;
    setFont(doc, "normal", 8, MUTED);
    var noteTop = ty - 3;
    doc.setDrawColor.apply(doc, HAIRLINE);
    doc.setLineWidth(0.3);
    doc.line(COL_TEXT_X - 2, noteTop, COL_TEXT_X - 2, noteTop + m.noteLines.length*3.55);
    m.noteLines.forEach(function(line){
      doc.text(line, COL_TEXT_X, ty);
      ty += 3.55;
    });
  }
  var bottomY = y + m.h - 1.1;
  doc.setDrawColor.apply(doc, HAIRLINE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_L, bottomY, MARGIN_L + CONTENT_W, bottomY);
  this.y = y + m.h;
};

Flow.prototype.drawItemsList = function(sectionTitle, items){
  var self = this;
  items.forEach(function(item){
    var m = self.measureItem(item);
    var broke = self.ensureRoom(m.h);
    if(broke) self.drawSectionHeader(sectionTitle, null, true);
    self.drawItem(item, m);
  });
};

/* ---------- meta / arm block (first page only) ---------- */
Flow.prototype.drawMetaBlock = function(lines, stamp){
  var doc = this.doc, y = this.y;
  var colW = (CONTENT_W - 6) / 2;
  var rowH = 10;
  var rows = Math.ceil(lines.length / 2);
  var boxH = rows * rowH + 3;
  doc.setDrawColor.apply(doc, HAIRLINE);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_L, y, CONTENT_W, boxH, "S");
  lines.forEach(function(item, i){
    var col = i % 2, row = Math.floor(i/2);
    var x = MARGIN_L + 3 + col * (colW + 6);
    var ly = y + 5.4 + row * rowH;
    setFont(doc, "normal", 7.6, MUTED);
    doc.text(item.label.toUpperCase(), x, ly);
    setFont(doc, "bold", 10, INK);
    doc.text(String(item.value || "—"), x, ly + 4.8);
  });
  this.y = y + boxH + 4;

  if(stamp){
    var sh = 8.5;
    doc.setLineWidth(0.5);
    doc.setDrawColor.apply(doc, INK);
    doc.rect(MARGIN_L, this.y, CONTENT_W, sh, "S");
    setFont(doc, "bold", 10.5, INK);
    doc.text(stamp, MARGIN_L + CONTENT_W/2, this.y + sh/2 + 1.6, { align:"center" });
    this.y += sh + 5;
  } else {
    this.y += 2;
  }
};

Flow.prototype.drawNoticeLine = function(text){
  setFont(this.doc, "normal", 8.3, MUTED);
  this.doc.text(text, MARGIN_L, this.y);
  this.y += 6.5;
};

/* ---------- notes / signature pages ---------- */
var NOTES_LINE_H = 4.2;
var NOTES_SIG_ZONE_H = 26;

function splitNoteLines(doc, note){
  var normalized = String(note || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  if(!normalized.trim()) return [];

  // jsPDF wraps with the currently selected font, so measure with the exact
  // face and size used when the note body is drawn.
  setFont(doc, "normal", 9.2, INK);
  var lines = [];
  normalized.split("\n").forEach(function(paragraph){
    if(paragraph === ""){
      lines.push("");
      return;
    }
    var wrapped = doc.splitTextToSize(paragraph, CONTENT_W);
    if(!Array.isArray(wrapped)) wrapped = [String(wrapped || "")];
    wrapped.forEach(function(line){ lines.push(line); });
  });
  return lines;
}

function notesPageChunks(lines, fullCapacity, finalCapacity){
  if(!lines.length) return [[]];
  if(lines.length <= finalCapacity) return [lines];

  var pageCount = 1 + Math.ceil((lines.length - finalCapacity) / fullCapacity);
  var finalSize = Math.min(finalCapacity, Math.ceil(lines.length / pageCount));
  var leadingCount = pageCount - 1;
  var leadingRemaining = lines.length - finalSize;
  var chunks = [], offset = 0;
  for(var i=0; i<leadingCount; i++){
    var size = Math.ceil(leadingRemaining / (leadingCount - i));
    chunks.push(lines.slice(offset, offset + size));
    offset += size;
    leadingRemaining -= size;
  }
  chunks.push(lines.slice(offset));
  return chunks;
}

function drawNotesHeading(doc){
  var y = CONTENT_TOP;
  setFont(doc, "bold", 13, INK);
  doc.text("Notlar", MARGIN_L, y + 3);
  doc.setDrawColor.apply(doc, RULE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, y + 6, MARGIN_L + CONTENT_W, y + 6);
  return y + 14;
}

function drawSignatureArea(doc){
  var sigY = CONTENT_BOTTOM - NOTES_SIG_ZONE_H + 6;
  var boxW = (CONTENT_W - 8) / 2;
  [["İMZA", MARGIN_L], ["TARİH", MARGIN_L + boxW + 8]].forEach(function(pair){
    setFont(doc, "normal", 7.6, MUTED);
    doc.text(pair[0], pair[1], sigY);
    doc.setDrawColor.apply(doc, INK);
    doc.setLineWidth(0.3);
    doc.line(pair[1], sigY + 12, pair[1] + boxW, sigY + 12);
  });
}

function drawNotesPages(doc, note){
  var lines = splitNoteLines(doc, note);
  var textY = CONTENT_TOP + 19;
  var fullLineBottom = CONTENT_BOTTOM - 2;
  var finalLineBottom = CONTENT_BOTTOM - NOTES_SIG_ZONE_H - 4;
  var fullCapacity = Math.max(1, Math.floor((fullLineBottom - textY) / NOTES_LINE_H) + 1);
  var finalCapacity = Math.max(1, Math.floor((finalLineBottom - textY) / NOTES_LINE_H) + 1);
  var chunks = notesPageChunks(lines, fullCapacity, finalCapacity);

  chunks.forEach(function(chunk, pageIndex){
    var isFinal = pageIndex === chunks.length - 1;
    doc.addPage();
    var y = drawNotesHeading(doc);
    if(lines.length){
      setFont(doc, "bold", 7.6, MUTED);
      doc.text("UÇUŞ NOTU", MARGIN_L, y);
      y += 5;
      setFont(doc, "normal", 9.2, INK);
      chunk.forEach(function(line){
        if(line) doc.text(line, MARGIN_L, y);
        y += NOTES_LINE_H;
      });
      y += 1.5;
    }

    var ruledBottom = isFinal ? CONTENT_BOTTOM - NOTES_SIG_ZONE_H : CONTENT_BOTTOM;
    doc.setDrawColor.apply(doc, HAIRLINE);
    doc.setLineWidth(0.25);
    while(y < ruledBottom){
      doc.line(MARGIN_L, y, MARGIN_L + CONTENT_W, y);
      y += 8.4;
    }
    if(isFinal) drawSignatureArea(doc);
  });
}

function drawBlankNotesPage(doc){
  doc.addPage();
  var y = drawNotesHeading(doc);
  doc.setDrawColor.apply(doc, HAIRLINE);
  doc.setLineWidth(0.25);
  while(y < CONTENT_BOTTOM - NOTES_SIG_ZONE_H){
    doc.line(MARGIN_L, y, MARGIN_L + CONTENT_W, y);
    y += 8.4;
  }
  drawSignatureArea(doc);
}

/* ---------- running header / footer, stamped after content is final ---------- */
function stampChrome(doc, docTitle, generatedAt){
  var total = doc.internal.getNumberOfPages();
  for(var i=1; i<=total; i++){
    doc.setPage(i);
    setFont(doc, "bold", 9, INK);
    doc.text(docTitle, MARGIN_L, 12.5);
    setFont(doc, "normal", 7.8, MUTED);
    doc.text("Oluşturuldu: " + generatedAt, MARGIN_L + CONTENT_W, 12.5, { align:"right" });
    doc.setDrawColor.apply(doc, RULE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, 15, MARGIN_L + CONTENT_W, 15);

    doc.setDrawColor.apply(doc, HAIRLINE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_L, 281, MARGIN_L + CONTENT_W, 281);
    setFont(doc, "normal", 7.8, MUTED);
    doc.text("Uçuş Öncesi Checklist", MARGIN_L, 286.5);
    doc.text("Sayfa " + i + " / " + total, MARGIN_L + CONTENT_W, 286.5, { align:"right" });
  }
}

/* ============================================================
   Public entry point.
   spec = {
     documentTitle, filename, generatedAt(Date),
     metaLines: [{label,value}], armStamp: string|null, notice: string|null,
     flightNote: string|null,
     phases: [{ label, sections:[{ title, countText, items:[
       { number, text, critical, checked(bool|null), note(string|null) }
     ]}]}]
   }
   ============================================================ */
function generate(spec, openInNewTab){
  var doc = newDoc();
  var flow = new Flow(doc);

  if(spec.metaLines && spec.metaLines.length){
    flow.drawMetaBlock(spec.metaLines, spec.armStamp || null);
  }
  if(spec.notice) flow.drawNoticeLine(spec.notice);

  (spec.phases || []).forEach(function(phase){
    flow.drawPhaseHeader(phase.label);
    phase.sections.forEach(function(section){
      flow.drawSectionHeader(section.title, section.countText, false);
      flow.drawItemsList(section.title, section.items);
    });
  });

  if(String(spec.flightNote || "").trim()){
    drawNotesPages(doc, spec.flightNote);
  } else if(doc.internal.getNumberOfPages() % 2 !== 0){
    drawBlankNotesPage(doc);
  }

  stampChrome(doc, spec.documentTitle, formatDateTime(spec.generatedAt || new Date()));
  if(openInNewTab){
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(spec.filename);
  }
}

window.PdfExport = { generate: generate };

})();
