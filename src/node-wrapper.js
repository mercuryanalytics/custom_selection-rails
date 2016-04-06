"use strict";

import { textWalker } from './dom-helpers';

export default function NodeWrapper(nodeName, className) {
  this.nodeName = nodeName.toUpperCase()
  this.className = className;
}

NodeWrapper.prototype.isWrapper = function(node) { return node.nodeName === this.nodeName && (this.className === undefined || node.className === this.className); }
NodeWrapper.prototype.isWrapped = function(node) { return this.isWrapper(node.parentNode); }

NodeWrapper.prototype.wrap = function(node) {
  if (this.isWrapped(node)) return;
  var wrapper = node.ownerDocument.createElement(this.nodeName);
  if (this.className !== undefined) wrapper.className = this.className;
  node.parentNode.replaceChild(wrapper, node);
  wrapper.appendChild(node);
}

function wrapRange(start, end, options) {
  if (options == null) options = { includeStart: false, includeEnd: false };

  if (options.includeStart) this.wrap(start);
  var walker = textWalker(start.ownerDocument.body);
  walker.currentNode = start;
  if (walker.currentNode !== end) {
    while (walker.nextNode()) {
      if (walker.currentNode === end) break;
      this.wrap(walker.currentNode);
    }
  }
  if (options.includeEnd && walker.currentNode) this.wrap(walker.currentNode);
}
NodeWrapper.prototype.wrapRange = wrapRange;

NodeWrapper.prototype.unwrap = function(node) {
  if (!this.isWrapped(node)) return;
  var wrapper = node.parentNode;
  if (node.nextSibling) {
    wrapper.parentNode.insertBefore(node, wrapper);
  } else if (node.previousSibling) {
    wrapper.parentNode.insertBefore(node, wrapper.nextSibling);
  } else {
    node.parentNode.parentNode.replaceChild(node, node.parentNode);
  }
}

function unwrapRange(start, end, options) {
  if (options == null) options = { includeStart: false, includeEnd: false };

  if (options.includeStart) this.unwrap(start);
  var walker = textWalker(start.ownerDocument.body);
  walker.currentNode = start;
  if (walker.currentNode !== end) {
    while (walker.nextNode()) {
      if (walker.currentNode === end) break;
      this.unwrap(walker.currentNode);
    }
  }
  if (options.includeEnd && walker.currentNode) this.unwrap(walker.currentNode);
}
NodeWrapper.prototype.unwrapRange = unwrapRange;
