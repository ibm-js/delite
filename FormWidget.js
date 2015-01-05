/** @module delite/FormWidget */
define([
	"dcl/dcl",
	"./Widget"
], function (dcl, Widget) {

	/**
	 * Base class for widgets that extend `HTMLElement`, but conceptually correspond to form elements.
	 *
	 * Most form widgets should extend FormValueWidget rather than extending FormWidget directly, but
	 * FormWidget should be the base class for form widgets that *don't* have an end user settable value,
	 * for example checkboxes and buttons.  Note that clicking a checkbox changes its state (i.e. the value of
	 * its `checked` property), but does not change its `value` property.
	 *
	 * Also note that both this widget and KeyNav define the `focus()` method, so if your widget extends both classes,
	 * take care that the `focus()` method you want takes precedence in the inheritance hierarchy.
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
		 *
		 * For widgets that directly extend FormWidget (ex: checkboxes), the value is set programatically when the
		 * widget is created, and the end user merely changes the widget's state, i.e. the `checked` property.
		 *
		 * For widgets that extend FormValueWidget, the end user can interactively change the `value` property via
		 * mouse, keyboard, touch, etc.
		 *
		 * @member {string}
		 */
		value: "",

		/**
		 * The order in which fields are traversed when user presses the tab key.
		 * @member {number}
		 * @default 0
		 */
		tabIndex: 0,

		/**
		 * Comma separated list of tabbable nodes, i.e. comma separated list of widget properties that reference
		 * the widget DOM nodes that receive focus during tab operations.
		 *
		 * Aria roles are applied to these nodes rather than the widget root node.
		 *
		 * Note that FormWidget requires that all of the tabbable nodes be sub-nodes of the widget, rather than the
		 * root node.  This is because of its processing of `tabIndex`.
		 *
		 * @member {string}
		 * @default "focusNode"
		 */
		tabStops: "focusNode",

		/**
		 * If set to true, the widget will not respond to user input and will not be included in form submission.
		 * FormWidget automatically updates `valueNode`'s and `focusNode`'s `disabled` property to match the widget's
		 * `disabled` property.
		 * @member {boolean}
		 * @default false
		 */
		disabled: false,

		/**
		 * For widgets with a single tab stop, the Element within the widget, often an `<input>`,
		 * that gets the focus.  Widgets with multiple tab stops, such as a range slider, should set `tabStops`
		 * rather than setting `focusNode`.
		 *
		 * @member {HTMLElement} module:delite/FormWidget#focusNode
		 * @protected
		 */

		postRender: function () {
			this.notifyCurrentValue("tabStops");
		},

		/**
		 * A form element, typically an `<input>`, embedded within the widget, and likely hidden.
		 * It is used to represent the widget's state/value during form submission.
		 *
		 * Subclasses of FormWidget like checkboxes and radios should update `valueNode`'s `checked` property.
		 *
		 * @member {HTMLElement} module:delite/FormWidget#valueNode
		 * @protected
		 * @default undefined
		 */

		refreshRendering: function (oldValues) {
			// Handle disabled and tabIndex, across the tabStops and root node.
			// No special processing is needed for tabStops other than just to refresh disabled and tabIndex.

			// If the tab stops have changed then start by removing the tabIndex from all the old tab stops.
			if ("tabStops" in oldValues) {
				oldValues.tabStops.split(/, */).forEach(function (nodeName) {
					var node = this[nodeName];
					node.tabIndex = "-1";				// backup plan in case next line of code ineffective
					node.removeAttribute("tabindex");	// works for <div> etc. but not <input>
				}, this);
			}

			// Set tabIndex etc. for all tabbable nodes.
			// To keep things simple, if anything has changed then reapply all the properties.
			if ("tabStops" in oldValues || "tabIndex" in oldValues || "disabled" in oldValues || "alt" in oldValues) {
				this.forEachFocusNode(function (node) {
					node.disabled = this.disabled;
					if (this.disabled) {
						node.tabIndex = "-1";				// backup plan in case next line of code ineffective
						node.removeAttribute("tabindex");	// works for <div> etc. but not <input>
					} else {
						node.tabIndex = this._get("tabIndex");
					}
					node.alt = this.alt;
					node.setAttribute("aria-disabled", "" + this.disabled);	// let JAWS know
				});
			}

			// Set properties on valueNode.
			var valueNode = this.valueNode !== this && this.valueNode;
			if (valueNode) {
				if ("value" in oldValues) {
					valueNode.value = this.value;
				}
				if ("disabled" in oldValues) {
					valueNode.disabled = this.disabled; // prevent submit
				}
				if ("name" in oldValues) {
					valueNode.name = this.name;
				}
			}
		},

		/**
		 * Put focus on this widget.
		 */
		focus: function () {
			var focusNode = this.firstFocusNode();
			if (!this.disabled && focusNode.focus) {
				try {
					focusNode.focus();
				} catch (e) {
					// squelch errors from hidden nodes
				}
			}
		},

		/**
		 * Helper method to get the first focusable node, usually `this.focusNode`.
		 *
		 * @protected
		 */
		firstFocusNode: function () {
			return this[this.tabStops.split(/, */)[0]];
		},

		/**
		 * Helper method to execute callback for each focusable node in the widget.
		 * Typically the callback is just called once, for `this.focusNode`.
		 * @param {Function} callback - The callback function.
		 * @protected
		 */
		forEachFocusNode: function (callback) {
			this.tabStops.split(/, */).map(function (nodeName) {
				var node = this[nodeName];
				if (node !== this) {	// guard against hard to debug infinite recursion
					callback.call(this, node);
				}
			}, this);
		},

		////////////////////////////////////////////////////////////////////////////////////////////
		// Override setAttribute() etc. to put aria-label etc. onto the focus node rather than the root
		// node, so that screen readers work properly.

		setAttribute: dcl.superCall(function (sup) {
			return function (name, value) {
				if (/^aria-/.test(name)) {
					this.forEachFocusNode(function (node) {
						node.setAttribute(name, value);
					});
				} else {
					sup.call(this, name, value);
				}
			};
		}),

		getAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					return this.firstFocusNode().getAttribute(name);
				} else {
					return sup.call(this, name);
				}
			};
		}),

		hasAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					return this.firstFocusNode().hasAttribute(name);
				} else {
					return sup.call(this, name);
				}
			};
		}),

		removeAttribute: dcl.superCall(function (sup) {
			return function (name) {
				if (/^aria-/.test(name)) {
					this.forEachFocusNode(function (node) {
						node.removeAttribute(name);
					});
				} else {
					sup.call(this, name);
				}
			};
		}),

		createdCallback: function () {
			// Move all initially specified aria- attributes to focus node(s).
			var attr, idx = 0;
			while ((attr = this.attributes[idx++])) {
				if (/^aria-/.test(attr.name)) {
					this.setAttribute(attr.name, attr.value);

					// force remove from root node not focus nodes
					HTMLElement.prototype.removeAttribute.call(this, attr.name);
				}
			}
		}
	});
});
