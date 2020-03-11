/* eslint-disable quote-props */
define([
	"dcl/dcl",
	"delite/register",
	"delite/FormWidget",
	"delite/Widget"
], function (
	dcl,
	register,
	FormWidget,
	Widget
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

	var container, FormWidgetTest;

	registerSuite("FormWidget", {
		before: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		tests: {
			"single focusNode": {
				before: function () {
					FormWidgetTest = register("form-widget-test", [HTMLElement, FormWidget], {
						render: function () {
							this.focusNode = this.ownerDocument.createElement("input");
							this.appendChild(this.focusNode);
							this.valueNode = this.ownerDocument.createElement("input");
							this.valueNode.type = "hidden";
							this.appendChild(this.valueNode);
						}
					});

					register("form-widget-test-two", [HTMLElement, FormWidget], {
						moveAriaAttributes: false,
						render: function () {
							this.focusNode = this.ownerDocument.createElement("input");
							this.appendChild(this.focusNode);
							this.valueNode = this.ownerDocument.createElement("input");
							this.valueNode.type = "hidden";
							this.appendChild(this.valueNode);
						}
					});
				},

				tests: {
					// Test that aria attributes are moved to the focus node
					moveAria: function () {
						// Create a widget declaratively to test initial aria attributes processed
						container.innerHTML = "<form-widget-test aria-label='test label' foo='bar'></form-widget-test>";
						register.deliver();

						var myWidget = container.firstChild;

						// Check that aria-label was moved
						assert.isUndefined(myWidget.attributes["aria-label"], "aria-label removed from root");
						assert.strictEqual(myWidget.focusNode.getAttribute("aria-label"), "test label",
							"aria-label added to focusNode");

						// Test that setAttribute(), removeAttribute(), hasAttribute(), and getAttribute() all redirect
						// to the focus node when appropriate
						assert(myWidget.hasAttribute("foo"), "hasAttribute(foo)");
						assert(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");
						assert.isFalse(myWidget.hasAttribute("bar"), "hasAttribute(bar)");

						assert.strictEqual(myWidget.getAttribute("foo"), "bar", "getAttribute(foo)");
						assert.strictEqual(myWidget.getAttribute("aria-label"), "test label",
							"getAttribute(aria-label)");

						myWidget.removeAttribute("foo");
						assert.isFalse(myWidget.hasAttribute("foo"), "foo removed");
						myWidget.removeAttribute("aria-label");
						assert.isFalse(myWidget.hasAttribute("aria-label"), "hasAttribute(aria-label)");

						myWidget.setAttribute("foo", "bar 2");
						myWidget.setAttribute("aria-label", "label 2");
						assert.isUndefined(myWidget.attributes["aria-label"], "root has foo but not aria-label");
						assert.strictEqual(myWidget.attributes.foo.value, "bar 2", "root has foo but not aria-label");
						assert.strictEqual(myWidget.focusNode.getAttribute("aria-label"), "label 2",
							"aria-label added to focusNode");
					},

					// Test that aria attributes are moved to the focus node
					dontMoveAria: function () {
						// Create a widget declaratively to test initial aria attributes processed
						container.innerHTML =
							"<form-widget-test-two aria-label='test' foo='bar'></form-widget-test-two>";
						register.deliver();

						var myWidget = container.firstChild;

						assert.strictEqual(myWidget.moveAriaAttributes, false, "moveAriaAttributes should be false");
						assert.strictEqual(myWidget.attributes["aria-label"].nodeValue,
							"test", "aria-label should not be on the root and be equals test");
					},

					"#disabled": function () {
						var myWidget = new FormWidgetTest();

						myWidget.disabled = true;
						myWidget.deliver();

						// since valueNode and focusNode are <input>, the disabled property should be set
						assert(myWidget.valueNode.disabled, "disabled set on valueNode");
						assert(myWidget.focusNode.disabled, "disabled set on focusNode");
						assert.isFalse(myWidget.valueNode.hasAttribute("aria-disabled"), "valueNode: no aria-disabled");
						assert.isFalse(myWidget.focusNode.hasAttribute("aria-disabled"), "focusNode: no aria-disabled");

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
						var myWidget = new FormWidgetTest({ id: "widget-id" });

						myWidget.deliver();

						// Id should be set for the first tabbable input node.
						assert.strictEqual(myWidget.focusNode.id, "widget-id-input",
							"Id not set correctly on focus node");
					},

					"#tabIndex": function () {
						// default tabIndex
						var myWidget = new FormWidgetTest();
						myWidget.deliver();
						assert.strictEqual(myWidget.focusNode.getAttribute("tabindex"), "0", "default tabIndex");
						assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
							"no tabIndex on root 1");

						// specify initial tabIndex
						myWidget = new FormWidgetTest({
							tabIndex: "3"
						});
						myWidget.deliver();
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
						myWidget.deliver();
						assert.strictEqual(myWidget.focusNode.getAttribute("alt"), "hello world");
					},

					"#name": function () {
						var myWidget = new FormWidgetTest({
							name: "bob"
						});
						myWidget.deliver();
						assert.strictEqual(myWidget.valueNode.getAttribute("name"), "bob");
					}
				}
			},

			"multiple tab stops": {
				before: function () {
					FormWidgetTest = register("form-widget-test-2", [HTMLElement, FormWidget], {
						tabStops: ["button1", "input1"],
						render: function () {
							// Widget has four fields.  Initially button1 and input1 are focusable.
							this.button1 = this.ownerDocument.createElement("span");
							this.button1.setAttribute("role", "button");
							this.button1.textContent = "1";
							this.appendChild(this.button1);

							this.input1 = this.ownerDocument.createElement("span");
							this.input1.setAttribute("role", "textbox");
							this.input1.textContent = "2";
							this.appendChild(this.input1);

							this.button2 = this.ownerDocument.createElement("span");
							this.button2.setAttribute("role", "button");
							this.button2.textContent = "3";
							this.appendChild(this.button2);

							this.input2 = this.ownerDocument.createElement("span");
							this.input2.setAttribute("role", "textbox");
							this.input2.textContent = "4";
							this.appendChild(this.input2);

							this.valueNode = this.ownerDocument.createElement("input");
							this.valueNode.type = "hidden";
							this.appendChild(this.valueNode);
						}
					});
				},

				tests: {
					basic: function () {
						// Create a widget declaratively to test initial aria attributes processed
						container.innerHTML =
							"<form-widget-test-2 aria-label='test label' foo='bar'></form-widget-test>";
						register.deliver();

						var myWidget = container.firstChild;

						// tabIndex
						assert.strictEqual(myWidget.button1.getAttribute("tabindex"), "0", "button1 default tabIndex");
						assert.strictEqual(myWidget.input1.getAttribute("tabindex"), "0", "input1 default tabIndex");
						assert.isFalse(HTMLElement.prototype.hasAttribute.call(myWidget, "tabindex"),
							"no tabIndex on root 1");

						// In this case we don't move aria-label because the subnodes may already have their own labels.
						assert.strictEqual(myWidget.attributes["aria-label"].value,
							"test label", "aria-label etc. still on root");
					},

					"#disabled": function () {
						var myWidget = new FormWidgetTest();

						myWidget.disabled = true;
						myWidget.deliver();

						// Since button1 and input1 are <span>, the "aria-disabled" attribute should be set,
						// but the "disabled" property should be set on the <input>.
						assert.strictEqual(myWidget.button1.getAttribute("aria-disabled"), "true",
							"aria-disabled on button1");
						assert.strictEqual(myWidget.input1.getAttribute("aria-disabled"), "true",
							"aria-disabled on input1");
						assert.strictEqual(myWidget.valueNode.disabled, true, "valueNode disabled prop");

						myWidget.disabled = false;
						myWidget.deliver();
						assert.strictEqual(myWidget.button1.getAttribute("aria-disabled"), "false",
							"aria-disabled on button1");
						assert.strictEqual(myWidget.input1.getAttribute("aria-disabled"), "false",
							"aria-disabled on input1");
						assert.strictEqual(myWidget.valueNode.disabled, false, "valueNode disabled prop");
					},

					"#required": function () {
						var myWidget = new FormWidgetTest();

						myWidget.required = true;
						myWidget.deliver();

						// Since input1 is a <span role=textbox>, the "aria-required" attribute should be set,
						// but the "required" property should be set on the <input>.
						// button1 is a <span role=button> so it gets neither the property nor the attribute.
						assert.isFalse(myWidget.button1.hasAttribute("aria-required"), "aria-required on button1");
						assert.strictEqual(myWidget.input1.getAttribute("aria-required"), "true",
							"aria-required on input1");
						assert.strictEqual(myWidget.valueNode.required, true, "valueNode required prop");

						myWidget.required = false;
						myWidget.deliver();
						assert.isFalse(myWidget.button1.hasAttribute("aria-required"),
							"aria-required on button1 (check #2)");
						assert.strictEqual(myWidget.input1.getAttribute("aria-required"), "false",
							"aria-required on input1 (check #2)");
						assert.strictEqual(myWidget.valueNode.required, false, "valueNode required prop (check #2)");
					},


					"change #tabStops": function () {
						var myWidget = new FormWidgetTest();
						myWidget.tabStops = ["button2", "input2"];
						myWidget.deliver();
						assert.isFalse(myWidget.button1.hasAttribute("tabindex"), "button1 tabIndex removed");
						assert.isFalse(myWidget.input1.hasAttribute("tabindex"), "input1 tabIndex removed");
						assert.strictEqual(myWidget.button2.tabIndex, 0, "button2 tabIndex");
						assert.strictEqual(myWidget.input2.getAttribute("tabindex"), "0", "input2 tabIndex");
					}
				}
			},

			// Test that disabled property and required property are correctly propagated to custom element children.
			"disabled and required propagation to custom elements": function () {
				// Create test widgets without disabled and required properties.
				var ButtonWidget = register("form-widget-button", [HTMLElement, Widget], {
					render: function () {
						this.setAttribute("role", "button");
					}
				});
				var TextboxWidget = register("form-widget-textbox", [HTMLElement, Widget], {
					render: function () {
						this.setAttribute("role", "textbox");
					}
				});

				// Create test widget with disabled and required properties.
				var WidgetWithDisabledAndRequired = register("form-widget-dis-req", [HTMLElement, Widget], {
					disabled: true,
					required: true
				});

				// Create a widget with child widgets, with and without disabled and required properties.
				var Container = register("form-widget-test-3", [HTMLElement, FormWidget], {
					tabStops: ["button", "textbox", "form"],

					render: function () {
						this.button = new ButtonWidget();
						this.button.deliver();
						this.appendChild(this.button);

						this.textbox = new TextboxWidget();
						this.textbox.deliver();
						this.appendChild(this.textbox);

						this.form = new WidgetWithDisabledAndRequired();
						this.form.deliver();
						this.appendChild(this.form);

						this.valueNode = this.ownerDocument.createElement("input");
						this.valueNode.type = "hidden";
						this.appendChild(this.valueNode);
					},

					deliver: dcl.after(function () {
						this.button.deliver();
						this.textbox.deliver();
						this.form.deliver();
					})
				});

				var myContainer = new Container({
					disabled: true,
					required: true
				});
				myContainer.deliver();

				// Since Textbox widget doesn't have disabled and required properties,
				// the "aria-disabled" and "aria-required" attributes should be set.
				assert.strictEqual(myContainer.textbox.getAttribute("aria-disabled"), "true",
					"aria-disabled on TextboxWidget");
				assert.strictEqual(myContainer.textbox.getAttribute("aria-required"), "true",
					"aria-required on TextboxWidget");

				// Likewise for Button widget, except that we shouldn't set aria-required on buttons.
				assert.strictEqual(myContainer.button.getAttribute("aria-disabled"), "true",
					"aria-disabled on ButtonWidget");
				assert.isFalse(myContainer.button.hasAttribute("aria-required"), "aria-required on ButtonWidget");

				// Since  WidgetWithDisabledAndRequired has disabled and required properties, they should be set
				// and aria properties shouldn't be set.
				assert.isFalse(myContainer.form.hasAttribute("aria-disabled"),
					"aria-disabled on WidgetWithDisabledAndRequired");
				assert.isFalse(myContainer.form.hasAttribute("aria-required"),
					"aria-required on WidgetWithDisabledAndRequired");
				assert.isTrue(myContainer.form.disabled, "disabled on WidgetWithDisabledAndRequired");
				assert.isTrue(myContainer.form.required, "required on WidgetWithDisabledAndRequired");
			}
		},

		after: function () {
			container.parentNode.removeChild(container);
		}
	});
});
