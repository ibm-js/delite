/** @module delite/FormValueWidget */
define([
	"dcl/dcl",
	"./FormWidget",
	"./activationTracker"
], function (dcl, FormWidget) {

	/**
	 * Returns a method to set a new value and fire an event (change or input) if the value changed since the last
	 * call.  Widget should use `handleOnChange()` or `handleOnInput()`.
	 * @param {string} eventType - The event type. Can be "change" or "input".
	 * @param {string} prevValueProp - The name of the property to hold the previous value.
	 * @param {string} deferHandleProp - The name of the property to hold the defer method that fire the event.
	 * @returns {Function}
	 * @private
	 */
	function genHandler(eventType, prevValueProp, deferHandleProp) {
		// Set value and fire an input event if the value changed since the last call.
		// @param {*} newValue - The new value.
		return function (newValue) {
			this.value = newValue;

			// defer allows debounce, hidden value processing to run, and
			// also the onChange handler can safely adjust focus, etc.
			if (this[deferHandleProp]) {
				this[deferHandleProp].remove();
			}
			this[deferHandleProp] = this.defer(function () {
				delete this[deferHandleProp];
				if (typeof newValue !== typeof this[prevValueProp] ||
					this.compare(newValue, this[prevValueProp]) !== 0) { // ignore if value [eventually] set to orig val
					this[prevValueProp] = newValue;
					this.deliver();			// make sure rendering is in sync when event handlers are called
					this.emit(eventType);
				}
			});
		};
	}

	/**
	 * Base class intended for form widgets that have end user changeable values, i.e.
	 * widgets where the user can interactively change the value property by using the mouse, keyboard, touch, etc.
	 *
	 * FormValueWidget extends FormWidget to:
	 *
	 * 1. Provide helper functions to emit `change` and `input` events when the widget's value is interactively changed
	 *    by the end user.  Subclasses of FormValueWidget should call `handleOnChange()` and
	 *    `handleOnInput()` to fire `change` and `input` events as the value changes.  See
	 *    https://html.spec.whatwg.org/multipage/forms.html#common-input-element-events for details.
	 * 2. Provide handling for the `readOnly` property.
	 *
	 * @mixin module:delite/FormValueWidget
	 * @augments module:delite/FormWidget
	 */
	return dcl(FormWidget, /** @lends module:delite/FormValueWidget# */{
		declaredClass: "delite/FormValueWidget",

		/**
		 * If true, this widget won't respond to user input.  Similar to `disabled` except
		 * `readOnly` form values are submitted.  FormValueWidget automatically updates
		 * `focusNode`'s `readOnly` property to match the widget's `readOnly` property.
		 * @member {boolean}
		 * @default false
		 */
		readOnly: false,

		refreshRendering: function (oldValues) {
			if ("tabStops" in oldValues || "readOnly" in oldValues) {
				this.forEachFocusNode(function (node) {
					node.readOnly = this.readOnly;
				});
			}
		},

		/**
		 * Compare two values (of this widget).
		 * @param {*} val1
		 * @param {*} val2
		 * @returns {number}
		 * @protected
		 */
		compare: function (val1, val2) {
			if (typeof val1 === "number" && typeof val2 === "number") {
				return (isNaN(val1) && isNaN(val2)) ? 0 : val1 - val2;
			} else if (val1 > val2) {
				return 1;
			} else if (val1 < val2) {
				return -1;
			} else {
				return 0;
			}
		},

		constructor: function () {
			this.on("delite-activated", function () {
				// Called when user may be about to start input.
				// Saves the widget's current value, which is the most recent of:
				//
				//	1. the original value set on widget construction
				//	2. the value the user set when he previously used the widget
				//	3. the value the application set programatically
				//
				// This is all to avoid firing unnecessary change/input events in the corner case where the
				// user just selects and releases the Slider handle for example.
				this._previousOnChangeValue = this.value;
				this._previousOnInputValue = this.value;
			});
		},

		/**
		 * Sets value and fires a "change" event if the value changed since the last call.
		 *
		 * This method should be called when the value is committed,
		 * if that makes sense for the control, or else when the control loses focus.
		 * For example, it should be called when the user releases a slider's handle after dragging it,
		 * or when the user blurs a textbox.
		 * See https://html.spec.whatwg.org/multipage/forms.html#common-input-element-events for details.
		 *
		 * @param {*} newValue - The new value.
		 * @function
		 * @protected
		 */
		handleOnChange: genHandler("change", "_previousOnChangeValue", "_onChangeHandle"),

		/**
		 * Sets value and fires an "input" event if the value changed since the last call.
		 *
		 * This method should be called whenever the value is changed interactively by the end user.
		 * For example, it should be called repeatedly as the user drags the handle of a slider,
		 * or on every keystroke for a textbox.
		 * See https://html.spec.whatwg.org/multipage/forms.html#common-input-element-events for details.
		 *
		 * @param {*} newValue - The new value.
		 * @function
		 * @protected
		 */
		handleOnInput: genHandler("input", "_previousOnInputValue", "_onInputHandle"),

		afterFormResetCallback: function () {
			if (this.value !== this.valueNode.value) {
				this.value = this.valueNode.value;
			}
		}
	});
});
