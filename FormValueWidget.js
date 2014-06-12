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
		 * Whether onchange is fired for each value change or only on blur.
		 * @member {boolean}
		 * @default false
		 */
		intermediateChanges: false,

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
		 * Call when the value of the widget is set.  Calls onChange() if appropriate.
		 * @param {*} newValue - The new value.
		 * @param {boolean} [priorityChange] - For a slider, for example, dragging the slider is priorityChange==false,
		 * but on mouse up, it's priorityChange==true.  If intermediateChanges==false,
		 * onChange() is only called form priorityChange=true events.
		 * @private
		 */
		_handleOnChange: function (newValue, priorityChange) {
			this._pendingOnChange = this._pendingOnChange
				|| (typeof newValue !== typeof this.previousOnChangeValue)
				|| (this.compare(newValue, this.previousOnChangeValue) !== 0);
			if ((this.intermediateChanges || priorityChange || priorityChange === undefined) && this._pendingOnChange) {
				this.previousOnChangeValue = newValue;
				this._pendingOnChange = false;
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
		}
	});
});
