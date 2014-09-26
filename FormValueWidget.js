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
	 * Mixin for widgets corresponding to native HTML elements such as `<input>` or `<select>`
	 * that have user changeable values.
	 *
	 * Each FormValueWidget represents a single input value, and has a (possibly hidden) `<input>` element,
	 * to which it serializes its input value, so that form submission works as expected.
	 *
	 * The subclass should call `handleOnChange()` and `handleOnInput()` to make the widget fire `change` and
	 * `input`events as the value changes.
	 *
	 * @mixin module:delite/FormValueWidget
	 * @augments module:delite/FormWidget
	 */
	return dcl(FormWidget, /** @lends module:delite/FormValueWidget# */{
		/**
		 * If true, this widget won't respond to user input.
		 * Similar to disabled except readOnly form values are submitted.
		 * @member {boolean}
		 * @default false
		 */
		readOnly: false,

		refreshRendering: function (oldValues) {
			if ("readOnly" in oldValues) {
				var isReadOnly = this.readOnly;
				if (this.valueNode && this.valueNode !== this) {
					this.valueNode.readOnly = isReadOnly; // inform screen reader
				}
				if (!isReadOnly) {
					this.removeAttribute("readonly");
				}
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

		postRender: function () {
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
		 * Set value and fire a change event if the value changed since the last call.
		 * @param {*} newValue - The new value.
		 * @protected
		 */
		handleOnChange: genHandler("change", "_previousOnChangeValue", "_onChangeHandle"),

		/**
		 * Set value and fire an input event if the value changed since the last call.
		 * @param {*} newValue - The new value.
		 * @protected
		 */
		handleOnInput: genHandler("input", "_previousOnInputValue", "_onInputHandle")
	});
});
