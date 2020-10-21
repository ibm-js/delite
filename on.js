/** @module delite/on */
define([
	"ibm-decor/sniff"
], function (
	has
) {
	// Ignore phantom click events when virtual keyboard is sliding in or out.  Works around VoiceOver bug.
	// This code could also be leveraged to ignore phantom clicks after closing a dropdown.
	// This code fixes all click listeners, even ones created directly, rather than through delite/on.
	// That's arguably bad in principle, but it does make the code work for activationTracker.js which hasn't
	// yet been converted to on delite/on.
	if (has("ios")) {
		var virtualKeyboardShown = false,
			lastVirtualKeyboardToggleTime = 0;

		document.addEventListener("click", function (event) {
			var now = (new Date()).getTime();
			if (now < lastVirtualKeyboardToggleTime + 400) {
				event.stopPropagation();
				event.preventDefault();
				return;
			}

			var node = event.target;
			var tag = node && node.tagName && node.tagName.toLowerCase();
			var newVirtualKeyboardShown = node && !node.readOnly && (tag === "textarea" || (tag === "input" &&
				/^(color|email|number|password|search|tel|text|url)$/.test(node.type)));

			if (virtualKeyboardShown !== newVirtualKeyboardShown) {
				virtualKeyboardShown = newVirtualKeyboardShown;
				lastVirtualKeyboardToggleTime = now;
			}
		}, true);
	}

	/**
	 * Call specified function when event occurs.
	 * @param {Element} [node] - Element to attach handler to.
	 * @param {string} type - Name of event (ex: "click").
	 * @param {Function} callback - Callback function.
	 * @param {boolean} capture - Catch event at capturing phase rather than bubbling phase.
	 * @returns {Object} Handle with `remove()` method to cancel the listener.
	 */
	var on = function (node, type, callback, capture) {
		if (capture === undefined) {
			capture = false;
		}

		// Shim support for focusin/focusout where necessary.
		// Don't shim on IE since IE supports focusin/focusout natively, and conversely
		// focus and blur events have a problem that relatedTarget isn't set.
		var captures = "onfocusin" in node ? {} : { focusin: "focus", focusout: "blur" };
		if (type in captures) {
			type = captures[type];
			capture = true;
		}

		// Shim support for Event.key, and fix some wrong/outdated KeyboardEvent.key values
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
