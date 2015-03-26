define(["requirejs-dplugins/has"], function (has) {
	// Flag for whether to create background iframe behind popups like Menus and Dialog.
	// A background iframe is useful to prevent problems with popups appearing behind applets/pdf files.
	has.add("config-bgIframe", false);

	// Returns the name of the method to test if an element matches a CSS selector.
	has.add("dom-matches", function () {
		var node = document.body;
		if (node.matches) { return "matches"; }
		if (node.webkitMatchesSelector) { return "webkitMatchesSelector"; }
		if (node.mozMatchesSelector) { return "mozMatchesSelector"; }
		if (node.msMatchesSelector) { return "msMatchesSelector"; }
	});

	// Does platform have native support for document.registerElement() or a polyfill to simulate it?
	has.add("document-register-element", typeof document !== "undefined" && !!document.registerElement);

	// Test for how to monitor DOM nodes being inserted and removed from the document.
	// For DOMNodeInserted events, there are two variations:
	//		"root" - just notified about the root of each tree added to the document
	//		"all" - notified about all nodes added to the document
	has.add("MutationObserver", window.MutationObserver ? "MutationObserver" : window.WebKitMutationObserver ?
		"WebKitMutationObserver" : "");
	has.add("DOMNodeInserted", function () {
		var root = document.createElement("div"),
			child = document.createElement("div"),
			sawRoot, sawChild;
		root.id = "root";
		child.id = "child";
		function listener(event) {
			if (event.target.id === "root") { sawRoot = true; }
			if (event.target.id === "child") { sawChild = true; }
		}
		document.body.addEventListener("DOMNodeInserted", listener);
		document.body.appendChild(root);
		document.body.removeChild(root);
		document.body.removeEventListener("DOMNodeInserted", listener);
		return sawChild ? "all" : sawRoot ? "root" : "";
	});

	// Can we use __proto__ to reset the prototype of DOMNodes?
	// It's not available on IE<11, and even on IE11 it makes the node's attributes
	// (ex: node.attributes, node.textContent) disappear, so disabling it on IE11 too.
	has.add("dom-proto-set", function () {
		var node = document.createElement("div");
		/* jshint camelcase: false */
		/* jshint proto: true */
		if (!node.__proto__) {
			return false;
		}
		node.__proto__ = {};
		/* jshint camelcase: true */
		/* jshint proto: false */
		return !!node.attributes;
	});

	// Flag to enable advanced bidi support
	has.add("bidi", false);
	
	// Flag to enable inheritance direction from any ancestor
	has.add("inherited-dir", false);

	return has;
});