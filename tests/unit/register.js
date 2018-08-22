define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"decor/sniff",
	"delite/register",
	"decor/Stateful",
	"requirejs-domready/domReady!"
], function (registerSuite, assert, dcl, has, register, Stateful) {

	// The <div> node where we will put all our DOM nodes
	var container;

	var Mixin, TestWidget, TestExtendedWidget;

	registerSuite({
		name: "register",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// Declare and instantiate a simple widget
		simple: function () {
			TestWidget = register("test-simple-widget", [HTMLElement], {
				foo: 3,
				constructor: function () {
					this._constructorCalled = true;
				},
				connectedCallback: function () {
					this._connectedCallbackCalled = true;
				},
				fooFunc: function () {
					this._fooCalled = true;
				},

				barFunc: function () {
					this._barCalled = true;
				}
			});
			assert.ok(TestWidget, "TestWidget created");

			container.innerHTML = "<test-simple-widget id=tsw></test-simple-widget>";
			var tsw = document.getElementById("tsw");
			register.upgrade(tsw);

			// lifecycle methods
			assert.ok(tsw._constructorCalled, "constructor called");
			assert.ok(tsw._connectedCallbackCalled, "connectedCallback called");

			// property exists
			assert.ok(tsw.foo, "foo");

			// function from mixin exists
			tsw.fooFunc();
			assert.ok(tsw._fooCalled, "_fooCalled");

			// properties are enumerable
			var sawFoo;
			for (var key in tsw) {
				if (key === "foo") {
					sawFoo = true;
					break;
				}
			}
			assert.ok(sawFoo, "foo enumerable");
		},

		// Declare and instantiate a widget from a mixin that extends Stateful
		stateful: function () {
			// Create a mixin for testing purposes.
			// register() should call this.introspect() if it's defined, because it isn't called naturally.
			Mixin = dcl(Stateful, {
				foo: 3,
				fooFunc: function () {
					this._fooCalled = true;
				},

				cs1: dcl.prop({
					set: function (val) {
						this._set("cs1", val + 1);
					},
					get: function () {
						return this._has("cs1") ? this._get("cs1") : 3;
					}
				})
			});
			assert.ok(Mixin, "Mixin created");

			TestWidget = register("test-stateful-widget", [HTMLElement, Mixin], {
				barFunc: function () {
					this._barCalled = true;
				},

				cs2: 3,
				// TODO: this is old syntax and doesn't work anymore.
				_setCs2Attr: function (val) {
					this._set("cs2", val + 1);
				}
			});
			assert.ok(TestWidget, "TestWidget created");

			container.innerHTML = "<test-stateful-widget id=tw></test-stateful-widget>";
			var tw = document.getElementById("tw");
			register.upgrade(tw);

			// property from mixin exists
			assert.ok(tw.foo, "foo");

			// function from mixin exists
			tw.fooFunc();
			assert.ok(tw._fooCalled, "_fooCalled");

			// function from register() call exists
			tw.barFunc();
			assert.ok(tw._barCalled, "_barCalled");

			// check that custom setters are working
			assert.strictEqual(tw.cs1, 3, "tw.cs1");
			tw.cs1 = 4;			// actually sets cs1 to 5, due to custom setter
			assert.strictEqual(tw.cs1, 5, "tw.cs1 after set");

			assert.strictEqual(tw.cs2, 3, "tw.cs2");
			tw.cs2 = 4;			// actually sets cs2 to 5, due to custom setter
			assert.strictEqual(tw.cs1, 5, "tw.cs2 after set");

		},

		extended: function () {
			// Create extension of another widget
			TestExtendedWidget = register("test-extended-widget", [TestWidget], {
				extFunc: function () {
					this._extCalled = true;
				}
			});
			assert.ok(TestExtendedWidget, "TestExtendedWidget created");

			container.innerHTML = "<test-extended-widget id=tew></test-extended-widget>";
			var tew = document.getElementById("tew");
			register.upgrade(tew);
			assert.ok(tew.foo, "foo");
			tew.fooFunc();
			assert.ok(tew._fooCalled, "_fooCalled");
			tew.barFunc();
			assert.ok(tew._barCalled, "_barCalled");
			tew.extFunc();
			assert.ok(tew._extCalled, "_extCalled");

			// properties are enumerable
			var sawExt;
			for (var key in tew) {
				if (key === "extFunc") {
					sawExt = true;
					break;
				}
			}
			assert.ok(sawExt, "ext enumerable");
		},

		// Comment out button tests because customized built in elements not supported most places.
		/*
		button: function () {
			// Create a simple widget extending something other than HTMLElement.
			TestButtonWidget = register("test-button-widget", [HTMLButtonElement, Mixin], {
				label: "my label"
			});
			assert.ok(TestButtonWidget, "TestButtonWidget created");

			container.innerHTML = "<button is='test-button-widget' id=tbw></button>";
			var tbw = document.getElementById("tbw");
			register.upgrade(tbw);

			assert.ok(tbw.foo, "foo");
			assert.ok(tbw.label, "label");
		},

		"extended button": function () {
			// Create extension of another widget.
			TestExtendedButtonWidget = register("test-extended-button-widget", [TestButtonWidget], {
				extFunc: function () {
					this._extCalled = true;
				}
			});
			assert.ok(TestExtendedButtonWidget, "TestExtendedButtonWidget created");

			container.innerHTML = "<button is='test-extended-button-widget' id=tebw></button>";
			var tebw = document.getElementById("tebw");
			register.upgrade(tebw);

			assert.ok(tebw.foo, "foo");
			assert.ok(tebw.label, "label");
			tebw.extFunc();
			assert.ok(tebw._extCalled, "_extCalled");
		},
		*/

		// Test the new MyWidget() syntactic sugar
		"new": function () {
			var tw = new TestWidget({});
			assert.ok(tw.foo, "TestWidget.foo");
			assert.strictEqual(tw.nodeName.toLowerCase(), "test-stateful-widget", "nodeName of TestWidget");
		},

		// Test declarative creation.
		declarative1: function () {
			register("test-parser-widget", [HTMLElement, Mixin], {
				createdCalls: 0,
				constructor: function () {
					this.createdCalls++;
				},

				attachedCalls: 0,
				connectedCallback: function () {
					this.attachedCalls++;
				}
			});

			container.innerHTML = "<div>" +
				"<span>random node</span>" +
				"<test-parser-widget id=pw></test-parser-widget>" +
				"</div>";

			setTimeout(this.async().callback(function () {
				// customized built in elements not supported most places
				// assert.strictEqual(document.getElementById("ebw2").label, "my label", "ebw2.label");
				assert.strictEqual(document.getElementById("pw").createdCalls, 1, "pw.createdCalls");
				assert.strictEqual(document.getElementById("pw").attachedCalls, 1, "pw.attachedCalls");
			}), 0);
		},

		declarative2: function () {
			// create dom nodes for not-yet-declared-widget, and attach them to document
			container.innerHTML = "<test-auto-parse id=ap1></test-auto-parse>" +
			"<div><test-auto-parse id=ap2></test-auto-parse></div>";

			// declare widget
			register("test-auto-parse", [HTMLElement, Mixin], {
				createdCalls: 0,
				constructor: function () {
					this.createdCalls++;
				},

				attachedCalls: 0,
				connectedCallback: function () {
					this.attachedCalls++;
				},

				detachedCalls: 0,
				disconnectedCallback: function () {
					this.detachedCalls++;
				}
			});

			// Check that existing dom nodes were parsed.
			var ap1 = document.getElementById("ap1"),
				ap2 = document.getElementById("ap2");
			assert.strictEqual(ap1.createdCalls, 1, "ap1.createdCalls");
			assert.strictEqual(ap2.createdCalls, 1, "ap2.createdCalls");
			assert.strictEqual(ap1.attachedCalls, 1, "ap1.attachedCalls");
			assert.strictEqual(ap2.attachedCalls, 1, "ap2.attachedCalls");

			// Add more dom nodes, and check that they get auto-parsed and auto-attached.
			// Check both when custom element is added directly, and when a node containing a custom element is added.
			var ap3 = document.createElement("test-auto-parse");
			ap3.id = "ap3";
			container.appendChild(ap3);
			var parent = document.createElement("div");
			var ap4 = document.createElement("test-auto-parse");
			ap4.id = "ap4";
			parent.appendChild(ap4);
			container.appendChild(parent);

			setTimeout(this.async().rejectOnError(function () {
				assert.strictEqual(ap3.createdCalls, 1, "ap3.createdCalls");
				assert.strictEqual(ap3.attachedCalls, 1, "ap3.attachedCalls");
				assert.strictEqual(ap4.createdCalls, 1, "ap4.createdCalls");
				assert.strictEqual(ap4.attachedCalls, 1, "ap4.attachedCalls");

				// Remove the dom nodes and check that disconnectedCallback() was called.
				container.removeChild(ap3);
				container.removeChild(parent);
				setTimeout(this.async().rejectOnError(function () {
					assert.strictEqual(ap3.detachedCalls, 1, "ap3.detachedCalls");
					assert.strictEqual(ap4.detachedCalls, 1, "ap4.detachedCalls");

					// Reattach the nodes and check that connectedCallback() was called again.
					container.appendChild(ap3);
					container.appendChild(parent);
					setTimeout(this.async().callback(function () {
						assert.strictEqual(ap3.attachedCalls, 2, "ap3.attachedCalls");
						assert.strictEqual(ap4.attachedCalls, 2, "ap4.attachedCalls");
					}.bind(this)), 50);
				}.bind(this)), 50);
			}.bind(this)), 50);
		},

		// Test error conditions
		errors: function () {
			var threw;

			try {
				register("test-bad-inheritance", [Stateful], { });
			} catch (err) {
				assert(/must have HTMLElement in prototype chain/.test(err.toString()),
					"err not extending HTMLElement");
				threw = true;
			}
			assert(threw, "threw error when not extending HTMLElement");


			register("test-repeated-tag", [HTMLElement, Mixin], { });
			threw = false;
			try {
				register("test-repeated-tag", [HTMLElement], { });
			} catch (err) {
				// Error text is different on Chrome vs. Safari, so not checking the text.
				threw = true;
			}
			assert(threw, "threw error when redeclaring same tag");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
