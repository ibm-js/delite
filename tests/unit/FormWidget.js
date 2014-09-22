define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/FormWidget"
], function (registerSuite, assert, register, FormWidget) {
	var container, FormWidgetTest;

	registerSuite({
		name: "FormWidget",

		setup: function () {
			FormWidgetTest = register("form-widget-test", [HTMLElement, FormWidget], {
				render: function () {
					this.focusNode = this.ownerDocument.createElement("input");
					this.appendChild(this.focusNode);
				}
			});
		},

		beforeEach: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// Test that aria attributes are moved to the focus node
		aria: function () {
			// Create a widget declaratively to test initial aria attributes processed
			container.innerHTML = "<form-widget-test aria-label='test label' foo='bar'></form-widget-test>";
			register.parse(container);

			var myWidget = container.firstChild;

			// Check that aria-label was moved
			assert.strictEqual(myWidget.attributes.length, 1, "aria-label removed from root");
			assert.strictEqual(myWidget.focusNode.getAttribute("aria-label"), "test label",
				"aria-label added to focusNode");
			

			// Test that setAttribute(), removeAttribute(), hasAttribute(), and getAttribute() all redirect to the
			// focus node when appropriate
			assert(myWidget.hasAttribute("foo"), "hasAttribute(foo)");
			assert(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");
			assert.isFalse(myWidget.hasAttribute("bar"), "hasAttribute(bar)");

			assert.strictEqual(myWidget.getAttribute("foo"), "bar", "getAttribute(foo)");
			assert.strictEqual(myWidget.getAttribute("aria-label"), "test label", "getAttribute(aria-label)");

			myWidget.removeAttribute("foo");
			assert.isFalse(myWidget.hasAttribute("foo"), "foo removed");
			myWidget.removeAttribute("aria-label");
			assert.isFalse(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");

			myWidget.setAttribute("foo", "bar 2");
			myWidget.setAttribute("aria-label", "label 2");
			assert.strictEqual(myWidget.attributes.length, 1, "root has foo but not aria-label");
			assert.strictEqual(myWidget.focusNode.getAttribute("aria-label"), "label 2",
				"aria-label added to focusNode");
		},

		afterEach: function () {
			container.parentNode.removeChild(container);
		}
	});
});