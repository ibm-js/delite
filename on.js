/** @module delite/on */
define(function () {
	/**
	 * Call specified function when event occurs.
	 * @param {Element} [node] - Element to attach handler to.
	 * @param {string} type - Name of event (ex: "click").
	 * @param {Function} callback - Callback function.
	 * @returns {Object} Handle with `remove()` method to cancel the listener.
	 */
	return function (node, type, callback) {
		var capture = false;

		// Shim support for focusin/focusout.
		var captures = { focusin: "focus", focusout: "blur" };
		if (type in captures) {
			type = captures[type];
			capture = true;
		}

		// Shim support for Event.key, and fix some wrong/outdated Event.key values
		if (/^key(down|press|up)$/.test(type)) {
			var origFunc = callback;
			callback = function (event) {
				var key = event.key || event.keyIdentifier || String.fromCharCode(event.charCode);

				var fixedKey = {
					// mappings for event.keyIdentifier differences from event.key for special keys
					"U+0020": "Spacebar",
					"U+0008": "Backspace",
					"U+0009": "Tab",
					"U+001B": "Escape",

					// fix for FF 34
					" ": "Spacebar",

					// fix for old key names, see https://www.w3.org/Bugs/Public/show_bug.cgi?id=22084
					"Apps": "ContextMenu",
					"Left": "ArrowLeft",
					"Down": "ArrowDown",
					"Right": "ArrowRight",
					"Up": "ArrowUp",
					"Del": "Delete",
					"Esc": "Escape",

					// fix for Android 4.2
					"U+00007F": "Backspace"
				}[key] || key.replace(/^U\+0*(.*)$/, function (all, hexString) {
					// fix event.keyIdentifier for normal printable characters, ex: "U+0041" --> "A" or "a"
					var code = parseInt(hexString, 16);
					if (code >= 65 && code <= 90 && !event.shiftKey) {
						code += 32;	// uppercase --> lowercase
					}
					return String.fromCharCode(code);
				});

				if (event.key !== fixedKey) {
					// A simple "event.key = fixedKey" doesn't work on FF31 (for " " --> "Spacebar" conversion).
					// And Object.defineProperty(event, "key", {value: fixedKey}); (for "Down" --> "ArrowDown")
					// doesn't work on IE.
					Object.defineProperty(event, "key", {get: function () { return fixedKey; }});
				}

				origFunc(event);
			};
		}

		node.addEventListener(type, callback, capture);

		return {
			remove: function () {
				node.removeEventListener(type, callback, capture);
			}
		};
	};
});