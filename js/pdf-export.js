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

/* ============================================================
   Flight note pages
   The typed note is rendered as real typography — the editor's
   bold / italic / numbered / bulleted structure survives into the
   PDF — laid out on a fixed baseline grid inside the text column.
   Whatever is left of the page is ruled for handwriting, and the
   final note page carries the signature block.
   ============================================================ */
var NOTE_SIZE = 10;            // pt, body text of the typed note
var NOTE_LINE_H = 5.3;         // mm, baseline-to-baseline inside a block
var NOTE_BASELINE = 3.7;       // mm, top of line box -> baseline
var NOTE_PARA_GAP = 2.6;       // mm, extra space between blocks
var NOTE_LIST_INDENT = 8;      // mm, body indent of list items (hanging marker)
var NOTE_MARKER_GAP = 2.4;     // mm, gap between marker and list body
var NOTE_RULE_STEP = 8.4;      // mm, handwriting rule pitch
var NOTE_SIG_ZONE_H = 26;      // mm reserved for the signature block
var NOTE_TEXT_TOP = CONTENT_TOP + 15;
var NOTE_ITALIC_SHEAR = 0.22;  // fake-oblique slant (Roboto ships regular+bold only)

/* ---- block model: { marker, indent, runs:[{text,bold,italic}] } ---- */
function noteRunsFromNode(node, bold, italic){
  var runs = [];
  Array.prototype.forEach.call(node.childNodes, function(child){
    if(child.nodeType === 3){
      var text = String(child.nodeValue || "").replace(/\u00a0/g, " ");
      if(text) runs.push({ text:text, bold:bold, italic:italic });
      return;
    }
    if(child.nodeType !== 1) return;
    var tag = child.tagName.toUpperCase();
    if(tag === "BR"){ runs.push({ text:"\n", bold:bold, italic:italic }); return; }
    noteRunsFromNode(child, bold || tag === "STRONG" || tag === "B", italic || tag === "EM" || tag === "I")
      .forEach(function(run){ runs.push(run); });
  });
  return runs;
}

function noteBlocksFromContainer(container){
  var blocks = [];
  Array.prototype.forEach.call(container.childNodes, function(node){
    if(node.nodeType === 3){
      var text = String(node.nodeValue || "").replace(/\u00a0/g, " ");
      if(text.trim()) blocks.push({ marker:null, indent:0, runs:[{ text:text, bold:false, italic:false }] });
      return;
    }
    if(node.nodeType !== 1) return;
    var tag = node.tagName.toUpperCase();
    if(tag === "OL" || tag === "UL"){
      var counter = 1;
      Array.prototype.forEach.call(node.children, function(li){
        if(li.tagName.toUpperCase() !== "LI") return;
        blocks.push({
          marker: tag === "OL" ? (counter++) + "." : "•",
          indent: NOTE_LIST_INDENT,
          runs: noteRunsFromNode(li, false, false)
        });
      });
      return;
    }
    if(tag === "BR"){ blocks.push({ marker:null, indent:0, runs:[] }); return; }
    blocks.push({ marker:null, indent:0, runs: noteRunsFromNode(node, false, false) });
  });
  return blocks;
}

function noteBlocksFromHtml(html){
  if(!html || typeof document === "undefined") return null;
  try{
    var host = document.createElement("template");
    host.innerHTML = String(html);
    var blocks = noteBlocksFromContainer(host.content);
    return blocks.length ? blocks : null;
  }catch(e){ return null; }
}

function noteBlocksFromText(text){
  var normalized = String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  var blocks = [];
  normalized.split("\n").forEach(function(line){
    var listMatch = line.match(/^\s*(\d+[.)]|[•·*-])\s+(.*)$/);
    if(listMatch){
      blocks.push({
        marker: /^\d/.test(listMatch[1]) ? listMatch[1] : "•",
        indent: NOTE_LIST_INDENT,
        runs: listMatch[2] ? [{ text:listMatch[2], bold:false, italic:false }] : []
      });
      return;
    }
    blocks.push({ marker:null, indent:0, runs: line.trim() ? [{ text:line, bold:false, italic:false }] : [] });
  });
  return blocks;
}

