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
	"dojo/Evented",
	"dojo/on",
	"dojo/sniff",	// has("ie"), has("ios")
	"dojo/window", // getBox()
	"requirejs-domready/domReady!"
], function (Evented, on, has, winUtils) {
	var Viewport = new Evented();

	var focusedNode;

	var oldBox = winUtils.getBox();
	Viewport._rlh = on(window, "resize", function () {
		var newBox = winUtils.getBox();
		if (oldBox.h === newBox.h && oldBox.w === newBox.w) {
			return;
		}
		oldBox = newBox;
		Viewport.emit("resize");
	});

	// On iOS, keep track of the focused node so we can guess when the keyboard is/isn't being displayed.
	if (has("ios")) {
		on(document, "focusin", function (evt) {
			focusedNode = evt.target;
		});
		on(document, "focusout", function () {
			focusedNode = null;
		});
	}

	/**
	 * Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
	 * virtual keyboard.
	 * @function module:delite/Viewport.getEffectiveBox
	 * @param {Document} doc - The document, typically the global variable `document`.
	 */
	Viewport.getEffectiveBox = function (doc) {
		var box = winUtils.getBox(doc);

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
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

	return Viewport;
});
