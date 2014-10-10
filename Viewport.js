/**
 * Utility singleton to watch for viewport resizes, avoiding duplicate notifications
 * which can lead to infinite loops.
 *
 * Usage: `Viewport.on("resize", myCallback)`.
 * 
 * myCallback() is called without arguments in case it's Widget.resize(),
 * which would interpret the argument as the size to make the widget.
 *
 * @module delite/Viewport
 */
define([
	"decor/Evented",
	"decor/sniff",	// has("ios")
	"requirejs-domready/domReady!"
], function (Evented, has) {
	var Viewport = new Evented();

	/**
	 * Get the size of the viewport.
	 * @function module:delite/Viewport.getBox
	 * @param {Document} doc - The document, typically the global variable `document`.
	 */
	Viewport.getBox = function (doc) {
		var html = doc.documentElement;
		return {
			w: html.clientWidth,
			h: html.clientHeight,
			t: doc.body.scrollTop,	// alternately window.pageYOffset
			l: doc.body.scrollLeft	// alternately window.pageXOffset
		};
	};

	/**
	 * Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
	 * virtual keyboard.
	 * @function module:delite/Viewport.getEffectiveBox
	 * @param {Document} doc - The document, typically the global variable `document`.
	 */
	Viewport.getEffectiveBox = function (doc) {
		var box = Viewport.getBox(doc);

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var focusedNode = doc.activeElement,
			tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
		if (has("ios") && focusedNode && !focusedNode.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url)$/.test(focusedNode.type)))) {

			// Box represents the size of the viewport.  Some of the viewport is likely covered by the keyboard.
			// Estimate height of visible viewport assuming viewport goes to bottom of screen,
			// but is covered by keyboard.
			box.h *= (window.orientation === 0 || window.orientation === 180 ? 0.66 : 0.40);

			// Above measurement will be inaccurate if viewport was scrolled up so far that it ends before the bottom
			// of the screen.   In this case, keyboard isn't covering as much of the viewport as we thought.
			// We know the visible size is at least the distance from the top of the viewport to the focused node.
			var rect = focusedNode.getBoundingClientRect();
			box.h = Math.max(box.h, rect.top + rect.height);
		}

		return box;
	};

	var oldEffectiveBox = Viewport.getEffectiveBox(document);

	function checkForResize() {
		var newBox = Viewport.getEffectiveBox(document);
		if (newBox.h !== oldEffectiveBox.h || newBox.w !== oldEffectiveBox.w ||
			newBox.t !== oldEffectiveBox.t || newBox.l !== oldEffectiveBox.l ) {
			oldEffectiveBox = newBox;
			Viewport.emit("resize", newBox);
		}
	}

	// Catch viewport size change due to rotation (mobile devices) or browser window
	window.addEventListener("resize", checkForResize);

	// A change of focus from a <button> etc. to an <input> can change the size of the effective viewport
	// on mobile devices w/virtual keyboards.  Keep checking for a while to give time for virtual keyboard to pop up,
	// since that affects the document's scroll.
	var checkInterval = 50;
	function waitThenCheckForResize(timeToKeepChecking) {
		setTimeout(function () {
			checkForResize();
			if (timeToKeepChecking >= 0) {
				waitThenCheckForResize(timeToKeepChecking - checkInterval);
			}
		}, checkInterval);
	}
	window.addEventListener("focus", waitThenCheckForResize.bind(null, 1000), true);
	window.addEventListener("blur", waitThenCheckForResize.bind(null, 1000), true);

	return Viewport;
});