function noteBlockIsEmpty(block){
  if(block.marker) return false;
  for(var i=0;i<block.runs.length;i++){
    if(String(block.runs[i].text).replace(/\s/g, "") !== "") return false;
  }
  return true;
}
function trimNoteBlocks(blocks){
  var start = 0, end = blocks.length;
  while(start < end && noteBlockIsEmpty(blocks[start])) start++;
  while(end > start && noteBlockIsEmpty(blocks[end-1])) end--;
  return blocks.slice(start, end);
}

/* ---- measuring, wrapping ---- */
function noteTextWidth(doc, text, bold){
  setFont(doc, bold ? "bold" : "normal", NOTE_SIZE, INK);
  return doc.getTextWidth(text);
}

function noteTokens(runs){
  var tokens = [];
  runs.forEach(function(run){
    String(run.text).split(/(\n)/).forEach(function(part){
      if(part === "") return;
      if(part === "\n"){ tokens.push({ br:true }); return; }
      part.split(/(\s+)/).forEach(function(piece){
        if(piece === "") return;
        var isSpace = /^\s+$/.test(piece);
        tokens.push({ text: isSpace ? " " : piece, space:isSpace, bold:!!run.bold, italic:!!run.italic });
      });
    });
  });
  return tokens;
}

// jsPDF's splitTextToSize can't carry per-word styling, so the note column is
// wrapped here: every token is measured with its own face, then broken on width.
function wrapNoteTokens(doc, tokens, width){
  var lines = [], line = [], lineW = 0;
  function flush(){
    while(line.length && line[line.length-1].space) line.pop();
    lines.push(line);
    line = []; lineW = 0;
  }
  function push(text, tok, w){
    line.push({ text:text, bold:tok.bold, italic:tok.italic, space:!!tok.space });
    lineW += w;
  }
  tokens.forEach(function(tok){
    if(tok.br){ flush(); return; }
    var w = noteTextWidth(doc, tok.text, tok.bold);
    if(tok.space){
      if(lineW > 0) push(tok.text, tok, w);
      return;
    }
    if(lineW > 0 && lineW + w > width) flush();
    if(w <= width){ push(tok.text, tok, w); return; }
    // token wider than the whole column (a URL, a long identifier): split it
    var chunk = "";
    tok.text.split("").forEach(function(ch){
      var candidate = chunk + ch;
      if(chunk && lineW + noteTextWidth(doc, candidate, tok.bold) > width){
        push(chunk, tok, noteTextWidth(doc, chunk, tok.bold));
        flush();
        chunk = ch;
      } else {
        chunk = candidate;
      }
    });
    if(chunk) push(chunk, tok, noteTextWidth(doc, chunk, tok.bold));
  });
  flush();
  return lines;
}

function layoutNoteLines(doc, blocks){
  var out = [];
  blocks.forEach(function(block, blockIndex){
    var wrapped = wrapNoteTokens(doc, noteTokens(block.runs), CONTENT_W - block.indent);
    if(!wrapped.length) wrapped = [[]];
    wrapped.forEach(function(segments, lineIndex){
      out.push({
        segments: segments,
        indent: block.indent,
        marker: lineIndex === 0 ? block.marker : null,
        gapBefore: (blockIndex > 0 && lineIndex === 0) ? NOTE_PARA_GAP : 0
      });
    });
  });
  return out;
}

/* ---- drawing ---- */
// Roboto ships regular + bold only, so italics are synthesized: the run is
// drawn inside a q/Q pair carrying a shear anchored on its own baseline, which
// leaves position, size and the Turkish glyph coverage of the font untouched.
var italicShearOk = null;
function canShearItalic(doc){
  if(italicShearOk === null){
    italicShearOk = !!(doc.internal &&
      typeof doc.internal.write === "function" &&
      typeof doc.internal.scaleFactor === "number" &&
      doc.internal.pageSize && typeof doc.internal.pageSize.getHeight === "function");
  }
  return italicShearOk;
}
function drawNoteText(doc, text, x, baseline, bold, italic){
  setFont(doc, bold ? "bold" : "normal", NOTE_SIZE, INK);
  if(!italic || !canShearItalic(doc)){
    doc.text(text, x, baseline);
    return;
  }
  var baselineInUserSpace = (doc.internal.pageSize.getHeight() - baseline) * doc.internal.scaleFactor;
  doc.internal.write("q 1 0 " + NOTE_ITALIC_SHEAR + " 1 " +
    (-NOTE_ITALIC_SHEAR * baselineInUserSpace).toFixed(3) + " 0 cm");
  doc.text(text, x, baseline);
  doc.internal.write("Q");
}

