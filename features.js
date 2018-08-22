define(["requirejs-dplugins/has"], function (has) {
	// Flag for whether to create background iframe behind popups like Menus and Dialog.
	// A background iframe is useful to prevent problems with popups appearing behind applets/pdf files.
	has.add("config-bgIframe", false);

	// Flag to enable advanced bidi support
	has.add("bidi", false);

	// Flag to enable inheritance direction from any ancestor
	has.add("inherited-dir", false);

	if (typeof window !== "undefined") {
		// Returns the name of the method to test if an element matches a CSS selector.
		has.add("dom-matches", function () {
			var node = document.body;
			if (node.matches) {
				return "matches";
			}
			if (node.webkitMatchesSelector) {
				return "webkitMatchesSelector";
			}
			if (node.mozMatchesSelector) {
				return "mozMatchesSelector";
			}
			if (node.msMatchesSelector) {
				return "msMatchesSelector";
			}
		});
	}

	return has;
});
