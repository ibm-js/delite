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

				// since valueNode and focusNode are <input>, the disabled property should be set
				assert(myWidget.valueNode.disabled, "disabled set on valueNode");
				assert(myWidget.focusNode.disabled, "disabled set on focusNode");
				assert.isFalse(myWidget.valueNode.hasAttribute("aria-disabled"), "no aria-disabled on valueNode");
				assert.isFalse(myWidget.focusNode.hasAttribute("aria-disabled"), "no aria-disabled on focusNode");

				myWidget.disabled = false;
				myWidget.deliver();
				assert.isFalse(myWidget.valueNode.disabled, "disabled not set on valueNode");
				assert.isFalse(myWidget.focusNode.disabled, "disabled not set on focusNode");
			},

			"#required": function () {
				var myWidget = new FormWidgetTest();

				myWidget.required = true;
				myWidget.deliver();

				// since valueNode and focusNode are <input>, the required property should be set
				assert(myWidget.valueNode.required, "required set on valueNode");
				assert(myWidget.focusNode.required, "required set on focusNode");
				assert.isFalse(myWidget.valueNode.hasAttribute("aria-required"),
					"aria-required on valueNode unnecessarily");
				assert.isFalse(myWidget.focusNode.hasAttribute("aria-required"),
					"aria-required on focusNode unnecessarily");

				myWidget.required = false;
				myWidget.deliver();
				assert.isFalse(myWidget.valueNode.required, "required not set on valueNode");
				assert.isFalse(myWidget.focusNode.required, "required not set on focusNode");
			},

			"#inputID": function () {
				var myWidget = new FormWidgetTest({id : "widget-id"});

				myWidget.deliver();

				// Id should be set for the first tabbable input node.
				assert.strictEqual(myWidget.focusNode.id, "widget-id-input", "Id not set correctly on focus node");
			},

			"#tabIndex": function () {
				// default tabIndex
				var myWidget = new FormWidgetTest();
				assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "0", "default tabIndex");
				assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
					"no tabIndex on root 1");

				// specify initial tabIndex
				myWidget = new FormWidgetTest({
					tabIndex: "3"
				});
				assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "3", "specified tabIndex");
				assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
					"no tabIndex on root 2");

				// Change tabIndex.
				myWidget.tabIndex = 4;
				myWidget.deliver();
				assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "4", "changed tabIndex");
				assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
					"no tabIndex on root 3");
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
					tabStops: ["field1", "field2"],
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

				// In this case we don't move aria-label because the subnodes may already have their own labels.
				assert.strictEqual(myWidget.attributes.length, 2, "aria-label etc. still on root");
			},

			"#disabled": function () {
				var myWidget = new FormWidgetTest();

				myWidget.disabled = true;
				myWidget.deliver();

				// Since field1 and field2 are <span>, the "aria-disabled" attribute should be set,
				// but the "disabled" property should be set on the <input>.
				assert.strictEqual(myWidget.field1.getAttribute("aria-disabled"), "true", "aria-disabled on field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-disabled"), "true", "aria-disabled on field2");
				assert.strictEqual(myWidget.valueNode.disabled, true, "valueNode disabled prop");

				myWidget.disabled = false;
				myWidget.deliver();
				assert.strictEqual(myWidget.field1.getAttribute("aria-disabled"), "false", "aria-disabled on field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-disabled"), "false", "aria-disabled on field2");
				assert.strictEqual(myWidget.valueNode.disabled, false, "valueNode disabled prop");
			},

			"#required": function () {
				var myWidget = new FormWidgetTest();

				myWidget.required = true;
				myWidget.deliver();

				// Since field1 and field2 are <span>, the "aria-required" attribute should be set,
				// but the "required" property should be set on the <input>.
				assert.strictEqual(myWidget.field1.getAttribute("aria-required"), "true", "aria-required on field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-required"), "true", "aria-required on field2");
				assert.strictEqual(myWidget.valueNode.required, true, "valueNode required prop");

				myWidget.required = false;
				myWidget.deliver();
				assert.strictEqual(myWidget.field1.getAttribute("aria-required"), "false", "aria-required on field1");
				assert.strictEqual(myWidget.field2.getAttribute("aria-required"), "false", "aria-required on field2");
				assert.strictEqual(myWidget.valueNode.required, false, "valueNode required prop");
			},


			"change #tabStops": function () {
				var myWidget = new FormWidgetTest();
				myWidget.tabStops = ["field3", "field4"];
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
