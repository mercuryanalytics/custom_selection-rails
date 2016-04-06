"use strict";

import { expect } from "chai";

import LocationReference from "../src/location-reference";

describe("LocationReference", function() {
  var fixture = undefined;
  function $(s) { return fixture.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(fixture.querySelectorAll(s), 0); }
  beforeEach(function() { fixture = document.querySelector("#fixtures"); });
  afterEach(function() { fixture.innerHTML = ""; });

  describe("constructor", function() {
    it("holds a reference to a DOM node", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 4);

      expect(subject.node).to.equal($("p").firstChild);
      expect(subject.offset).to.equal(4);
    });

    it("defaults the offset to zero", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild);

      expect(subject.node).to.equal($("p").firstChild);
      expect(subject.offset).to.equal(0);
    });
  });

  describe("#split()", function() {
    it("can split the referenced node", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 4);
      subject.split();

      expect(subject.node.nodeValue).to.equal($("p").firstChild.nextSibling.nodeValue);
      expect(subject.offset).to.equal(0);
    });

    it("knows when other references are modified and adjusts its own reference", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 9);
      var other = new LocationReference(subject.node, 4);
      other.split();

      expect(subject.node.nodeValue).to.equal(other.node.nodeValue);
      expect(subject.offset).to.equal(5);
    });

    it("does nothing if the offset is zero", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 0);
      subject.split();

      expect($("p").firstChild.nextSibling).to.be.null;
      expect(subject.offset).to.equal(0);
    });

    it("does nothing if the offset is too large", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 13);
      subject.split();

      expect(fixture).to.be.normalized;
      expect($("p").firstChild.nextSibling).to.be.null;
      expect(subject.offset).to.equal(13);
    });
  });

  describe("#join()", function() {
    it("undoes a split", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";
      var subject = new LocationReference($("p").firstChild, 4);
      subject.split();

      subject.join();

      expect(fixture).to.be.normalized;
    });
  });

  describe("#prefix()", function() {
    it("returns the contents of the node before the offset", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 4);

      expect(subject.prefix()).to.equal("Hell");
    });
  });

  describe("#suffix()", function() {
    it("returns the contents of the node after the offset", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 4);

      expect(subject.suffix()).to.equal("o, world!");
    });
  });

  describe("#destroy()", function() {
    it("stops tracking the reference", function() {
      fixture.innerHTML = "<p>Hello, world!</p>";

      var subject = new LocationReference($("p").firstChild, 9);
      var other = new LocationReference(subject.node, 4);
      subject.destroy()
      other.split();

      expect(subject.node).to.equal($("p").firstChild);
      expect(subject.offset).to.equal(9);
    });
  });
});
