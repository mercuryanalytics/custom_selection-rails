function once(fn) {
  var handler = function(event) {
    this.removeEventListener(event.type, handler);
    return fn(event);
  };
  return handler;
}

function installMouseHandler(root, onStart) {
  root.addEventListener("mousedown", function(event) {
    event.preventDefault();
    var handlers = onStart(event.clientX, event.clientY);
    var mouseMoveListener;
    root.addEventListener("mousemove", mouseMoveListener = function(event) {
      event.preventDefault();
      handlers.onMove(event.clientX, event.clientY);
    });
    root.addEventListener("mouseup", once(function(event) {
      event.preventDefault();
      root.removeEventListener("mousemove", mouseMoveListener);
      handlers.onEnd(event.clientX, event.clientY);
    }));
  });
}

function installTouchHandler(root, onStart) {
  var touchStartListener = once(function(event) {
    event.preventDefault();
    var touch = event.changedTouches[0];
    var tid = touch.identifier;
    var handlers = onStart(touch.clientX, touch.clientY);
    var touchMoveListener;
    root.addEventListener("touchmove", touchMoveListener = function(event) {
      var touch = Array.prototype.find.call(event.touches, function(touch) { return touch.identifier == tid; });
      if (!touch) return;
      event.preventDefault();
      handlers.onMove(touch.clientX, touch.clientY);
    });
    var touchEndListener;
    root.addEventListener("touchend", touchEndListener = function(event) {
      var touch = Array.prototype.find.call(event.changedTouches, function(touch) { return touch.identifier == tid; });
      if (!touch) return;
      event.preventDefault();
      root.removeEventListener("touchmove", touchMoveListener);
      root.removeEventListener("touchend", touchEndListener);
      handlers.onEnd(touch.clientX, touch.clientY);
      root.addEventListener("touchstart", touchStartListener);
    });
  });
  root.addEventListener("touchstart", touchStartListener);
}

var textRecorder = document.querySelector("#text-recorder");
function selectHandler(x, y) {
  var sel = new CustomSelection(textRecorder);
  var startCaret = document.caretPositionFromPoint(x, y);
  sel.collapse(startCaret.offsetNode, startCaret.offset);

  function onMove(x, y) {
    var endCaret = document.caretPositionFromPoint(x, y);
    sel.extend(endCaret.offsetNode, endCaret.offset)
  }

  function onEnd(x, y) {
    var endCaret = document.caretPositionFromPoint(x, y);
    sel.extend(endCaret.offsetNode, endCaret.offset)
    var range = sel.destroy();
  }

  return { onMove: onMove, onEnd: onEnd };
}

installMouseHandler(textRecorder, selectHandler);
installTouchHandler(textRecorder, selectHandler);
