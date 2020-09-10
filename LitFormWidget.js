import dcl from "dcl/dcl";
import LitWidget from "./LitWidget";

/**
 * Base class for lit-html form widgets.
 *
 * Most form widgets should extend LitFormValueWidget rather than extending FormWidget directly, but
 * FormWidget should be the base class for form widgets that *don't* have an end user settable value,
 * for example checkboxes and buttons.  Note that clicking a checkbox changes its state (i.e. the value of
 * its `checked` property), but does not change its `value` property.
 *
 * Also note that both this widget and KeyNav define the `focus()` method, so if your widget extends both classes,
 * take care that the `focus()` method you want takes precedence in the inheritance hierarchy.
 *
 * Subclass is responsible for setting name, alt, disabled, required on the <input>.
 */
export default dcl(LitWidget, {
	declaredClass: "deliteful/LitFormWidget",

	/**
	 * Name used when submitting form; same as "name" attribute on plain HTML elements.
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
	 * If set to true, the widget will not respond to user input and will not be included in form submission.
	 * FormWidget automatically updates `valueNode`'s and `focusNode`'s `disabled` property to match the widget's
	 * `disabled` property.
	 * @member {boolean}
	 * @default false
	 */
	disabled: false,

	/**
	 * Sets the `required` property of the focus nodes, or their `aria-required` attribute if they do not support
	 * the `required` property.
	 * @member {boolean}
	 * @default false
	 */
	required: false,

	focusNode: dcl.prop({
		get: function () {
			return this.querySelector("input");
		}
	}),

	/**
	 * Put focus on this widget.
	 */
	focus: function () {
		if (!this.disabled && this.focusNode) {
			this.focusNode.focus();
		}
	}
});