define([
	"dcl/dcl",
	"dojo/dom-class", // domClass.toggle
	"./Widget"
], function (dcl, domClass, Widget) {

	// module:
	//		delite/CssState

	return dcl(Widget, {
		// summary:
		//		Update the visual state of the widget by setting CSS classes on widget root node
		//		based on widget properties:
		//
		//			- this.disabled --> "d-disabled"
		//			- this.readOnly --> "d-readonly"
		//			- this.selected --> "d-selected" (ex: currently selected tab)
		//			- this.focused --> "d-focused" (widget or a descendant node has focus, or was recently clicked)
		//			- this.checked == true --> "d-checked" (ex: a checkbox or a ToggleButton in a checked state)
		//			- this.checked == "mixed" --> "d-mixed" (half-checked aka indeterminate checkbox)
		//			- this.state == "Error" --> "d-error" (ValidationTextBox value is invalid)
		//			- this.state == "Incomplete" --> "d-incomplete" (user hasn't finished typing value yet)

		// cssProps: String[]
		//		List of boolean properties to watch.
		booleanCssProps: ["disabled", "readOnly", "selected", "focused", "opened"],

		postCreate: function () {
			var toggle = domClass.toggle.bind(domClass, this);

			// Monitoring changes to disabled, readonly, etc. state, and update CSS class of root node
			this.booleanCssProps.forEach(function (name) {
				this.watch(name, function (name, oval, nval) {
					toggle("d-" + name.toLowerCase(), nval);
				});
			}, this);
			this.watch("checked", function (name, oval, nval) {
				toggle(oval === "mixed" ? "d-mixed" : "d-checked", false);
				toggle(nval === "mixed" ? "d-mixed" : "d-checked", nval);
			});
			this.watch("state", function (name, oval, nval) {
				toggle("d-" + oval.toLowerCase(), false);
				toggle("d-" + nval.toLowerCase(), true);
			});
		}
	});
});
