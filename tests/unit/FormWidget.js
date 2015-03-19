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
			container = document.createElement("div");
			document.body.appendChild(container);
		},
		
		"single focusNode": {
			setup: function () {
				FormWidgetTest = register("form-widget-test", [HTMLElement, FormWidget], {
					render: function () {
						this.focusNode = this.ownerDocument.createElement("input");
						this.appendChild(this.focusNode);
						this.valueNode = this.ownerDocument.createElement("input");
						this.valueNode.type = "hidden";
						this.appendChild(this.valueNode);
					}
				});
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

			"#disabled": function () {
				var myWidget = new FormWidgetTest();

				myWidget.disabled = true;
				myWidget.deliver();
				assert(myWidget.valueNode.disabled, "disabled set on valueNode");
				assert(myWidget.focusNode.disabled, "disabled set on focusNode");

				myWidget.disabled = false;
				myWidget.deliver();
				assert.isFalse(myWidget.valueNode.disabled, "disabled not set on valueNode");
				assert.isFalse(myWidget.focusNode.disabled, "disabled not set on focusNode");
			},

			"#tabIndex": function () {
				// When !has("setter-on-native-prop"), tabIndex changes reported asynchronously even if you call
				// this.deliver().  See code in CustomElement.js.
				var d = this.async(1000);

				// default tabIndex
				var myWidget = new FormWidgetTest();
				setTimeout(d.rejectOnError(function () {
					assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "0", "default tabIndex");
					assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
						"no tabIndex on root 1");

					// specify initial tabIndex
					myWidget = new FormWidgetTest({
						tabIndex: "3"
					});
					setTimeout(d.rejectOnError(function () {
						assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "3", "specified tabIndex");
						assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
							"no tabIndex on root 2");

						// Change tabIndex.
						myWidget.tabIndex = 4;
						setTimeout(d.callback(function () {
							assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "4", "changed tabIndex");
							assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
								"no tabIndex on root 3");
						}), 10);
					}), 10);
				}), 10);
			},

			"#alt": function () {
				var myWidget = new FormWidgetTest({
					alt: "hello world"
				});
				assert.strictEqual(myWidget.focusNode.getAttribute("alt"), "hello world");
			},

			"#name": function () {
				var myWidget = new FormWidgetTest({
					name: "bob"
				});
				assert.strictEqual(myWidget.valueNode.getAttribute("name"), "bob");
			}
		},

		"multiple tab stops": {
			setup: function () {
				FormWidgetTest = register("form-widget-test-2", [HTMLElement, FormWidget], {
					tabStops: "field1, field2",
					render: function () {
						// Widget has four fields.  Initially field1 and field2 are focusable.
						this.field1 = this.ownerDocument.createElement("span");
						this.field1.textContent = "1";
						this.appendChild(this.field1);

						this.field2 = this.ownerDocument.createElement("span");
						this.field1.textContent = "2";
						this.appendChild(this.field2);

						this.field3 = this.ownerDocument.createElement("span");
						this.field3.textContent = "3";
						this.appendChild(this.field3);

						this.field4 = this.ownerDocument.createElement("span");
						this.field4.textContent = "4";
						this.appendChild(this.field4);

						this.valueNode = this.ownerDocument.createElement("input");
						this.valueNode.type = "hidden";
						this.appendChild(this.valueNode);
					}
				});
			},

			basic: function () {
				// Create a widget declaratively to test initial aria attributes processed
				container.innerHTML = "<form-widget-test-2 aria-label='test label' foo='bar'></form-widget-test>";
				register.parse(container);

				var myWidget = container.firstChild;

				// tabIndex
				assert.strictEqual(myWidget.field1.getAttribute("tabindex"), "0", "field1 default tabIndex");
				assert.strictEqual(myWidget.field2.getAttribute("tabindex"), "0", "field2 default tabIndex");
				assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"), "no tabIndex on root 1");

				// Check that aria-label was moved
				assert.strictEqual(myWidget.attributes.length, 1, "aria-label removed from root");
				assert.strictEqual(myWidget.field1.getAttribute("aria-label"), "test label",
					"aria-label added to field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-label"), "test label",
					"aria-label added to field2");

				// Test that setAttribute(), removeAttribute(), hasAttribute(), and getAttribute() all redirect to the
				// focus nodes when appropriate
				assert(myWidget.hasAttribute("foo"), "hasAttribute(foo)");
				assert(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");
				assert(myWidget.field1.hasAttribute("aria-label"), "field1 hasAttribute(aria-label)");
				assert(myWidget.field2.hasAttribute("aria-label"), "field2 hasAttribute(aria-label)");
				assert.isFalse(myWidget.hasAttribute("bar"), "hasAttribute(bar)");

				assert.strictEqual(myWidget.getAttribute("foo"), "bar", "getAttribute(foo)");
				assert.strictEqual(myWidget.getAttribute("aria-label"), "test label", "getAttribute(aria-label)");

				myWidget.removeAttribute("foo");
				assert.isFalse(myWidget.hasAttribute("foo"), "foo removed");
				myWidget.removeAttribute("aria-label");
				assert.isFalse(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");
				assert.isFalse(myWidget.field1.hasAttribute("aria-label"), "field1 hasAttribute(aria-label)");
				assert.isFalse(myWidget.field2.hasAttribute("aria-label"), "field2 hasAttribute(aria-label)");

				myWidget.setAttribute("foo", "bar 2");
				myWidget.setAttribute("aria-label", "label 2");
				assert.strictEqual(myWidget.attributes.length, 1, "root has foo but not aria-label");
				assert.strictEqual(myWidget.field1.getAttribute("aria-label"), "label 2",
					"aria-label added to field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-label"), "label 2",
					"aria-label added to field2");

				// disabled
				myWidget = new FormWidgetTest();

				myWidget.disabled = true;
				myWidget.deliver();
				assert(myWidget.valueNode.disabled, "disabled set on valueNode");
				assert(myWidget.field1.disabled, "disabled set on field1");
				assert(myWidget.field2.disabled, "disabled set on field2");

				myWidget.disabled = false;
				myWidget.deliver();
				assert.isFalse(myWidget.valueNode.disabled, "disabled not set on valueNode");
				assert.isFalse(myWidget.field1.disabled, "disabled not set on field1");
				assert.isFalse(myWidget.field2.disabled, "disabled not set on field2");

			},
			
			"change #tabStops": function () {
				var myWidget = new FormWidgetTest();
				myWidget.tabStops = "field3, field4";
				myWidget.deliver();
				assert.isFalse(myWidget.field1.hasAttribute("tabindex"), "field1 tabIndex removed");
				assert.isFalse(myWidget.field2.hasAttribute("tabindex"), "field2 tabIndex removed");
				assert.strictEqual(myWidget.field3.tabIndex, 0, "field3 tabIndex");
				assert.strictEqual(myWidget.field4.getAttribute("tabindex"), "0", "field4 tabIndex");
			}
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});