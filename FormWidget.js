/** @module delite/FormWidget */
define([
	"dcl/dcl",
	"dojo/window", // winUtils.scrollIntoView
	"./Widget",
	"./Invalidating"
], function (dcl, winUtils, Widget, Invalidating) {

	/**
	 * Base class for widgets that extend `HTMLElement`, but conceptually correspond
	 * to native HTML elements such as `<checkbox>` or `<button>`,
	 * which can be children of a `<form>` node.
	 *
	 * Note that FormWidget requires that this.focusNode be a sub-node of theAdd widget, rather than the
	 * root node.  This is because of it's processing of `tabIndex`.
	 *
	 * @mixin module:delite/FormWidget
	 * @augments module:delite/Widget
	 * @augments module:delite/Invalidating
	 */
	return dcl([Widget, Invalidating], /** @lends module:delite/FormWidget# */ {

		/**
		 * Name used when submitting form; same as "name" attribute or plain HTML elements.
		 * @member {string} module:delite/FormWidget.name
		 */
		name: "",

		/**
		 * Corresponds to the native HTML `<input>` element's attribute.
		 * @member {string} module:delite/FormWidget.alt
		 */
		alt: "",

		/**
		 * Corresponds to the native HTML `<input>` element's attribute.
		 * @member {string} module:delite/FormWidget.value
		 */
		value: "",

		/**
		 * The order in which fields are traversed when user hits the tab key.
		 * @member {number} module:delite/FormWidget.tabIndex
		 * @default 0
		 */
		tabIndex: 0,

		/**
		 * Concatenated list of node names that can receive focus during tab operations.
		 * @member {string} FormWidget#tabStops
		 * @default "focusNode"
		 */
		tabStops: "focusNode", // should be "" if the widget's only tab stop is the outer root node

		/**
		 * If set to true, the widget will not respond to user input and will not be included in form submission.
		 * @member {boolean} FormWidget#disabled
		 * @default false
		 */
		disabled: false,

		preCreate: function () {
			this.addInvalidatingProperties(
				"disabled",
				"tabStops",
				"tabIndex"
			);
		},

		refreshRendering: dcl.after(function (args) {
			// Handle disabled and tabIndex, across the tabStops and root node.
			// No special processing is needed for tabStops other than just to refresh disable and tabIndex.
			var props = args[0];
			var self = this;
			var tabStops = this.tabStops.split(/[ ,]/);
			if (props.tabStops || props.disabled) {
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
			if (props.tabStops || props.tabIndex || props.disabled) {
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
			return props; // for after advice
		}),

		/**
		 * Returns whether or not this widget is focusable.  Used internally by delite.
		 * @returns {boolean}
		 * @protected
		 */
		isFocusable: function () {
			return !this.disabled && this.focusNode && (getComputedStyle(this).display !== "none");
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
		}
	});
});