function drawNoteLine(doc, line, yTop){
  var baseline = yTop + NOTE_BASELINE;
  var x = MARGIN_L + line.indent;
  if(line.marker){
    setFont(doc, "normal", NOTE_SIZE, MUTED);
    doc.text(line.marker, x - NOTE_MARKER_GAP, baseline, { align:"right" });
  }
  line.segments.forEach(function(seg){
    drawNoteText(doc, seg.text, x, baseline, seg.bold, seg.italic);
    x += noteTextWidth(doc, seg.text, seg.bold);
  });
}

function drawNotesHeading(doc, title){
  var y = CONTENT_TOP;
  setFont(doc, "bold", 12.5, INK);
  doc.text(title, MARGIN_L, y + 3.4);
  doc.setDrawColor.apply(doc, RULE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_L, y + 6.4, MARGIN_L + CONTENT_W, y + 6.4);
  return NOTE_TEXT_TOP;
}

function drawWritingRules(doc, yTop, yBottom, label){
  var y = yTop;
  if(label){
    setFont(doc, "bold", 7.4, MUTED);
    doc.text(label, MARGIN_L, y);
    y += 2.6;
  }
  doc.setDrawColor.apply(doc, HAIRLINE);
  doc.setLineWidth(0.25);
  y += NOTE_RULE_STEP;
  while(y <= yBottom){
    doc.line(MARGIN_L, y, MARGIN_L + CONTENT_W, y);
    y += NOTE_RULE_STEP;
  }
}

function drawSignatureArea(doc){
  var sigY = CONTENT_BOTTOM - NOTE_SIG_ZONE_H + 6;
  var boxW = (CONTENT_W - 8) / 2;
  [["İMZA", MARGIN_L], ["TARİH", MARGIN_L + boxW + 8]].forEach(function(pair){
    setFont(doc, "normal", 7.6, MUTED);
    doc.text(pair[0], pair[1], sigY);
    doc.setDrawColor.apply(doc, INK);
    doc.setLineWidth(0.3);
    doc.line(pair[1], sigY + 12, pair[1] + boxW, sigY + 12);
  });
}

function paginateNoteLines(lines){
  var pages = [], current = [], y = NOTE_TEXT_TOP;
  lines.forEach(function(line){
    var h = line.gapBefore + NOTE_LINE_H;
    if(current.length && y + h > CONTENT_BOTTOM){
      pages.push(current);
      current = [];
      y = NOTE_TEXT_TOP;
      line.gapBefore = 0;
      h = NOTE_LINE_H;
    }
    current.push(line);
    y += h;
  });
  pages.push(current);
  return pages;
}

function drawBlankNotesPage(doc){
  doc.addPage();
  var y = drawNotesHeading(doc, "Notlar");
  drawWritingRules(doc, y, CONTENT_BOTTOM - NOTE_SIG_ZONE_H, null);
  drawSignatureArea(doc);
}

function drawFlightNotePages(doc, note, noteHtml){
  var blocks = noteBlocksFromHtml(noteHtml);
  if(!blocks) blocks = noteBlocksFromText(note);
  blocks = trimNoteBlocks(blocks);
  var lines = blocks.length ? layoutNoteLines(doc, blocks) : [];
  if(!lines.length){ drawBlankNotesPage(doc); return; }

  var pages = paginateNoteLines(lines);
  var y = NOTE_TEXT_TOP;
  pages.forEach(function(pageLines){
    doc.addPage();
    y = drawNotesHeading(doc, "Uçuş Notu");
    pageLines.forEach(function(line){
      y += line.gapBefore;
      drawNoteLine(doc, line, y);
      y += NOTE_LINE_H;
    });
  });

  // Whatever is left under the note becomes ruled writing room. If the note
  // ran to the bottom, the ruled area and signature get a page of their own.
  var rulesTop = y + 7;
  var rulesBottom = CONTENT_BOTTOM - NOTE_SIG_ZONE_H;
  if(rulesTop + NOTE_RULE_STEP * 2 <= rulesBottom){
    drawWritingRules(doc, rulesTop, rulesBottom, "EK NOTLAR");
    drawSignatureArea(doc);
  } else {
    drawBlankNotesPage(doc);
  }
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
     flightNote: string|null, flightNoteHtml: string|null,
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
    drawFlightNotePages(doc, spec.flightNote, spec.flightNoteHtml);
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
