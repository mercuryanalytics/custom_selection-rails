"use strict";

import { expect } from "chai";

describe("chai-normalization", function() {
  var fixture = undefined;
  beforeEach(function() { fixture = document.querySelector("#fixtures"); });
  afterEach(function() { fixture.innerHTML = ""; });

  describe("normalization", function() {
    it("can detect when a tree is normalized", function() {
      fixture.innerText = "This is a test";
      expect(fixture).to.be.normalized;
    });

    it("can detect when a tree is not normalized", function() {
      fixture.innerText = "This is a test";
      fixture.firstChild.splitText(3);
      expect(fixture).to.not.be.normalized;
    });
  });
});
