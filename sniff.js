/**
 * This module sets has() flags based on the current browser:
 *
 * - `has("webkit")`, `has("chrome")`, `has("safari")`
 * - `has("mozilla")`, `has("ff")`
 * - `has("ie")`
 * - `has("ios")`
 * - `has("android")`
 *
 * It returns the `has()` function.
 * @module delite/sniff
 */
define(["dojo/has"], function (has) {
	/* jshint maxcomplexity:20 */

	if (has("host-browser")) {
		var n = navigator,
			dua = n.userAgent,
			dav = n.appVersion,
			tv = parseFloat(dav);

		var isWebkit = parseFloat(dua.split("WebKit/")[1]) || undefined;
		if (isWebkit) {
			has.add("webkit", parseFloat(dua.split("WebKit/")[1]) || undefined);
			has.add("chrome", parseFloat(dua.split("Chrome/")[1]) || undefined);
			has.add("safari", dav.indexOf("Safari") >= 0 && !has("chrome") ?
				parseFloat(dav.split("Version/")[1]) : undefined);
			if (dua.match(/(iPhone|iPod|iPad)/)) {
				var p = RegExp.$1.replace(/P/, "p");
				var v = dua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
				var os = parseFloat(v.replace(/_/, ".").replace(/_/g, ""));
				has.add(p, os);		// "iphone", "ipad" or "ipod"
				has.add("ios", os);
			}
			has.add("android", parseFloat(dua.split("Android ")[1]) || undefined);
		} else {
			var isIE = 0;
			if (document.all) {
				// IE < 11
				isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
			} else if (dav.indexOf("Trident")) {
				// IE >= 9
				isIE = parseFloat(dav.split("rv:")[1]) || undefined;
			}
			if (isIE) {
				// In cases where the page has an HTTP header or META tag with
				// X-UA-Compatible, then it is in emulation mode.
				// Make sure isIE reflects the desired version.
				// Only switch the value if documentMode's major version
				// is different from isIE's major version.
				var mode = document.documentMode;
				if (mode && Math.floor(isIE) !== mode) {
					isIE = mode;
				}

				has.add("ie", isIE);
			} else if (dua.indexOf("Gecko") >= 0) {
				// Mozilla and firefox
				has.add("mozilla", tv);
				// We really need to get away from this. Consider a sane isGecko approach for the future.
				has.add("ff", parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1]) || undefined);
			}
		}

		has.add("mac", dav.indexOf("Macintosh") >= 0);

		has.add("msapp", parseFloat(dua.split("MSAppHost/")[1]) || undefined);
	}

	return has;
});
