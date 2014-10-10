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
	 */
	Viewport.getBox = function () {
		return {
			w: window.innerWidth,
			h: window.innerHeight,
			t: window.pageYOffset,
			l: window.pageXOffset
		};
	};

	/**
	 * Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
	 * virtual keyboard.
	 * @function module:delite/Viewport.getEffectiveBox
	 */
	Viewport.getEffectiveBox = function () {
		var box = Viewport.getBox();

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var focusedNode = document.activeElement,
			tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
		if (has("ios") && focusedNode && !focusedNode.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url)$/.test(focusedNode.type)))) {

			// Box represents the size of the viewport.  Some of the viewport is likely covered by the keyboard.
			// Estimate height of visible viewport assuming viewport goes to bottom of screen,
			// but is covered by keyboard.
			box.h *= (window.orientation === 0 || window.orientation === 180 ? 0.66 : 0.40);
		}

		return box;
	};

	var oldEffectiveBox = Viewport.getEffectiveBox(document);

	function checkForResize() {
		var newBox = Viewport.getEffectiveBox(document);
		if (newBox.h !== oldEffectiveBox.h || newBox.w !== oldEffectiveBox.w ||
			newBox.t !== oldEffectiveBox.t || newBox.l !== oldEffectiveBox.l) {
			oldEffectiveBox = newBox;
			Viewport.emit("resize", newBox);
			return true;
		} else {
			return false;
		}
	}

	// Poll for viewport resizes due to rotation, browser window size change, or the virtual keyboard
	// popping up/down.
	function poll() {
		var resized = checkForResize();
		setTimeout(poll, resized ? 10 : 50);
	}
	poll();

	return Viewport;
});
