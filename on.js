/** @module delite/on */
define(function () {
	/**
	 * Call specified function when event occurs.
	 * @param {Element} [node] - Element to attach handler to.
	 * @param {string} type - Name of event (ex: "click").
	 * @param {Function} callback - Callback function.
	 * @returns {Object} Handle with `remove()` method to cancel the listener.
	 */
	var on = function (node, type, callback) {
		var capture = false;

		// Shim support for focusin/focusout where necessary.
		// Don't shim on IE since IE supports focusin/focusout natively, and conversely
		// focus and blur events have a problem that relatedTarget isn't set.
		var captures = "onfocusin" in node ? {} : { focusin: "focus", focusout: "blur" };
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


	/**
	 * Emits a synthetic event of specified type, based on eventObj.
	 * @param {Element} node - Element to emit event on.
	 * @param {string} type - Name of event.
	 * @param {Object} [eventObj] - Properties to mix in to emitted event.  Can also contain
	 * `bubbles` and `cancelable` properties to control how the event is emitted.
	 * @returns {boolean} True if the event was *not* canceled, false if it was canceled.
	 * @example
	 * myWidget.emit("query-success", {});
	 * @protected
	 */
	on.emit = function (node, type, eventObj) {
		eventObj = eventObj || {};
		var bubbles = "bubbles" in eventObj ? eventObj.bubbles : true;
		var cancelable = "cancelable" in eventObj ? eventObj.cancelable : true;

		// Note: can't use jQuery.trigger() because it doesn't work with addEventListener(),
		// see http://bugs.jquery.com/ticket/11047.
		var nativeEvent = node.ownerDocument.createEvent("HTMLEvents");
		nativeEvent.initEvent(type, bubbles, cancelable);
		for (var i in eventObj) {
			if (!(i in nativeEvent)) {
				nativeEvent[i] = eventObj[i];
			}
		}

		return node.dispatchEvent(nativeEvent);
	};

	return on;
});
