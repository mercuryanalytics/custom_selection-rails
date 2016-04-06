"use strict";

import { expect } from "chai";
import { nodePath } from "../src/dom-helpers";

import CustomSelection from "../src/custom-selection";

describe("CustomSelection", function() {
  var fixture = undefined;
  function $(s) { return fixture.querySelector(s); }
  function $$(s) { return fixture.querySelectorAll(s); }
  beforeEach(function() { fixture = document.querySelector("#fixtures"); });
  afterEach(function() { fixture.innerHTML = ""; });

  describe("usage", function() {
    describe("constructor", function() {
      it("is scoped to a particular DOM node", function() {
        fixture.innerHTML = "<p>Hello, world!</p>";
        var subject = new CustomSelection(fixture);
        expect(subject.root).to.equal(fixture);
      });

      it("defaults the scope to be the document body", function() {
        var subject = new CustomSelection();
        expect(subject.root).to.equal(document.body);
      });
    });

    describe("properties", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>Hello, world!</p>";
        subject = new CustomSelection(fixture);
      });

      it("has an anchor node (a text node) and a corresponding offset", function() {
        expect(subject.anchorOffset).to.equal(0);
        expect(subject.anchorNode).to.equal($("p").firstChild);
      });

      it("has a focus node (a text node) and a corresponding offset", function() {
        expect(subject.focusOffset).to.equal(0);
        expect(subject.focusNode).to.equal($("p").firstChild);
      });

      it("can indicate when the anchor and focus are the same", function() {
        expect(subject.isCollapsed).to.be.true;
      });
    });

    describe("#collapse", function() {
      it("sets the anchor and focus to the argument node and offset", function() {
        fixture.innerHTML = "<p>Hello, world!</p>";

        var subject = new CustomSelection(fixture)
        subject.collapse($("p").firstChild, 4);

        expect(subject.isCollapsed).to.be.true;
        expect(subject.anchorOffset).to.equal(4);
        expect(subject.anchorNode).to.equal($("p").firstChild);
        expect(subject.focusOffset).to.equal(subject.anchorOffset);
        expect(subject.focusNode).to.equal(subject.anchorNode);
      });
    });

    describe("#extend", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>1234567890ABC</p>";
        subject = new CustomSelection(fixture);
      });

      it("sets the focus to the argument and wraps the selection", function() {
        subject.collapse($("p").firstChild, 4);
        subject.extend($("p").firstChild, 9);

        expect(subject.isCollapsed).to.be.false;
        expect(subject.anchorNode.nodeValue.charAt(subject.anchorOffset)).to.equal("5");
        expect(subject.focusNode.nodeValue.charAt(subject.focusOffset)).to.equal("0");
      });

      it("wraps the selection", function() {
        subject.collapse($("p").firstChild, 4);
        subject.extend($("p").firstChild, 9);

        expect(fixture.textContent).to.equal("1234567890ABC");
        expect($$("mark")).to.have.text(["56789"]);
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.normalized;
      });
    });

    describe("#collapseToStart()", function() {
      it("moves the focus to the anchor", function() {
        fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("b").nextSibling, 3);
        subject.collapseToStart();

        expect(subject.anchorOffset).to.equal(2);
        expect(subject.anchorNode).to.equal($("b").firstChild);
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.have.html("<p>Left<b>Center</b>Right</p>");
      });
    });

    describe("#collapseToEnd()", function() {
      it("moves the anchor to the focus", function() {
        fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("b").nextSibling, 3);
        subject.collapseToEnd();

        expect(subject.anchorOffset).to.equal(3);
        expect(subject.anchorNode).to.equal($("b").nextSibling);
        expect(fixture).to.be.normalized;
        expect(fixture).to.have.html("<p>Left<b>Center</b>Right</p>");
      });
    });

    describe("#destroy", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>Hello, world!</p>";
        subject = new CustomSelection(fixture);
        subject.collapse($("p").firstChild, 4);
        subject.extend($("p").lastChild, 9);
      });

      it("removes the mark", function() {
        subject.destroy();

        expect(fixture).to.be.normalized;
        expect($$("mark")).to.be.empty;
        expect(fixture.textContent).to.equal("Hello, world!");
      });

      it("returns the range", function() {
        var result = subject.destroy();

        expect(result).to.have.all.keys(['startOffset', 'startContainer', 'endOffset', 'endContainer']);
        expect(result.startOffset).to.equal(4);
        expect(result.startContainer).to.equal($("p").firstChild);
        expect(result.endOffset).to.equal(9);
        expect(result.endContainer).to.equal($("p").firstChild);
      });
    });
  });

  describe("miscellaneous edge cases", function() {
    describe("creating a range", function() {
      describe("single node", function() {
        describe("forward", function() {
          it("sets the focus to the argument and wraps the selection", function() {
            fixture.innerHTML = "<p>Hello, world!</p>";

            var subject = new CustomSelection(fixture)
            subject.collapse($("p").firstChild, 4);
            subject.extend($("p").firstChild, 9);

            expect(subject.isCollapsed).to.be.false;
            expect(fixture.textContent).to.equal("Hello, world!");
            expect(subject.anchorOffset).to.equal(0);
            expect(subject.anchorNode.nodeValue).to.equal("o, wo");
            expect(subject.focusOffset).to.equal(0);
            expect(subject.focusNode.nodeValue).to.equal("rld!");
            expect($$("mark")).to.have.text(["o, wo"]);
            expect(fixture).to.be.normalized;
            expect($$("mark+mark")).to.have.length(0);
          });

          it("works if the argument is the end of a text node", function() {
            fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";

            var subject = new CustomSelection(fixture)
            subject.collapse($("b").firstChild, 0);
            subject.extend($("b").firstChild, 6);

            expect(subject.isCollapsed).to.be.false;
            expect(fixture.textContent).to.equal("LeftCenterRight");
            expect(subject.anchorOffset).to.equal(0);
            expect(subject.anchorNode.nodeValue).to.equal("Center");
            // expect(subject.focusOffset).to.equal(0);
            // expect(subject.focusNode.nodeValue).to.equal("rld!");
            expect($$("mark")).to.have.text(["Center"]);
            expect(fixture).to.be.normalized;
            expect($$("mark+mark")).to.have.length(0);
          });
        });

        describe("backward", function() {
          it("sets the focus to the argument and wraps the selection", function() {
            fixture.innerHTML = "<p>Hello, world!</p>";

            var subject = new CustomSelection(fixture)
            subject.collapse($("p").firstChild, 9);
            subject.extend($("p").firstChild, 4);

            expect(subject.isCollapsed).to.be.false;
            expect(fixture.textContent).to.equal("Hello, world!");
            expect(subject.anchorOffset).to.equal(0);
            expect(subject.anchorNode.nodeValue).to.equal("rld!");
            expect(subject.focusOffset).to.equal(0);
            expect(subject.focusNode.nodeValue).to.equal("o, wo");
            expect($$("mark")).to.have.length(1);
            expect($$("mark")).to.have.text(["o, wo"]);
          });
        });
      });

      describe("across nodes", function() {
        describe("forward", function() {
          it("sets the focus to the argument and wraps the selection", function() {
            fixture.innerHTML = "<p>Goodbye, <em>cruel</em> world!</p>";

            var subject = new CustomSelection(fixture)
            subject.collapse($("p").firstChild, 4);
            subject.extend($("p").lastChild, 3);

            expect(subject.isCollapsed).to.be.false;
            expect(fixture.textContent).to.equal("Goodbye, cruel world!");
            expect(subject.anchorOffset).to.equal(0);
            expect(subject.anchorNode.nodeValue).to.equal("bye, ");
            expect(subject.focusOffset).to.equal(0);
            expect(subject.focusNode.nodeValue).to.equal("rld!");
            expect($$("mark")).to.have.text(["bye, ", "cruel", " wo"]);
          });
        });

        describe("backward", function() {
          it("sets the focus to the argument and wraps the selection", function() {
            fixture.innerHTML = "<p>Goodbye, <em>cruel</em> world!</p>";

            var subject = new CustomSelection(fixture)
            subject.collapse($("p").lastChild, 3);
            subject.extend($("p").firstChild, 4);

            expect(subject.isCollapsed).to.be.false;
            expect(fixture.textContent).to.equal("Goodbye, cruel world!");
            expect(subject.anchorOffset).to.equal(0);
            expect(subject.anchorNode.nodeValue).to.equal("rld!");
            expect(subject.focusOffset).to.equal(0);
            expect(subject.focusNode.nodeValue).to.equal("bye, ");
            expect($$("mark")).to.have.text(["bye, ", "cruel", " wo"]);
          });
        });
      });
    });

    describe("when the focus follows the anchor", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
        subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("b").firstChild, 4);
      });

      describe("moving the focus to the right (extendWrapperRight)", function() {
        it("can be later in same node <p>Left<b>Ce[nt]e|r</b>Right</p>", function() {
          subject.extend(subject.focusNode, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["nte"]);
        });

        it("can be in a later node <p>Left<b>Ce[nt]er</b>Ri|ght</p>", function() {
          subject.extend($("p").lastChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["nter", "Ri"]);
        });

        it("can be at a node boundary", function() {
          fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
          subject = new CustomSelection(fixture);
          subject.collapse($("b").firstChild, 2);
          subject.extend($("b").firstChild, 6);
          subject.extend($("p").lastChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["nter", "Ri"]);
        });
      });

      describe("moving the focus to the left (truncateWrapperRight)", function() {
        it("can be earlier in the same node <p>Left<b>Ce[n|t]er</b>Right</p>", function() {
          subject.extend(subject.anchorNode, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["n"]);
        });

        it("should work here <p>Le[ft<b>Center|</b>Rig]ht</p>", function() {
          fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
          var subject = new CustomSelection(fixture);
          subject.collapse($("p").firstChild, 2);
          subject.extend($("p").lastChild, 3);
          subject.extend($("b").firstChild.firstChild, 6);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["ft", "Center"]);
        });

        it("it has this edge case (shortening focus at end of node)", function() {
          // <p>One<b>Tw[o|</b>Three<i>Four]</i>Five</p>
          fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
          var subject = new CustomSelection(fixture);
          subject.collapse($("b").firstChild, 2);
          subject.extend($("i").firstChild, 4);
          // subject.extend(subject.anchorNode, 1);
          subject.extend($("i").previousSibling.firstChild, 5);
          expect($$("mark")).to.have.text(["o", "Three"]);
          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
        });
      });

      describe("moving the focus before the anchor (reverseWrapperLeft)", function() {
        it("can be before the anchor in the same node <p>Left<b>C|e[nt]er</b>Right</p>", function() {
          subject.extend($("b").firstChild, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["e"]);
        });

        it("can be in an earlier node <p>Le|ft<b>Ce[nt]er</b>Right</p>", function() {
          subject.extend($("p").firstChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["ft", "Ce"]);
        });
      });
    });

    describe("when the focus precedes the anchor", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
        subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 4);
        subject.extend($("b").firstChild, 2);
      });

      describe("moving the focus left (extendWrapperLeft)", function() {
        it("can be before the anchor in the same node <p>Left<b>C|e]nt[er</b>Right</p>", function() {
          subject.extend($("b").firstChild, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["ent"]);
        });

        it("can be in an earlier node <p>Le|ft<b>Ce]nt[er</b>Right</p>", function() {
          subject.extend($("p").firstChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["ft", "Cent"]);
        });

        it("has this edge case", function() {
          fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
          subject = new CustomSelection(fixture);
          subject.collapse($("b").firstChild, 4);
          subject.extend($("b").firstChild, 0);
          subject.extend($("p").firstChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["ft", "Cent"]);
        });
      });

      describe("moving the focus right (truncateWrapperLeft)", function() {
        it("can be earlier in the same node <p>Left<b>Ce]n|t[er</b>Right</p>", function() {
          subject.extend(subject.focusNode, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["t"]);
        });
      });

      describe("moving the focus after the anchor (reverseWrapperRight)", function() {
        it("can be later in same node <p>Left<b>Ce]nt[e|r</b>Right</p>", function() {
          subject.extend(subject.anchorNode, 1);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["e"]);
        });

        it("can be in a later node <p>Left<b>Ce]nt[er</b>Ri|ght</p>", function() {
          subject.extend($("p").lastChild, 2);

          expect(fixture).to.be.normalized;
          expect($$("mark+mark")).to.have.length(0);
          expect($$("mark")).to.have.text(["er", "Ri"]);
        });
      });
    });

    describe("group 1", function() {
      var subject;
      beforeEach(function() {
        fixture.innerHTML = "<p>Left<b>Center</b>Right</p>";
        subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 4);
        subject.extend($("b").firstChild, 2);
        // <p>Left<b>Ce]nt[er</b>Right</p>
      });

      it("- left start", function() {
        // <p>Left<b>|Ce]nt[er</b>Right</p>
        subject.extend($("p").firstChild, 0);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- left end", function() {
        subject.extend($("p").firstChild, 4);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- right start", function() {
        subject.extend($("b").nextSibling, 0);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- right end", function() {
        subject.extend($("b").nextSibling, 5);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- center start", function() {
        subject.extend($("b").firstChild, 0);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- center end", function() {
        // <p>Left<b>Ce[nt]er|</b>Right</p>
        subject.extend($("b").lastChild, 2);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- collapse", function() {
        // <p>Left<b>Ce[|nt]er</b>Right</p>
        subject.extend(subject.anchorNode, 0);

        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(subject.isCollapsed).to.be.true;
        expect(fixture).to.have.html("<p>Left<b>Center</b>Right</p>");
      });
    });

    describe("group 2", function() {
      it("- extending focus at end of node", function() {
        // <p>One<b>Tw[o</b>Three<i>Four]</i>Five|</p>
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
        var subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("i").firstChild, 4);
        subject.extend($("p").lastChild, 4);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- extending focus at start of node", function() {
        // <p>One<b>Tw[o</b>Three<i>]Four</i>Five|</p>
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
        var subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("i").firstChild, 0);
        subject.extend(subject.focusNode, 2);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- extending focus at end of node", function() {
        // <p>One<b>Tw[o</b>Three<i>Four]</i>Five|</p>
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
        var subject = new CustomSelection(fixture);
        subject.collapse($("b").firstChild, 2);
        subject.extend($("i").firstChild, 4);
        subject.extend($("i").previousSibling.firstChild, 5);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- extending anchor at start of node", function() {
        // <p>One<b>]Two</b>Three<i>Fo[ur</i>Five</p>
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
        var subject = new CustomSelection(fixture);
        subject.collapse($("i").firstChild, 2);
        subject.extend($("b").firstChild, 0);
        subject.extend(subject.focusNode, 1);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });

      it("- shortening anchor at end of node", function() {
        // <p>One<b>Tw]o</b>Three|<i>Four[</i>Five</p>
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";
        var subject = new CustomSelection(fixture);
        subject.collapse($("i").firstChild, 4);
        subject.extend($("b").firstChild, 2);
        subject.extend($("i").previousSibling.firstChild, 5);
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
      });
    });

    describe("group 3", function() {
      it("extends on the right as needed", function() {
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";

        var subject = new CustomSelection(fixture);
        var ref = $("p").firstChild
        subject.collapse(ref, 1);
        subject.extend(ref, 2);
        expect($$("mark")).to.have.text("n");
        subject.extend(ref.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("ne");
        subject.extend(ref.nextSibling.nextSibling.firstChild, 0);
        expect($$("mark")).to.have.text("ne");
        subject.extend(ref.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("neT");
        subject.extend(ref.nextSibling.nextSibling.firstChild.nextSibling, 1);
        expect($$("mark")).to.have.text("neTw");
        subject.extend(ref.nextSibling.nextSibling.firstChild.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwo");
        subject.extend(ref.nextSibling.nextSibling.nextSibling, 0);
        expect($$("mark")).to.have.text("neTwo");
        subject.extend(ref.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoT");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoTh");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThr");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThre");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThree");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.firstChild, 0);
        expect($$("mark")).to.have.text("neTwoThree");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("neTwoThreeF");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.firstChild.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFo");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.firstChild.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFou");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.firstChild.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFour");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling, 0);
        expect($$("mark")).to.have.text("neTwoThreeFour");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFourF");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFourFi");
        subject.extend(ref.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFourFiv");
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        var range = subject.destroy();
        expect(fixture).to.be.normalized;
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        expect(range).to.have.all.keys(['startOffset', 'startContainer', 'endOffset', 'endContainer']);
        expect(range.startOffset).to.equal(1);
        expect(range.startContainer).to.equal($("p").firstChild);
        expect(range.endOffset).to.equal(3);
        expect(range.endContainer).to.equal($("p").lastChild);
      });

      it("truncates on the right as needed", function() {
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").firstChild, 1);
        subject.extend($("p").lastChild, 3);

        var ref = $("p");
        subject.extend(ref.lastChild.previousSibling.firstChild, 2);
        expect($$("mark")).to.have.text("neTwoThreeFourFi");
        subject.extend(ref.lastChild.previousSibling.firstChild, 1);
        expect($$("mark")).to.have.text("neTwoThreeFourF");
        subject.extend(ref.lastChild.previousSibling.firstChild, 0);
        expect($$("mark")).to.have.text("neTwoThreeFour");
        subject.extend(ref.lastChild.previousSibling.firstChild.firstChild, 4);
        expect($$("mark")).to.have.text("neTwoThreeFour");
        subject.extend(ref.lastChild.previousSibling.firstChild.firstChild, 3);
        expect($$("mark")).to.have.text("neTwoThreeFou");
        subject.extend(ref.lastChild.previousSibling.firstChild.firstChild, 2);
        expect($$("mark")).to.have.text("neTwoThreeFo");
        subject.extend(ref.lastChild.previousSibling.firstChild.firstChild, 1);
        expect($$("mark")).to.have.text("neTwoThreeF");
        subject.extend(ref.lastChild.previousSibling.firstChild.firstChild, 0);
        expect($$("mark")).to.have.text("neTwoThree");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 5);
        expect($$("mark")).to.have.text("neTwoThree");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 4);
        expect($$("mark")).to.have.text("neTwoThre");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild, 3);
        expect($$("mark")).to.have.text("neTwoThr");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild, 2);
        expect($$("mark")).to.have.text("neTwoTh");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild, 1);
        expect($$("mark")).to.have.text("neTwoT");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild, 0);
        expect($$("mark")).to.have.text("neTwo");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild.firstChild, 3);
        expect($$("mark")).to.have.text("neTwo");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild.firstChild, 2);
        expect($$("mark")).to.have.text("neTw");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild.firstChild, 1);
        expect($$("mark")).to.have.text("neT");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.firstChild.firstChild, 0);
        expect($$("mark")).to.have.text("ne");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 2);
        expect($$("mark")).to.have.text("ne");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 1);
        expect($$("mark")).to.have.text("n");

        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        var range = subject.destroy();
        expect(fixture).to.be.normalized;
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        expect(range).to.have.all.keys(['startOffset', 'startContainer', 'endOffset', 'endContainer']);
        expect(range.startOffset).to.equal(1);
        expect(range.startContainer).to.equal($("p").firstChild);
        expect(range.endOffset).to.equal(2);
        expect(range.endContainer).to.equal($("p").firstChild);
      });

      it("extends on the left as needed", function() {
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").lastChild, 3);
        subject.extend($("p").lastChild, 2);

        expect($$("mark")).to.have.text("v");
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");

        var ref = $("p");
        subject.extend(ref.lastChild.previousSibling.previousSibling, 1);
        expect($$("mark")).to.have.text("iv");
        subject.extend(ref.lastChild.previousSibling.previousSibling, 0);
        expect($$("mark")).to.have.text("Fiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 4);
        expect($$("mark")).to.have.text("Fiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 3);
        expect($$("mark")).to.have.text("rFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 2);
        expect($$("mark")).to.have.text("urFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 1);
        expect($$("mark")).to.have.text("ourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.firstChild, 0);
        expect($$("mark")).to.have.text("FourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling, 5);
        expect($$("mark")).to.have.text("FourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling, 4);
        expect($$("mark")).to.have.text("eFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling, 3);
        expect($$("mark")).to.have.text("eeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling, 2);
        expect($$("mark")).to.have.text("reeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling, 1);
        expect($$("mark")).to.have.text("hreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling, 0);
        expect($$("mark")).to.have.text("ThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 3);
        expect($$("mark")).to.have.text("ThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 2);
        expect($$("mark")).to.have.text("oThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 1);
        expect($$("mark")).to.have.text("woThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.firstChild, 0);
        expect($$("mark")).to.have.text("TwoThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling, 3);
        expect($$("mark")).to.have.text("TwoThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling, 2);
        expect($$("mark")).to.have.text("eTwoThreeFourFiv");
        subject.extend(ref.lastChild.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling.previousSibling, 1);
        expect($$("mark")).to.have.text("neTwoThreeFourFiv");

        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        var range = subject.destroy();
        expect(fixture).to.be.normalized;
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        expect(range).to.have.all.keys(['startOffset', 'startContainer', 'endOffset', 'endContainer']);
        expect(range.startOffset).to.equal(3);
        expect(range.startContainer).to.equal($("p").lastChild);
        expect(range.endOffset).to.equal(1);
        expect(range.endContainer).to.equal($("p").firstChild);
      });

      it("truncates on the left as needed", function() {
        fixture.innerHTML = "<p>One<b>Two</b>Three<i>Four</i>Five</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").lastChild, 3);
        subject.extend($("p").firstChild, 1);

        expect($$("mark")).to.have.text("neTwoThreeFourFiv");
        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");

        var ref = $("p");
        subject.extend(ref.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("eTwoThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("TwoThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.firstChild.firstChild, 0);
        expect($$("mark")).to.have.text("TwoThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.firstChild.firstChild, 1);
        expect($$("mark")).to.have.text("woThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("oThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("ThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.firstChild, 0);
        expect($$("mark")).to.have.text("ThreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("hreeFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("reeFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("eeFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("eFourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("FourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild.firstChild, 0);
        expect($$("mark")).to.have.text("FourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild.firstChild, 1);
        expect($$("mark")).to.have.text("ourFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("urFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("rFiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.firstChild.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("Fiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.firstChild, 0);
        expect($$("mark")).to.have.text("Fiv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("iv");
        subject.extend(ref.firstChild.nextSibling.nextSibling.nextSibling.nextSibling.nextSibling.firstChild, 1);
        expect($$("mark")).to.have.text("v");

        expect(fixture).to.be.normalized;
        expect($$("mark+mark")).to.have.length(0);
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");

        var range = subject.destroy();
        expect(fixture).to.be.normalized;
        expect(fixture).to.be.have.text("OneTwoThreeFourFive");
        expect(range).to.have.all.keys(['startOffset', 'startContainer', 'endOffset', 'endContainer']);
        expect(range.startOffset).to.equal(3);
        expect(range.startContainer).to.equal($("p").lastChild);
        expect(range.endOffset).to.equal(2);
        expect(range.endContainer).to.equal($("p").lastChild);
      });

      it("truncates left to the beginning of a node", function() {
        fixture.innerHTML = "<p>Hello, world!</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").firstChild, 9);
        subject.extend($("p").firstChild, 5);
        subject.extend($("p").firstChild.nextSibling.firstChild, 0);
        subject.extend($("p").firstChild, 5);
        expect($$("mark")).to.have.text(", wo");
      });

      it("extends left to the end of a node", function() {
        fixture.innerHTML = "<p>Pneumonoultrimicroscopicsilicovolcaniconiosis</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").firstChild, 20);
        subject.extend($("p").firstChild, 15);
        subject.extend($("p").firstChild, 15);
        subject.extend($("p").firstChild, 14);
        expect($$("mark+mark")).to.have.length(0);
      });

      it("extends left to the beginning of a node", function() {
        fixture.innerHTML = "<p>One<b>Two</b>Three</p>";

        var subject = new CustomSelection(fixture);
        subject.collapse($("p").lastChild, 3);
        subject.extend($("p").lastChild, 0);
        subject.extend($("b").firstChild, 0);
        expect($$("mark")).to.have.text(["Two", "Thr"]);
        expect($$("mark+mark")).to.have.length(0);
      });

      it("doesn't modify the text", function() {
        var html = "<p><b>first]</b>second<b>t|hird[ fourth</b></p>";
        fixture.innerHTML = html;
        var copy = fixture.textContent;

        var subject = new CustomSelection(fixture);
        subject.collapse($("b:nth-of-type(2)").firstChild, 5);
        subject.extend($("b:nth-of-type(1)").firstChild, 5);
        subject.extend($("b:nth-of-type(2)").firstChild.firstChild, 1);
        expect(fixture.textContent).to.equal(copy);
      });
    });
  });
});
