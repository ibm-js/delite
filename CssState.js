/** @module delite/CssState */
define([
	"dcl/dcl",
	"requirejs-dplugins/jquery!attributes/classes",	// addClass(), removeClass()
	"./Widget"
], function (dcl, $, Widget) {

	/**
	 * Update the visual state of the widget by setting CSS classes on widget root node
	 * based on widget properties:
	 *
	 * - `this.disabled` --> `d-disabled`
	 * - `this.readOnly` --> `d-readonly`
	 * - `this.selected` --> `d-selected` (ex: currently selected tab)
	 * - `this.checked == true` --> `d-checked` (ex: a checkbox or a ToggleButton in a checked state)
	 * - `this.checked == "mixed"` --> `d-mixed` (half-checked aka indeterminate checkbox)
	 * - `this.state == "Error"` --> `d-error` (ValidationTextBox value is invalid)
	 * - `this.state == "Incomplete"` --> `d-incomplete` (user hasn't finished typing value yet)
	 *
	 * @mixin module:delite/CssState
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** lends module:delite/CssState# */ {

		/**
		 * List of boolean properties to watch.
		 * @member {string[]} module:delite/CssState#booleanCssProps
		 * @default ["disabled", "readOnly", "selected", "focused", "opened"]
		 */
		booleanCssProps: ["disabled", "readOnly", "selected", "opened"],

		refreshRendering: function (oldVals) {
			// Monitoring changes to disabled, readonly, etc. state, and update CSS class of root node
			this.booleanCssProps.forEach(function (name) {
				if (name in oldVals) {
					$(this).toggleClass("d-" + name.toLowerCase(), this[name]);
				}
			}, this);
			if ("checked" in oldVals) {
				$(this).removeClass(oldVals.checked === "mixed" ? "d-mixed" : "d-checked");
				if (this.checked) {
					$(this).addClass(this.checked === "mixed" ? "d-mixed" : "d-checked");
				}
			}
			if ("state" in oldVals) {
				$(this).removeClass("d-" + oldVals.state.toLowerCase()).addClass("d-" + this.state.toLowerCase());
			}
		}
	});
});
