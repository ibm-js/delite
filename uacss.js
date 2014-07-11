/**
 * Applies pre-set CSS classes to the top-level HTML node, based on:
 * 
 * - browser: `d-webkit`, `d-safari`, `d-chrome`, `d-gecko`, `d-ios`, `d-android`
 * - browser version (ex: `d-ie-9`, `d-ff-26`)
 * - text direction: `d-rtl` (if the document is RTL)
 * 
 * Returns the `has()` method.
 *
 * @module delite/uacss
 */
define(["decor/sniff"], function (has) {
	var ie = has("ie"),
		maj = Math.floor,
		ff = has("ff"),

		classes = {
			"d-webkit": has("webkit"),
			"d-safari": has("safari"),
			"d-chrome": has("chrome"),

			"d-gecko": has("mozilla"),

			"d-ios": has("ios"),
			"d-android": has("android")
		};

	if (ie) {
		classes["d-ie"] = true;
		classes["d-ie-" + maj(ie)] = true;
	}
	if (ff) {
		classes["d-ff-" + maj(ff)] = true;
	}

	// apply browser, browser version, and box model class names
	var classStr = "";
	for (var clz in classes) {
		if (classes[clz]) {
			classStr += clz + " ";
		}
	}
	document.body.className = (document.body.className + " " + classStr).trim();

	return has;
});
