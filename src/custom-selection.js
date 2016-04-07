"use strict";

import LocationReference from "./location-reference";
import NodeWrapper from "./node-wrapper";
import { compareNodes, findFirstTextNode, textWalker } from './dom-helpers';

export default function CustomSelection(root) {
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

  function collapsed() {
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
    if (collapsed()) {
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
    var start, end;
    if (compareNodes(focus.node, anchor.node) < 0) {
      start = focus;
      end = anchor;
    } else {
      start = anchor;
      end = focus;
    }
    nodeWrapper.unwrapRange(start.node, end.node, { includeStart: true, includeEnd: false });
    anchor.join();
    focus.join();
    return { startContainer: start.node, startOffset: start.offset, endContainer: end.node, endOffset: end.offset, collapsed: collapsed() };
  }

  Object.defineProperty(this, "root", { get: function() { return root; }});
  Object.defineProperty(this, "anchorNode", { get: function() { return anchor.node; }});
  Object.defineProperty(this, "anchorOffset", { get: function() { return anchor.offset; }});
  Object.defineProperty(this, "focusNode", { get: function() { return focus.node; }});
  Object.defineProperty(this, "focusOffset", { get: function() { return focus.offset; }});
  Object.defineProperty(this, "collapsed", { get: collapsed });

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
