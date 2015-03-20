define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"decor/Stateful",
	"requirejs-domready/domReady!"
], function (registerSuite, assert, register, Stateful) {

	// The <div> node where we will put all our DOM nodes
	var container;

	var Mixin, TestWidget, TestButtonWidget, TestExtendedWidget, TestExtendedButtonWidget;

	var nativeButton = document.createElement("button");

	registerSuite({
		name: "register",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// Test the parser doesn't fail when no widgets are registered.  It just shouldn't do anything.
		// Unfortunately, since Intern doesn't have sandboxing, usually when this runs there are already
		// widgets registered, so it's not actually testing anything yet.
		"no widgets registered parse": function () {
			container.innerHTML = "<div>" +
				"<button is='test-extended-button-widget' id=ebw2>hello</button>" +
				"<span>random node</span>" +
				"<test-parser-widget id=pw></test-parser-widget>" +
				"</div>";

			register.parse(container);
		},

		// Declare and instantiate a simple widget
		simple: function () {
			TestWidget = register("test-simple-widget", [HTMLElement], {
				foo: 3,
				createdCallback: function () {
					this._createdCallbackCalled = true;
				},
				attachedCallback: function () {
					this._attachedCallbackCalled = true;
				},
				fooFunc: function () {
					this._fooCalled = true;
				},

				barFunc: function () {
					this._barCalled = true;
				}
			});
			assert.ok(TestWidget, "TestWidget created");

			container.innerHTML += "<test-simple-widget id=tsw></test-simple-widget>";
			var tsw = document.getElementById("tsw");
			register.upgrade(tsw);

			// lifecycle methods
			assert.ok(tsw._createdCallbackCalled, "createdCallback called");
			assert.ok(tsw._attachedCallbackCalled, "attachedCallback called");

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
			Mixin = register.dcl(Stateful, {
				foo: 3,
				fooFunc: function () {
					this._fooCalled = true;
				},

				cs1: 3,
				_setCs1Attr: function (val) {
					this._set("cs1", val + 1);
				},

				// Need to redefine Stateful.getProps() because on FF and IE, we get exceptions when accessing props
				// like HTMLElement.title.  We are accessing them in the HTMLElement prototype rather than an object
				// created from the document.createElement() factory.
				getProps: function () {
					var hash = {};
					for (var prop in this) {
						if (!(prop in nativeButton)) {
							hash[prop] = true;
						}
					}
					return hash;
				}
			});
			assert.ok(Mixin, "Mixin created");

			TestWidget = register("test-widget", [HTMLElement, Mixin], {
				barFunc: function () {
					this._barCalled = true;
				},

				cs2: 3,
				_setCs2Attr: function (val) {
					this._set("cs2", val + 1);
				}
			});
			assert.ok(TestWidget, "TestWidget created");

			container.innerHTML += "<test-widget id=tw></test-widget>";
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

			container.innerHTML += "<test-extended-widget id=tew></test-extended-widget>";
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

		button: function () {
			// Create a simple widget extending something other than HTMLElement.
			TestButtonWidget = register("test-button-widget", [HTMLButtonElement, Mixin], {
				label: "my label"
			});
			assert.ok(TestButtonWidget, "TestButtonWidget created");

			container.innerHTML += "<button is='test-button-widget' id=tbw></button>";
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

			container.innerHTML += "<button is='test-extended-button-widget' id=tebw></button>";
			var tebw = document.getElementById("tebw");
			register.upgrade(tebw);

			assert.ok(tebw.foo, "foo");
			assert.ok(tebw.label, "label");
			tebw.extFunc();
			assert.ok(tebw._extCalled, "_extCalled");
		},

		// Create element is like upgrade() but it also creates the element for you.
		createElement: function () {
			var tw = register.createElement("test-widget");
			assert.ok(tw.foo, "TestWidget.foo");

			// Test also that we can create plain elements that are not registered as widgets
			var div = register.createElement("div");
			assert.strictEqual("div", div.nodeName.toLowerCase(), "nodeName of div");
		},

		// Test the new MyWidget() syntactic sugar
		"new": function () {
			var tw = new TestWidget({});
			assert.ok(tw.foo, "TestWidget.foo");
			assert.strictEqual("test-widget", tw.nodeName.toLowerCase(), "nodeName of TestWidget");
		},

		// Test the parser, which scans the DOM for registered widgets and upgrades them
		parse: function () {
			register("test-parser-widget", [HTMLElement, Mixin], {
				createdCalls: 0,
				createdCallback: function () {
					this.createdCalls++;
				},

				attachedCalls: 0,
				attachedCallback: function () {
					this.attachedCalls++;
				}
			});

			container.innerHTML += "<div>" +
				"<button is='test-extended-button-widget' id=ebw2>hello</button>" +
				"<span>random node</span>" +
				"<test-parser-widget id=pw></test-parser-widget>" +
				"</div>";

			register.parse(container);
			assert.strictEqual("my label", document.getElementById("ebw2").label, "ebw2.label");
			assert.strictEqual(1, document.getElementById("pw").createdCalls, "pw.createdCalls");
			assert.strictEqual(1, document.getElementById("pw").attachedCalls, "pw.attachedCalls");

			// Call parse again to make sure that we don't repeat
			register.parse(container);
			assert.strictEqual(1, document.getElementById("pw").createdCalls, "pw.createdCalls");
			assert.strictEqual(1, document.getElementById("pw").attachedCalls, "pw.attachedCalls");
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
				assert(/A widget is already registered with tag/.test(err.toString()), "err repeating tag");
				threw = true;
			}
			assert(threw, "threw error when redeclaring same tag");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
