"use strict";

export function findFirstTextNode(root) {
  if (root.nodeType == Node.TEXT_NODE) return root;
  root = root.firstChild;
  while (root !== null) {
    var result = findFirstTextNode(root);
    if (result !== null) return result;
    root = root.nextSibling;
  }
  return null;
}

export function compareNodes(a, b) {
  var PRECEDING_OR_FOLLOWING = a.DOCUMENT_POSITION_FOLLOWING + a.DOCUMENT_POSITION_PRECEDING
  switch (a.compareDocumentPosition(b) & PRECEDING_OR_FOLLOWING) {
    case a.DOCUMENT_POSITION_FOLLOWING: return -1;
    case a.DOCUMENT_POSITION_PRECEDING: return 1;
    default: return 0;
  }
}

export function textWalker(root, filter) {
  if (filter) filter = function(node) {
    if (filter(node)) return NodeFilter.FILTER_ACCEPT;
    return NodeFilter.FILTER_SKIP;
  };
  if (!filter) filter = null;

  return root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter, false);
}

export function nodePath(node, root) {
  if (!root) root = node.ownerDocument;
  if (node === root) {
    if (root.nodeType === Node.DOCUMENT_NODE) return "";
    return ".";
  }

  var result = nodePath(node.parentNode, root)
  switch (node.nodeType) {
    case Node.DOCUMENT_NODE:
      return "";

    case Node.ELEMENT_NODE:
      result += "/" + node.nodeName.toLowerCase();
      var n = 0;
      for (var sib = node.previousSibling; sib !== null; sib = sib.previousSibling) {
        if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === node.nodeName) n++;
      }
      if (n === 0) {
        for (sib = node.nextSibling; sib !== null; sib = sib.nextSibling) {
          if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === node.nodeName) return result + "[1]";
        }
        return result;
      }
      return result + "[" + (n + 1) + "]";

    case Node.TEXT_NODE:
      var text = node.nodeValue;
      if (text.length > 15) text = text.substr(0, 7) + "…" + text.substr(text.length - 7);
      return result + '/text("' + text.replace(/"/g, '\"') + '")';

    default:
      return node.nodeName;
  }
}
