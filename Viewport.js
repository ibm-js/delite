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

	// Get the size of the viewport without size adjustment needed for iOS soft keyboard.
	// On android though, this returns the size of the visible area not including the keyboard.
	function getBox() {
		if (has("ios") < 8) {
			// Workaround iOS < 8 problem where window.innerHeight is too low when the document is scrolled so
			// much that the document ends before the bottom of the keyboard.  Workaround not needed and doesn't work,
			// on iOS 8.
			var bcr = document.body.getBoundingClientRect();
			return {
				w: bcr.width,
				h: bcr.height,
				t: window.pageYOffset,
				l: window.pageXOffset
			};
		} else {
			return {
				w: window.innerWidth,
				h: window.innerHeight,
				t: window.pageYOffset,
				l: window.pageXOffset
			};
		}
	}

	/**
	 * Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
	 * virtual keyboard.
	 * @function module:delite/Viewport.getEffectiveBox
	 */
	Viewport.getEffectiveBox = function () {
		var box = getBox();

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var focusedNode = document.activeElement,
			tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
		if (has("ios") && focusedNode && !focusedNode.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url)$/.test(focusedNode.type)))) {

			// Box represents the size of the viewport.  Some of the viewport is likely covered by the keyboard.
			// Estimate height of visible viewport assuming viewport goes to bottom of screen,
			// but is covered by keyboard.
			
			// By my measurements the effective viewport is the following size (compared to full viewport:
			// Portrait / landscape / window.screen.height:
			// iPhone 6 / iOS 8: 54% / 26% / 667
			// iPhone 5s / iOS 8: 53% / 27% / 568
			// iPhone 5s / iOS 7: 53% / 19% / 568
			// iPhone 5 / iOS 8: 52% / 27% / 568
			// iPhone 4s / iOS 7: 41% / 19% / 480
			// iPad 2 / iOS 7.1: 66% / 41%
			// iPhone 3s / iOS6: 43% / 29% (but w/hidden address bar because it hides all the time)


			if (has("ipad")) {
				// Numbers for iPad 2, hopefully it works for other iPads (including iPad mini) too.
				box.h *= (window.orientation === 0 || window.orientation === 180 ? 0.65 : 0.38);
			} else {
				// iPhone varies a lot by model, this should estimate the available space conservatively
				if (window.orientation === 0 || window.orientation === 180) {
					// portrait
					box.h *= (window.screen.height > 500 ? 0.54 : 0.42);
				} else {
					// landscape
					box.h *= (window.screen.height > 500 && has("ios") >= 8 ? 0.26 : 0.19);
				}
			}
		}

		return box;
	};

	var oldEffectiveBox = Viewport.getEffectiveBox();

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
