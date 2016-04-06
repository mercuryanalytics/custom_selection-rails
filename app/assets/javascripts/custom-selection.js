var CustomSelection = (function () {
  'use strict';

  var knownLocations = [];

  function LocationReference(node, offset) {
    this.node = node;
    this.offset = isNaN(offset) ? 0 : Number(offset);
    knownLocations.push(this);
  }

  LocationReference.prototype.toString = function() {
    var content = this.node.nodeValue;
    if (content !== null) content = '"' + content.replace(/"/g, '\"') + '"';
    return "LocationReference(" + this.offset + "," + content + ")";
  };

  LocationReference.prototype.canSplit = function() {
    return this.offset > 0 && this.node.nodeValue.length > this.offset;
  };

  LocationReference.prototype.split = function() {
    var node = this.node;
    var offset = this.offset;

    if (offset == 0 || offset >= node.nodeValue.length) return null;

    var affectedLocations = knownLocations.filter(function(l) { return node === l.node && offset <= l.offset; });
    var newNode = node.splitText(offset);
    affectedLocations.forEach(function(l) { l.node = newNode; l.offset -= offset; });
    return node;
  };

  LocationReference.prototype.join = function() {
    var node = this.node;
    var offset = this.offset;

    if (node.previousSibling === null || node.previousSibling.nodeType !== Node.TEXT_NODE) return null;

    var affectedLocations = knownLocations.filter(function(l) { return node === l.node && offset <= l.offset; });
    var newNode = node.previousSibling;
    offset += newNode.nodeValue.length;
    newNode.nodeValue += node.nodeValue;
    affectedLocations.forEach(function(l) { l.node = newNode; l.offset += offset; });
    node.remove();
    return node;
  };

  LocationReference.prototype.joinRight = function() {
    var node = this.node;
    var offset = this.offset;

    if (node.nextSibling === null || node.nextSibling.nodeType !== Node.TEXT_NODE) return null;

    var newNode = node.nextSibling;
    var affectedLocations = knownLocations.filter(function(l) { return newNode === l.node; });
    var length = node.nodeValue.nodeValue;
    node.nodeValue += newNode.nodeValue;
    affectedLocations.forEach(function(l) { l.node = node; l.offset += length; });
    node.remove();
    return node;
  }

  LocationReference.prototype.prefix = function() { return this.node.nodeValue.substring(0, this.offset); };
  LocationReference.prototype.suffix = function() { return this.node.nodeValue.substring(this.offset); };

  LocationReference.prototype.destroy = function() {
    var index = knownLocations.indexOf(this);
    knownLocations.splice(index, 1);
  };

  function findFirstTextNode(root) {
    if (root.nodeType == Node.TEXT_NODE) return root;
    root = root.firstChild;
    while (root !== null) {
      var result = findFirstTextNode(root);
      if (result !== null) return result;
      root = root.nextSibling;
    }
    return null;
  }

  function compareNodes(a, b) {
    var PRECEDING_OR_FOLLOWING = a.DOCUMENT_POSITION_FOLLOWING + a.DOCUMENT_POSITION_PRECEDING
    switch (a.compareDocumentPosition(b) & PRECEDING_OR_FOLLOWING) {
      case a.DOCUMENT_POSITION_FOLLOWING: return -1;
      case a.DOCUMENT_POSITION_PRECEDING: return 1;
      default: return 0;
    }
  }

  function textWalker(root, filter) {
    if (filter) filter = function(node) {
      if (filter(node)) return NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_SKIP;
    };
    if (!filter) filter = null;

    return root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter, false);
  }

  function NodeWrapper(nodeName, className) {
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

  function CustomSelection(root) {
    if (root === undefined) root = document.body;
    var anchor = new LocationReference(findFirstTextNode(root), 0);
    var focus = new LocationReference(anchor.node, 0);
    var nodeWrapper = new NodeWrapper("mark", "custom-selection");
    var walker = textWalker(root);

    function normalize(ref) {
      if (ref.offset >= ref.node.nodeValue.length) {
        walker.currentNode = ref.node;
        var node = walker.nextNode();
        if (node) {
          ref.offset -= ref.node.nodeValue.length;
          ref.node = node;
        }
      }
    }

    function isCollapsed() {
      return !(anchor.node !== focus.node || anchor.offset !== focus.offset);
    }

    function collapse(node, offset) {
      anchor.node = node;
      anchor.offset = offset;
      normalize(anchor);
      focus.node = anchor.node;
      focus.offset = anchor.offset;
    }

    function createWrapper(start, end) {
      start.split();
      end.split();
      nodeWrapper.wrapRange(start.node, end.node, { includeStart: true, includeEnd: false });
    }

    function destroyWrapper(start, end) {
      nodeWrapper.unwrapRange(start.node, end.node, { includeStart: true, includeEnd: false });
      start.join();
      end.join();
    }

    function extendWrapperRight(ref) {
      // console.log("extendWrapperRight(focus=" + focus + ", ref=" + ref);
      ref.split();
      var prefocus = focus.node.previousSibling;
      if (prefocus && nodeWrapper.isWrapper(prefocus)) {
        prefocus.appendChild(focus.node);
        focus.join();
      }
      nodeWrapper.wrapRange(focus.node, ref.node, { includeStart: true, includeEnd: false });
    }

    function extendWrapperLeft(ref) {
      // console.log("extendWrapperLeft(ref=" + ref + ", focus=" + focus);
      ref.split();
      var prefocus = focus.node.parentNode.previousSibling;
      if (prefocus && prefocus.nodeType === Node.TEXT_NODE) {
        focus.node.parentNode.insertBefore(prefocus, focus.node);
        focus.join();
      }
      nodeWrapper.wrapRange(ref.node, focus.node, { includeStart: true, includeEnd: false });
    }

    function truncateWrapperRight(ref) {
      // console.log("truncateWrapperRight(ref=" + ref + ", focus=" + focus);
      if (ref.offset > 0) {
        ref.split();
        var wrapper = ref.node.parentNode;
        wrapper.parentNode.insertBefore(ref.node, wrapper.nextSibling);
      }
      nodeWrapper.unwrapRange(ref.node, focus.node, { includeStart: true, includeEnd: false });
      focus.join();
    }

    function truncateWrapperLeft(ref) {
      // console.log("truncateWrapperLeft(focus=" + focus + ", ref=" + ref);
      ref.split();
      if (focus.node.nextSibling) {
        focus.node.parentNode.parentNode.insertBefore(focus.node, focus.node.parentNode);
      } else {
        nodeWrapper.unwrapRange(focus.node, ref.node, { includeStart: true, includeEnd: false });
      }
      focus.join();
    }

    function reverseWrapperRight(ref) {
      // console.log("reverseWrapperRight(focus=" + focus + ", anchor=" + anchor + ", ref=" + ref);
      nodeWrapper.unwrapRange(focus.node, anchor.node, { includeStart: true, includeEnd: false });
      focus.join();
      ref.split();
      nodeWrapper.wrapRange(anchor.node, ref.node, { includeStart: true, includeEnd: false });
    }

    function reverseWrapperLeft(ref) {
      // console.log("reverseWrapperLeft(ref=" + ref + ", anchor=" + anchor + ", focus=" + focus);
      nodeWrapper.unwrapRange(anchor.node, focus.node, { includeStart: true, includeEnd: false });
      focus.join();
      ref.split();
      nodeWrapper.wrapRange(ref.node, anchor.node, { includeStart: true, includeEnd: false });
    }

    function compare(a, b, callbacks) {
      var cmp = compareNodes(a.node, b.node)
      if (cmp < 0) return callbacks.lt();
      if (cmp > 0) return callbacks.gt();
      if (a.offset < b.offset) return callbacks.lt();
      if (a.offset > b.offset) return callbacks.gt();
      return callbacks.eq();
    }

    function extend(node, offset) {
      if (isCollapsed()) {
        focus.node = node;
        focus.offset = offset;
        normalize(focus);

        compare(anchor, focus, {
          lt: function() { createWrapper(anchor, focus); },
          gt: function() { createWrapper(focus, anchor); },
          eq: function() {},      // it's already collapsed, and it's staying that way
        });
      } else {
        var ref = new LocationReference(node, offset);
        normalize(ref);
        compare(anchor, focus, {
          lt: function() {
            compare(focus, ref, {
              lt: function() { extendWrapperRight(ref); },                        // anchor, focus, ref
              gt: function() {
                compare(anchor, ref, {
                  lt: function() { truncateWrapperRight(ref); },                  // anchor, ref, focus
                  gt: function() { reverseWrapperLeft(ref); },                    // ref, anchor, focus
                  eq: function() { destroyWrapper(anchor, focus); },              // anchor == ref, focus
                });
              },
              eq: function() {},                                                  // anchor, ref == focus
            });
          },
          gt: function() {
            compare(focus, ref, {
              lt: function() {
                compare(anchor, ref, {
                  lt: function() { reverseWrapperRight(ref); },                   // focus, anchor, ref
                  gt: function() { truncateWrapperLeft(ref); },                   // focus, ref, anchor
                  eq: function() { destroyWrapper(focus, anchor); },              // focus, ref == anchor
                });
              },
              gt: function() { extendWrapperLeft(ref); },                         // ref, focus, anchor
              eq: function() {},                                                  // ref == focus, anchor
            });
          },
          eq: function() {}, // shouldn't happen -- we already tested that we're not collapsed
        });
        focus.destroy();
        focus = ref;
      }
    }

    function destroy() {
      if (compareNodes(focus.node, anchor.node) < 0) {
        nodeWrapper.unwrapRange(focus.node, anchor.node, { includeStart: true, includeEnd: false });
      } else {
        nodeWrapper.unwrapRange(anchor.node, focus.node, { includeStart: true, includeEnd: false });
      }
      anchor.join();
      focus.join();
      return { startContainer: anchor.node, startOffset: anchor.offset, endContainer: focus.node, endOffset: focus.offset };
    }

    Object.defineProperty(this, "root", { get: function() { return root; }});
    Object.defineProperty(this, "anchorNode", { get: function() { return anchor.node; }});
    Object.defineProperty(this, "anchorOffset", { get: function() { return anchor.offset; }});
    Object.defineProperty(this, "focusNode", { get: function() { return focus.node; }});
    Object.defineProperty(this, "focusOffset", { get: function() { return focus.offset; }});
    Object.defineProperty(this, "isCollapsed", { get: isCollapsed });

    Object.defineProperty(this, "collapse", { value: collapse });
    Object.defineProperty(this, "extend", { value: extend });
    Object.defineProperty(this, "collapseToStart", { value: function() { extend(anchor.node, anchor.offset); }});
    Object.defineProperty(this, "collapseToEnd", { value: function() { var refs = destroy(); collapse(refs.endContainer, refs.endOffset); }});
    Object.defineProperty(this, "destroy", { value: function() {
      var range = destroy();
      root.normalize();
      return range;
    }});
  }

  return CustomSelection;

}());
//# sourceMappingURL=custom-selection.js.map