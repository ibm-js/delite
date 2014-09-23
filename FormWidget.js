/** @module delite/FormWidget */
define([
	"dcl/dcl",
	"./Widget"
], function (dcl, Widget) {

	/**
	 * Base class for widgets that extend `HTMLElement`, but conceptually correspond
	 * to native HTML elements such as `<checkbox>` or `<button>`,
	 * which can be children of a `<form>` node.
	 *
	 * Note that FormWidget requires that `this.focusNode` be a sub-node of the widget, rather than the
	 * root node.  This is because of its processing of `tabIndex`.
	 *
	 * @mixin module:delite/FormWidget
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/FormWidget# */ {
		/**
		 * Name used when submitting form; same as "name" attribute or plain HTML elements.
		 * @member {string}
		 */
		name: "",

		/**
		 * Corresponds to the native HTML `<input>` element's attribute.
		 * @member {string}
		 */
		alt: "",

		/**
		 * Corresponds to the native HTML `<input>` element's attribute.
		 * @member {string}
		 */
		value: "",

		/**
		 * The order in which fields are traversed when user hits the tab key.
		 * @member {number}
		 * @default 0
		 */
		tabIndex: 0,

		/**
		 * Comma separated list of tabbable nodes, i.e. comma separated list of widget properties that reference
		 * the widget DOM nodes that receive focus during tab operations.
		 * @member {string}
		 * @default "focusNode"
		 */
		tabStops: "focusNode",

		/**
		 * If set to true, the widget will not respond to user input and will not be included in form submission.
		 * @member {boolean}
		 * @default false
		 */
		disabled: false,

		refreshRendering: function (oldValues) {
			// Handle disabled and tabIndex, across the tabStops and root node.
			// No special processing is needed for tabStops other than just to refresh disable and tabIndex.
			var self = this;
			var tabStops = this.tabStops.split(/[ ,]/);
			if ("tabStops" in oldValues || "disabled" in oldValues) {
				var isDisabled = this.disabled;
				if (this.valueNode && this.valueNode !== this) {
					this.valueNode.disabled = isDisabled; // prevent submit
				}
				tabStops.forEach(
					function (nodeName) {
						var node = self[nodeName];
						if (node !== self) {
							node.disabled = isDisabled;
						}
						// let JAWS know
						node.setAttribute("aria-disabled", "" + isDisabled);
					},
					this
				);
				if (!isDisabled) {
					this.removeAttribute("disabled");
				}
			}
			if ("tabStops" in oldValues || "tabIndex" in oldValues || "disabled" in oldValues) {
				tabStops.forEach(
					function (nodeName) {
						var node = self[nodeName];
						if (node !== self) {
							if (self.disabled) {
								node.removeAttribute("tabindex");
							} else {
								node.tabIndex = self._get("tabIndex");
							}
						}
					},
					this
				);
			}
			return oldValues; // for after advice
		},

		/**
		 * Put focus on this widget.
		 */
		focus: function () {
			if (!this.disabled && this.focusNode.focus) {
				try {
					this.focusNode.focus();
				} catch (e) {
					// squelch errors from hidden nodes
				}
			}
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// Override setAttribute() etc. to put aria-label etc. onto the focus node rather than the root
		// node, so that screen readers work properly.
		setAttribute: dcl.superCall(function (sup) {
			return function (name, value) {
				if (/^aria-/.test(name)) {
					this.focusNode.setAttribute(name, value);
				} else {
					sup.call(this, name, value);
				}
			};
		}),

		getAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					return this.focusNode.getAttribute(name);
				} else {
					return sup.call(this, name);
				}
			};
		}),

		hasAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					return this.focusNode.hasAttribute(name);
				} else {
					return sup.call(this, name);
				}
			};
		}),

		removeAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					this.focusNode.removeAttribute(name);
				} else {
					sup.call(this, name);
				}
			};
		}),

		createdCallback: function () {
			// Move all initially specified aria- attributes to focus node.
			var attr, idx = 0;
			while ((attr = this.attributes[idx++])) {
				if (/^aria-/.test(attr.name)) {
					this.setAttribute(attr.name, attr.value);

					// force remove from root node not this.focusNode
					HTMLElement.prototype.removeAttribute.call(this, attr.name);
				}
			}
		}
	});
});
