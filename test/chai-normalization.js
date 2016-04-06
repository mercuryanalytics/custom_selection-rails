"use strict";

function description(node, root) {
  if (!root) root = node.ownerDocument;
  if (node === root) return ".";

  var result = description(node.parentNode, root) + "/";
  switch (node.nodeType) {
    case Node.DOCUMENT_NODE:
      return "";

    case Node.ELEMENT_NODE:
      result += node.nodeName.toLowerCase();
      var n = 0;
      for (var sib = node.previousSibling; sib !== null; sib = sib.previousSibling) {
        if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === node.nodeName) n++;
      }
      if (n === 0) {
        for (sib = node.nextSibling; sib !== null; sib = sib.nextSibling) {
          if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === node.nodeName) return result + "[0]";
        }
        return result;
      }
      return result + "[" + n + "]";

    case Node.TEXT_NODE:
      return result + 'text("' + node.nodeValue.replace(/"/g, '\"') + '")';

    default:
      return node.nodeName;
  }
}

export default function(chai, utils) {
  function isNormal(node) {
    if (node.nodeType !== Node.TEXT_NODE) {
      node = node.firstChild;
      while (node) {
        var result = isNormal(node);
        if (result) return result;
        node = node.nextSibling;
      }
      return null;
    }

    if (node.nodeValue === "")
      return '"' + description(node) + '" is empty';
    if (node.previousSibling !== null && node.previousSibling.nodeType === Node.TEXT_NODE)
      return '"' + node.previousSibling.nodeValue + '" precedes "' + node.nodeValue + '"';
    if (node.nextSibling !== null && node.nextSibling.nodeType === Node.TEXT_NODE)
      return '"' + node.nodeValue + '" is followed by "' + node.nextSibling.nodeValue + '"';
    return null;
  }

  var Assertion = chai.Assertion;
  Assertion.addProperty('normalized', function() {
    new Assertion(this._obj).to.be.instanceof(HTMLElement);
    var explanation = isNormal(this._obj);
    this.assert(explanation == null,
                "expected #{this} to be normalized, but #{exp}",
                "expected #{this} to not be normalized",
                explanation);
  });
}
