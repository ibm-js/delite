/**
 * Utility singleton to watch for viewport resizes, avoiding duplicate notifications
 * which can lead to infinite loops.
 *
 * Usage:
 * ```
 * Viewport.on("resize", myCallback)
 * Viewport.on("scroll", myOtherCallback)
 * ```
 *
 * myCallback() is called without arguments in case it's Widget.resize(),
 * which would interpret the argument as the size to make the widget.
 *
 * @module delite/Viewport
 */
define([
	"ibm-decor/Evented",
	"ibm-decor/sniff"	// has("ios")
], function (
	Evented,
	has
) {
	var Viewport = new Evented();

	// Get the size of the viewport without size adjustment needed for iOS soft keyboard.
	// On android though, this returns the size of the visible area not including the keyboard.
	function getBox () {
		return {
			w: window.innerWidth,
			h: window.innerHeight,
			t: window.pageYOffset,
			l: window.pageXOffset
		};
	}

	var focusedNode;

	/**
	 * Get the size of the viewport, or on mobile devices, the part of the viewport not obscured by the
	 * virtual keyboard.
	 * @function module:delite/Viewport.getEffectiveBox
	 */
	Viewport.getEffectiveBox = function () {
		var box = getBox();

		// Account for iOS virtual keyboard, if it's being shown.  Unfortunately no direct way to check or measure.
		var tag = focusedNode && focusedNode.tagName && focusedNode.tagName.toLowerCase();
		if (has("ios") && focusedNode && !focusedNode.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url)$/.test(focusedNode.type)))) {

			var portrait = (window.orientation === 0 || window.orientation === 180);

			// "box" represents the size of the viewport.  Some of the viewport is likely covered by the virtual
			// keyboard, but we don't know how much, so window.innerHeight doesn't help us.  Instead,
			// estimate effective viewport size based on screen.height (in portrait mode) or screen.width
			// (in landscape mode).

			// Measurements of various iOS devices and how much of the screen size is available between
			// the address bar and the virtual keyboard, including the row for auto-suggest.
			// Note that iPhone hides the address bar in landscape mode.
			//
			// iPhone5, 5s, 5c, SE:
			//	* landscape screen.width = 320, available height = 115/640 = 17.9%
			//	* portrait screen.height = 568, available height = 405/1136 = 35.6%
			// iPhone 6, 7, 8:
			//	* landscape screen.width = 375, available height = 263/750 = 35%
			//	* portrait screen.height = 667, available height = 596/1325 = 44.9%
			// iPhone 6+, 6s+, 7+, 8+
			//	* landscape screen.width = 414, available height = 507/1242 = 40%
			//	* portrait screen.height = 736, available height = 1060/2208 = 48%
			// iPhone X:
			//	* landscape screen.width = 375, available height = 364/1122 = 32.4%
			//	* portrait screen.height = 812, available height = 1033/2436 = 42.4%
			// iPad mini, iPad Air, iPad Pro 9.7”
			//	* landscape screen.width = 768, available height = 603 / 1535 = 39.2%
			//	* portrait screen.height = 1024, available height = 1284 / 2047 = 62.7%
			// iPad Pro 12.9”, first and second gen
			//	* landscape screen.width = 1024, available height = 970 / 2044 = 47.4%
			//	* portrait screen.height = 1366, available height = 1846 / 2729 = 67.6%

			var multiplier;
			if (portrait) {
				multiplier = screen.height >= 1366 ? 0.67 : screen.height >= 1024 ? 0.62 :
					screen.height >= 667 ? 0.42 : 0.35;
				box.h = screen.height * multiplier;
			} else {
				multiplier = screen.width >= 1024 ? 0.47 : screen.width >= 414 ? 0.39 :
					screen.width >= 375 ? 0.32 : 0.18;
				box.h = screen.width * multiplier;
			}
		}

		return box;
	};

	// Catch viewport resizes due to rotation, browser window size change, or the virtual keyboard
	// popping up/down.
	// Use setTimeout() to debounce and throttle notifications.

	var oldEffectiveSize = Viewport.getEffectiveBox(),
		oldEffectiveScroll = oldEffectiveSize,
		timer;
	function scheduleCheck () {
		if (!timer) {
			timer = setTimeout(function () {
				var newBox = Viewport.getEffectiveBox();
				if (newBox.h !== oldEffectiveSize.h || newBox.w !== oldEffectiveSize.w) {
					oldEffectiveSize = newBox;
					Viewport.emit("resize", newBox);
				}
				if (newBox.t !== oldEffectiveScroll.t || newBox.l !== oldEffectiveScroll.l) {
					oldEffectiveScroll = newBox;
					Viewport.emit("scroll", newBox);
				}
				timer = null;
			}, 10);
		}
	}

	window.addEventListener("resize", scheduleCheck);
	window.addEventListener("orientationchange", scheduleCheck);
	window.addEventListener("scroll", scheduleCheck);

	// Recompute viewport size when keyboard is hidden or shown.
	if (has("ios")) {
		// Use "click" event rather than "focus" event because "focus" reports programmatic focus, which is
		// effectively meaningless. Also, don't use "pointerdown", as it triggers dialog resizing/scrolling
		// before the <input> has actually gotten focus, which leads to problems, see #507.
		window.addEventListener("click", function (evt) {
			focusedNode = evt.target;
			scheduleCheck();
		}, true);

		// Detect when virtual keyboard is manually hidden.
		window.addEventListener("focusout", function () {
			focusedNode = document.activeElement;
			scheduleCheck();
		}, true);
	}

	return Viewport;
});
