/**
 * Test if computer is in high contrast mode (i.e. if CSS color settings are ignored)
 * Defines `has("highcontrast")` and sets `d-hc` CSS class on `<body>` if machine is in high contrast mode.
 *
 * Normally this code should not be used.  As long as widgets or applications avoid using background images for
 * icons, the browser will do everything for high contrast mode automatically.  The exception is for SVG,
 * which the browser does not adjust.
 *
 * If the OS is in high contrast mode and the browser obeys the OS setting,
 * `has("highcontrast")` is the color that text appears as.  Otherwise, `has("highcontrast")` is null.
 *
 * Module returns `has()` method.
 *
 * @module delite/hc
 */
define([
	"requirejs-dplugins/has",
	"requirejs-domready/domReady!"
], function (has) {

	has.add("highcontrast", function () {
		if (typeof window === "undefined") {
			return false;
		}

		// note: if multiple documents, doesn't matter which one we use
		var div = document.createElement("div");
		try {
			div.style.cssText =
				"border: 1px solid; border-color:red green; position: absolute; height: 5px; top: -999px;";
			document.body.appendChild(div);

			var cs = getComputedStyle(div);

			// If it's high contrast mode then return the color and background color the browser is using.
			// Otherwise just return null
			return cs.borderTopColor === cs.borderRightColor ? cs.color : null;
		} catch (e) {
			console.warn("hccss: exception detecting high-contrast mode, document is likely hidden: " + e.toString());
			return null;
		} finally {
			document.body.removeChild(div);
		}
	});

	if (has("highcontrast")) {
		document.body.className = (document.body.className + " d-hc").trim();
	}

	return has;
});
