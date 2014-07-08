/** @module delite/FormValueWidget */
define([
	"dcl/dcl",
	"./FormWidget"
], function (dcl, FormWidget) {

	/**
	 * Mixin for widgets corresponding to native HTML elements such as `<input>` or `<select>`
	 * that have user changeable values.
	 *
	 * Each FormValueWidget represents a single input value, and has a (possibly hidden) `<input>` element,
	 * to which it serializes its input value, so that form submission works as expected.
	 *
	 * The subclass should call `_handleOnChange()` to make the widget fire onchange events as the value changes.
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

		preCreate: function () {
			this.addInvalidatingProperties(
				"readOnly"
			);
		},

		refreshRendering: dcl.after(function (args) {
			var props = args[0];
			if (props.readOnly) {
				var isReadOnly = this.readOnly;
				if (this.valueNode && this.valueNode !== this) {
					this.valueNode.readOnly = isReadOnly; // inform screen reader
				}
				if (!isReadOnly) {
					this.removeAttribute("readonly");
				}
			}
		}),

		/**
		 * The last value fired to onChange.
		 * @member {*} previousOnChangeValue
		 * @private
		 */
		previousOnChangeValue: undefined,

		/**
		 * The last value fired to onInput.
		 * @member {*} previousOnInputValue
		 * @private
		 */
		previousOnInputValue: undefined,

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

		/**
		 * Set value and fire a change event if the value changed since the last call.
		 * @param {*} newValue - The new value.
		 * @private
		 */
		_handleOnChange: function (newValue) {
			if ((typeof newValue !== typeof this.previousOnChangeValue) ||
				(this.compare(newValue, this.previousOnChangeValue) !== 0)) {
				this.value = newValue;
				// force validation to make sure value is in sync when event handlers are called
				this.validateProperties();
				this.previousOnChangeValue = newValue;
				if (this._onChangeHandle) {
					this._onChangeHandle.remove();
				}
				// defer allows hidden value processing to run and
				// also the onChange handler can safely adjust focus, etc
				this._onChangeHandle = this.defer(
					function () {
						this._onChangeHandle = null;
						this.emit("change");
					}
				); // try to collapse multiple onChange's fired faster than can be processed
			}
		},

		/**
		 * Set value and fire an input event if the value changed since the last call.
		 * @param {*} newValue - The new value.
		 * @private
		 */
		_handleOnInput: function (newValue) {
			if ((typeof newValue !== typeof this.previousOnInputValue) ||
				(this.compare(newValue, this.previousOnInputValue) !== 0)) {
				this.value = newValue;
				// force validation to make sure value is in sync when event handlers are called
				this.validateProperties();
				this.previousOnInputValue = newValue;
				if (this._onInputHandle) {
					this._onInputHandle.remove();
				}
				this._onInputHandle = this.defer(
					function () {
						this._onInputHandle = null;
						this.emit("input");
					}
				);
			}
		}
	});
});
