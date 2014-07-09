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
	 * The subclass should call `_handleOnChange()` and `_handleOnInput()` to make the widget fire `change` and
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
			this._handleUserInput(newValue, "change");
		},

		/**
		 * Set value and fire an input event if the value changed since the last call.
		 * @param {*} newValue - The new value.
		 * @private
		 */
		_handleOnInput: function (newValue) {
			this._handleUserInput(newValue, "input");
		},

		_userInputVarName: {
			"change": {
				name: "change",
				previousValue: "_previousOnChangeValue",
				deferHandle: "_onChangeHandle"
			},
			"input": {
				name: "input",
				previousValue: "_previousOnInputValue",
				deferHandle: "_onInputHandle"
			}
		},

		/**
		 * Set value and fire an event (change or input) if the value changed since the last call.
		 * Widget should use `_handleOnChange()` or `_handleOnInput()`.
		 * @param {*} newValue - The new value.
		 * @param {string} type - The event type. Can be "change" or "input".
		 * @private
		 */
		_handleUserInput: function (newValue, type) {
			var variableName = this._userInputVarName[type].previousValue;
			if ((typeof newValue !== typeof this[variableName]) ||
				(this.compare(newValue, this[variableName]) !== 0)) {
				this[variableName] = this.value = newValue;
				variableName = this._userInputVarName[type].deferHandle;
				if (this[variableName]) {
					this[variableName].remove();
				}
				// defer allows hidden value processing to run and
				// also the onChange handler can safely adjust focus, etc
				this[variableName] = this.defer(
					function () {
						this[variableName] = null;
						// force validation to make sure rendering is in sync when event handlers are called
						this.validateProperties();
						this.emit(this._userInputVarName[type].name);
					}
				);
			}
		},

		startup: dcl.after(function () {
			// initialize previous values (avoids firing unnecessary change/input event
			// if user just select and release the Slider handle for example)
			this[this._userInputVarName.change.previousValue] = this.value;
			this[this._userInputVarName.input.previousValue] = this.value;
		})
	});
});