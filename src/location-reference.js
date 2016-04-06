"use strict";

var knownLocations = [];

export default function LocationReference(node, offset) {
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
