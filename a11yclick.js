/**
  * @module delite/a11yclick
 */
define([
	"./on"
], function (on) {

	// TODO: add functional tests

	function clickKey(/*Event*/ e) {
		// Test if this keyboard event should be tracked as the start (if keydown) or end (if keyup) of a click event.
		// Only track for nodes marked to be tracked, and not for buttons or inputs,
		// since buttons handle keyboard click natively, and text inputs should not
		// prevent typing spaces or newlines.
		if ((e.key === "Enter" || e.key === "Spacebar") &&
				!/^(input|button|textarea)$/i.test(e.target.nodeName)) {

			// Test if a node or its ancestor has been marked with the d-keyboard-click property
			// to indicate special processing
			for (var node = e.target; node; node = node.parentNode) {
				if (node.hasAttribute && node.hasAttribute("d-keyboard-click")) {
					return true;
				}
			}
		}
	}

	var lastKeyDownNode;

	on(document, "keydown", function (e) {
		//console.log("a11yclick: onkeydown, e.target = ", e.target, ", lastKeyDownNode was ",
		// lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if (!e.defaultPrevented && clickKey(e)) {
			// needed on IE for when focus changes between keydown and keyup - otherwise dropdown menus do not work
			lastKeyDownNode = e.target;

			// prevent scroll
			e.preventDefault();
		} else {
			lastKeyDownNode = null;
		}
	});

	on(document, "keyup", function (e) {
		//console.log("a11yclick: onkeyup, e.target = ", e.target, ", lastKeyDownNode was ",
		// lastKeyDownNode, ", equality is ", (e.target === lastKeyDownNode));
		if (clickKey(e) && e.target === lastKeyDownNode) {
			// need reset here or have problems in FF when focus returns to trigger element after closing popup/alert
			lastKeyDownNode = null;

			// prevent scroll
			e.preventDefault();

			var doc = e.target.ownerDocument,
				clickEvent = doc.createEvent("MouseEvents");

			clickEvent.initMouseEvent(
				"click",
				true,
				true,
				doc.defaultView,
				0,
				0,
				0,
				0,
				0,
				e.ctrlKey,
				e.altKey,
				e.shiftKey,
				e.metaKey,
				0,
				doc.body	// relatedTarget, for mouseout events
			);
			e.target.dispatchEvent(clickEvent);
		}
	});

	/**
	 * When this module is loaded, pressing SPACE or ENTER while focused on an Element with a `d-keyboard-click`
	 * attribute will fire a synthetic click event on that Element. Also works if the event target's ancestor
	 * has that attribute set.
	 *
	 * Usually this functionality is not necessary.  Rather, you should just make the focused Element a `<button>`,
	 * and then the browser does the same thing natively.
	 * This module is usually only needed when a custom element itself (ex: `<d-my-checkbox>`)
	 * gets the focus rather than an Element inside of a custom element.
	 *
	 * Returns a convenience function to set `d-keyboard-click` on an Element.
	 * @param {Element} node - Element that can be "clicked" via SPACE/ENTER key (when focused).
	 * @function module:delite/a11yclick
	 */
	return function (node) {
		node.setAttribute("d-keyboard-click", "true");
	};
});
