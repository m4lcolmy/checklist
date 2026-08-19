(function(){
"use strict";

var ALLOWED_TAGS = {
  BR:"BR",
  P:"P",
  DIV:"P",
  STRONG:"STRONG",
  B:"STRONG",
  EM:"EM",
  I:"EM",
  OL:"OL",
  UL:"UL",
  LI:"LI"
};
var DROP_CONTENT_TAGS = {
  SCRIPT:true,
  STYLE:true,
  NOSCRIPT:true,
  IFRAME:true,
  OBJECT:true,
  EMBED:true,
  SVG:true,
  MATH:true
};

function cleanNode(node, targetDocument){
  if(node.nodeType === 3) return targetDocument.createTextNode(node.nodeValue || "");
  if(node.nodeType !== 1) return targetDocument.createDocumentFragment();

  var sourceTag = node.tagName.toUpperCase();
  if(DROP_CONTENT_TAGS[sourceTag]) return targetDocument.createDocumentFragment();

  var cleanTag = ALLOWED_TAGS[sourceTag];
  var output = cleanTag ? targetDocument.createElement(cleanTag) : targetDocument.createDocumentFragment();
  Array.prototype.forEach.call(node.childNodes, function(child){
    output.appendChild(cleanNode(child, targetDocument));
  });
  return output;
}

function sanitizeHtml(html, targetDocument){
  var doc = targetDocument || document;
  var source = doc.createElement("template");
  source.innerHTML = typeof html === "string" ? html : "";
  var clean = doc.createElement("div");
  Array.prototype.forEach.call(source.content.childNodes, function(node){
    clean.appendChild(cleanNode(node, doc));
  });
  return clean.innerHTML;
}

function appendPlainLine(parent, line, doc){
  var paragraph = doc.createElement("p");
  if(line) paragraph.textContent = line;
  else paragraph.appendChild(doc.createElement("br"));
  parent.appendChild(paragraph);
}

function htmlFromPlainText(text, targetDocument){
  var doc = targetDocument || document;
  var container = doc.createElement("div");
  String(text || "").replace(/\r\n?/g, "\n").split("\n").forEach(function(line){
    appendPlainLine(container, line, doc);
  });
  return container.innerHTML;
}

function nodeText(node){
  if(node.nodeType === 3) return node.nodeValue || "";
  if(node.nodeType !== 1) return "";
  if(node.tagName === "BR") return "\n";
  var value = "";
  Array.prototype.forEach.call(node.childNodes, function(child){ value += nodeText(child); });
  return value;
}

function blockText(node, listIndex){
  var value = "";
  Array.prototype.forEach.call(node.childNodes, function(child){ value += nodeText(child); });
  value = value.replace(/\n+$/g, "");
  if(listIndex != null) value = String(listIndex) + ". " + value;
  return value;
}

function plainTextFromElement(root){
  var lines = [];
  Array.prototype.forEach.call(root.childNodes, function(node){
    if(node.nodeType === 3){
      var text = node.nodeValue || "";
      if(text) lines.push(text);
      return;
    }
    if(node.nodeType !== 1) return;
    if(node.tagName === "OL"){
      var listIndex = 1;
      Array.prototype.forEach.call(node.children, function(child){
        if(child.tagName === "LI") lines.push(blockText(child, listIndex++));
      });
      return;
    }
    if(node.tagName === "UL"){
      Array.prototype.forEach.call(node.children, function(child){
        if(child.tagName === "LI") lines.push("• " + blockText(child));
      });
      return;
    }
    lines.push(blockText(node));
  });
  return lines.join("\n").replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function containsNode(root, node){
  return !!node && (node === root || root.contains(node.nodeType === 3 ? node.parentNode : node));
}

function closestElement(node, root, tagName){
  var current = node && (node.nodeType === 1 ? node : node.parentElement);
  while(current && current !== root){
    if(current.tagName === tagName) return current;
    current = current.parentElement;
  }
  return null;
}

function closestBlock(node, root){
  var current = node && (node.nodeType === 1 ? node : node.parentElement);
  while(current && current !== root){
    if(current.tagName === "P" || current.tagName === "DIV") return current;
    current = current.parentElement;
  }
  // Browsers can leave a bare text node directly under the contenteditable
  // after Select All + Delete. Treat the editor itself as that line's block
  // so typing `1. metin` still starts an ordered list on Enter.
  return current === root ? root : null;
}

function placeCaretAtStart(element){
  var selection = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function ensureEmptyLine(element){
  if(!element.firstChild) element.appendChild(element.ownerDocument.createElement("br"));
}

function currentRange(editor){
  var selection = window.getSelection();
  if(!selection || selection.rangeCount !== 1) return null;
  var range = selection.getRangeAt(0);
  if(!range.collapsed || !containsNode(editor, range.startContainer)) return null;
  return range;
}

function splitListItem(editor, listItem, range){
  var list = listItem.parentNode;
  var tailRange = range.cloneRange();
  tailRange.setEnd(listItem, listItem.childNodes.length);
  var tail = tailRange.extractContents();
  var nextItem = editor.ownerDocument.createElement("li");
  nextItem.appendChild(tail);
  ensureEmptyLine(listItem);
  ensureEmptyLine(nextItem);
  list.insertBefore(nextItem, listItem.nextSibling);
  placeCaretAtStart(nextItem);
}

function leaveEmptyListItem(editor, listItem){
  var list = listItem.parentNode;
  var paragraph = editor.ownerDocument.createElement("p");
  paragraph.appendChild(editor.ownerDocument.createElement("br"));
  list.removeChild(listItem);
  list.parentNode.insertBefore(paragraph, list.nextSibling);
  if(!list.querySelector("li")) list.parentNode.removeChild(list);
  placeCaretAtStart(paragraph);
}

function startNumberedList(editor, block, firstItemText){
  var list = editor.ownerDocument.createElement("ol");
  var firstItem = editor.ownerDocument.createElement("li");
  var nextItem = editor.ownerDocument.createElement("li");
  firstItem.textContent = firstItemText;
  nextItem.appendChild(editor.ownerDocument.createElement("br"));
  list.appendChild(firstItem);
  list.appendChild(nextItem);
  if(block === editor){
    while(editor.firstChild) editor.removeChild(editor.firstChild);
    editor.appendChild(list);
  } else {
    block.parentNode.replaceChild(list, block);
  }
  placeCaretAtStart(nextItem);
}

function insertPlainText(text){
  if(document.queryCommandSupported && document.queryCommandSupported("insertText")){
    document.execCommand("insertText", false, text);
    return;
  }
  var selection = window.getSelection();
  if(!selection || !selection.rangeCount) return;
  var range = selection.getRangeAt(0);
  range.deleteContents();
  var node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function create(options){
  options = options || {};
  var root = options.root;
  if(!root) return null;
  var editor = root.querySelector("[data-rich-note-input]");
  var toolbar = root.querySelector("[data-rich-note-toolbar]");
  if(!editor || !toolbar) return null;
  var lastHtml = "";
  var lastText = "";
  var savedRange = null;

  function emitChange(){
    var html = sanitizeHtml(editor.innerHTML, editor.ownerDocument);
    var cleanContainer = editor.ownerDocument.createElement("div");
    cleanContainer.innerHTML = html;
    var text = plainTextFromElement(cleanContainer);
    lastHtml = html;
    lastText = text;
    editor.dataset.empty = text ? "false" : "true";
    editor.dispatchEvent(new CustomEvent("richchange", {
      bubbles:true,
      detail:{ html:html, text:text }
    }));
  }

  function setValue(html, plainText){
    var cleanHtml = sanitizeHtml(html, editor.ownerDocument);
    if(!cleanHtml) cleanHtml = htmlFromPlainText(plainText, editor.ownerDocument);
    if(!cleanHtml) cleanHtml = "<p><br></p>";
    if(cleanHtml === lastHtml && String(plainText || "") === lastText) return;
    editor.innerHTML = cleanHtml;
    savedRange = null;
    lastHtml = cleanHtml;
    var cleanContainer = editor.ownerDocument.createElement("div");
    cleanContainer.innerHTML = cleanHtml;
    lastText = plainTextFromElement(cleanContainer);
    editor.dataset.empty = lastText ? "false" : "true";
  }

  function runCommand(command){
    editor.focus();
    if(savedRange){
      try{
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }catch(e){ savedRange = null; }
    }
    document.execCommand(command, false, null);
    emitChange();
    updateToolbarState();
  }

  function updateToolbarState(){
    var selection = window.getSelection();
    var inside = selection && selection.rangeCount && containsNode(editor, selection.anchorNode);
    if(inside){
      try{ savedRange = selection.getRangeAt(0).cloneRange(); }catch(e){ savedRange = null; }
    }
    Array.prototype.forEach.call(toolbar.querySelectorAll("[data-rich-command]"), function(button){
      var command = button.dataset.richCommand;
      var pressed = false;
      if(inside && command !== "removeFormat"){
        try{ pressed = document.queryCommandState(command); }catch(e){ pressed = false; }
      }
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  }

  toolbar.addEventListener("mousedown", function(event){
    if(event.target.closest("[data-rich-command]")) event.preventDefault();
  });
  toolbar.addEventListener("click", function(event){
    var button = event.target.closest("[data-rich-command]");
    if(!button) return;
    runCommand(button.dataset.richCommand);
  });

  editor.addEventListener("keydown", function(event){
    if((event.ctrlKey || event.metaKey) && !event.altKey){
      var shortcut = event.key.toLowerCase();
      if(shortcut === "b" || shortcut === "i"){
        event.preventDefault();
        runCommand(shortcut === "b" ? "bold" : "italic");
        return;
      }
    }
    if(event.key !== "Enter" || event.shiftKey) return;
    var range = currentRange(editor);
    if(!range) return;
    var listItem = closestElement(range.startContainer, editor, "LI");
    if(listItem){
      event.preventDefault();
      if(blockText(listItem).trim()) splitListItem(editor, listItem, range);
      else leaveEmptyListItem(editor, listItem);
      emitChange();
      return;
    }

    var block = closestBlock(range.startContainer, editor);
    if(!block) return;
    var before = range.cloneRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    var after = range.cloneRange();
    after.selectNodeContents(block);
    after.setStart(range.startContainer, range.startOffset);
    var match = before.toString().match(/^\s*1\.\s+(.+?)\s*$/);
    if(match && !after.toString().trim()){
      event.preventDefault();
      startNumberedList(editor, block, match[1]);
      emitChange();
    }
  });

  editor.addEventListener("input", emitChange);
  editor.addEventListener("blur", function(){
    var cleanHtml = sanitizeHtml(editor.innerHTML, editor.ownerDocument) || "<p><br></p>";
    if(editor.innerHTML !== cleanHtml) editor.innerHTML = cleanHtml;
    emitChange();
  });
  editor.addEventListener("paste", function(event){
    event.preventDefault();
    insertPlainText((event.clipboardData && event.clipboardData.getData("text/plain")) || "");
    emitChange();
  });
  editor.addEventListener("drop", function(event){ event.preventDefault(); });
  document.addEventListener("selectionchange", updateToolbarState);

  return {
    setValue:setValue,
    getHtml:function(){ return lastHtml; },
    getText:function(){ return lastText; },
    sanitizeHtml:function(html){ return sanitizeHtml(html, editor.ownerDocument); }
  };
}

window.FlightNoteEditor = {
  create:create,
  sanitizeHtml:function(html){ return sanitizeHtml(html, document); },
  htmlFromPlainText:function(text){ return htmlFromPlainText(text, document); }
};
})();
