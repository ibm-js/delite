/**
 * Applies pre-set CSS classes to the top-level HTML node, based on:
 * 
 * - browser: `d-webkit`, `d-safari`, `d-chrome`, `d-ff`, `d-edge`, `d-ie`, `d-ios`, `d-android`
 * - browser version (ex: `d-ie-9`, `d-ff-26`)
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
			"d-edge": has("edge"),
			"d-webkit": has("webkit"),
			"d-safari": has("safari"),
			"d-chrome": has("chrome"),

			"d-ios": has("ios"),
			"d-android": has("android"),
			"d-mac": has("mac")
		};

	if (ie) {
		classes["d-ie"] = true;
		classes["d-ie-" + maj(ie)] = true;
	}
	if (ff) {
		classes["d-ff"] = true;
		classes["d-ff-" + maj(ff)] = true;
	}

	// Apply browser and browser version class names.
	var classStr = "";
	for (var clz in classes) {
		if (classes[clz]) {
			classStr += clz + " ";
		}
	}
	document.body.className = (document.body.className + " " + classStr).trim();

	return has;
});
