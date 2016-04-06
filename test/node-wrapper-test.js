"use strict";

import { expect } from "chai";

import NodeWrapper from "../src/node-wrapper";

describe("NodeWrapper", function() {
  var fixture = undefined;
  function $(s) { return fixture.querySelector(s); }
  function $$(s) { return fixture.querySelectorAll(s); }
  beforeEach(function() { fixture = document.querySelector("#fixtures"); });
  afterEach(function() { fixture.innerHTML = ""; });

  describe('#wrap()', function() {
    it("wraps a text node", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      var container = target.parentNode;
      subject.wrap(target);

      expect(target.parentNode).to.match("mark.wrapped");
      expect(target.parentNode.parentNode).to.equal(container);
      expect($$('mark.wrapped')).to.have.text(["Second"]);
    });

    it("is idempotent", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      var container = target.parentNode;
      subject.wrap(target);
      subject.wrap(target);

      expect(target.parentNode).to.match("mark.wrapped");
      expect(target.parentNode.parentNode).to.equal(container);
      expect($$('mark.wrapped')).to.have.text(["Second"]);
    });
  });

  describe('#unwrap()', function() {
    it("unwraps a text node", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      var container = target.parentNode;
      subject.wrap(target);
      subject.unwrap(target);

      expect(target.parentNode.nodeName).to.equal("LI");
      expect(target.parentNode).to.equal(container);
      expect(fixture).to.have.html('<ul><li>First</li><li>Second</li><li>Third</li></ul>');
    });

    it("is idempotent", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      var container = target.parentNode;
      subject.wrap(target);
      subject.unwrap(target);
      subject.unwrap(target);

      expect(target.parentNode.nodeName).to.equal("LI");
      expect(target.parentNode).to.equal(container);
      expect(fixture).to.have.html('<ul><li>First</li><li>Second</li><li>Third</li></ul>');
    });
  });

  describe("#wrapRange", function() {
    it("wraps a range of text nodes", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      subject.wrapRange($('li:first-of-type').firstChild, $('li:last-of-type').firstChild, { includeStart: true, includeEnd: false });

      expect($$('mark.wrapped')).to.have.text(["First", "Second"]);
    });

    it("can optionally include or exclude the extreme nodes", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      subject.wrapRange($('li:first-of-type').firstChild, $('li:last-of-type').firstChild, { includeStart: false, includeEnd: true });

      expect($$('mark.wrapped')).to.have.text(["Second", "Third"]);
    });
  });

  describe("#unwrapRange", function() {
    it("unwraps a range of text nodes", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';
      var start = $('li:first-of-type').firstChild;
      var end = $('li:last-of-type').firstChild;

      var subject = new NodeWrapper('mark', 'wrapped');
      subject.wrapRange(start, end, { includeStart: true, includeEnd: true });
      subject.unwrapRange(start, end, { includeStart: true, includeEnd: false });

      expect($$('mark.wrapped')).to.have.text(["Third"]);
    });

    it("can include the final node", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';
      var start = $('li:first-of-type').firstChild;
      var end = $('li:last-of-type').firstChild;

      var subject = new NodeWrapper('mark', 'wrapped');
      subject.wrapRange(start, end, { includeStart: false, includeEnd: true });
      subject.unwrapRange(start, end, { includeStart: false, includeEnd: true });

      expect(fixture).to.have.html('<ul><li>First</li><li>Second</li><li>Third</li></ul>');
    });
  });

  describe('#isWrapped()', function() {
    it("tests whether a node is wrapped", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      subject.wrap(target);

      expect(subject.isWrapped(target)).to.be.true;
    });
  });

  describe('#isWrapper()', function() {
    it("identifies wrapper nodes", function() {
      fixture.innerHTML = '<ul><li>First</li><li>Second</li><li>Third</li></ul>';

      var subject = new NodeWrapper('mark', 'wrapped');
      var target = $('li:nth-of-type(2)').firstChild;
      subject.wrap(target);

      expect(subject.isWrapper(target.parentNode)).to.be.true;
    });
  });
});
