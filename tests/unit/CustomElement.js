define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"dcl/advise",
	"delite/register",
	"delite/CustomElement",
	"requirejs-domready/domReady!"
], function (registerSuite, assert, dcl, advise, register, CustomElement) {

	var container;
	var TestNativeProps;
	var calls = 0;

	var obj = {
		foo: function () {
			// summary: empty function that we connect to
		}
	};

	/* jshint multistr: true */
	var html = "<test-ce-foo id='one' name='bob' attr1=10 attr2=10></test-ce-foo> \
		<test-ce-foo id='two' name='is' attr1=5 attr2=10></test-ce-foo> \
		<div id='threeWrapper'> \
		<test-ce-bar id='three' name='your' attr1=5 attr2=5> \
		<div id='three.one'> \
		<div id='three.one.one'></div> \
		<test-ce-bar id='four' name='uncle' attr1=10 attr2=5></test-ce-bar> \
		</div> \
		</test-ce-bar> \
		</div> \
		<div id='not-a-custom-element'></div>";

	registerSuite({
		name: "CustomElement",

		beforeEach: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},


		afterEach: function () {
			container.parentNode.removeChild(container);
		},

		instantiation: {
			"declarative attributes": function () {
				/* global global:true */
				global = 0;

				/* global globalObj:true */
				globalObj = { text: "global var" };

				/* global globalInstance:true */
				globalInstance = {
					func: function () {
						global = 456;
					}
				};

				container.innerHTML =
					"<test-ce-declarative id='d' boolProp='boolProp' numProp='5' stringProp='hello' " +
					"funcProp='global=123;' funcProp2='globalInstance.func' " +
					"objProp1='foo:1,bar:2' objProp2='globalObj' aryProp='cat,dog,fish'/>";

				// Check that "customelement-attached" event fires.
				var d = document.getElementById("d");
				var customElementAttachedEventTarget;
				d.addEventListener("customelement-attached", function (evt) {
					customElementAttachedEventTarget = evt.target;
				});

				register("test-ce-declarative", [HTMLElement, CustomElement], {
					boolProp: false,
					numProp: 0,
					stringProp: "",
					funcProp: function () {
					},
					funcProp2: function () {
					},
					objProp1: { },
					objProp2: { },
					aryProp: []
				});

				assert.strictEqual(customElementAttachedEventTarget, d, "customelement-attached target");

				assert.isTrue(d.boolProp, "d.boolProp");
				assert.strictEqual(d.numProp, 5, "d.numProp");
				assert.strictEqual(d.stringProp, "hello", "d.stringProp");
				d.funcProp();
				assert.strictEqual(global, 123, "d.funcProp() executed");
				d.funcProp2();
				assert.strictEqual(global, 456, "d.funcProp2() executed");
				assert.strictEqual(d.objProp1.foo, 1, "d.objProp1.foo");
				assert.strictEqual(d.objProp1.bar, 2, "d.objProp1.bar");
				assert.strictEqual(d.objProp2.text, "global var", "d.objProp2.text");
				assert.deepEqual(d.aryProp, ["cat", "dog", "fish"], "d.aryProp");
			},

			"setter not called on creation": function () {
				// Setters are no longer called on creation except for parameters sent to new Foo(...)
				var fooSetterCalled = false;
				var MyCustomElement = register("my-custom-element", [HTMLElement, CustomElement], {
					foo: dcl.prop({
						set: function (val) {
							fooSetterCalled = val;
							this._set("foo", val);
						},
						get: function () {
							return this._has("foo") ? this._get("foo") : 345;
						}
					})
				});
				var instance = new MyCustomElement();
				assert(instance, "instance created");
				assert.strictEqual(fooSetterCalled, false, "fooSetterCalled");
			}
		},

		lifecycle: function () {
			// Setup ownership
			register("test-ce-lifecycle-custom-element", [HTMLElement, CustomElement], {
				attaches: 0,
				detaches: 0,
				constructor: function () {
					// Rather odd call to this.own() for testing the connections are dropped on destroy()
					this.own(advise.after(obj, "foo", function () {
						calls++;
					}, true));
				},
				connectedCallback: function () {
					this.attaches++;
				},
				disconnectedCallback: function () {
					this.detaches++;
				}
			});

			// create
			container.innerHTML =
				"<test-ce-lifecycle-custom-element id='w1'></test-ce-lifecycle-custom-element>" +
				"<test-ce-lifecycle-custom-element id='w2'></test-ce-lifecycle-custom-element>";

			setTimeout(this.async().callback(function () {
				assert.strictEqual(window.w1.attaches, 1, "attach");

				// test the connection
				assert.strictEqual(calls, 0, "foo() not called yet");
				obj.foo();
				assert.strictEqual(calls, 2, "foo() called from each custom element");


				// Test attaching and detaching
				var w1 = window.w1;
				w1.connectedCallback();	// shouldn't do anything, since already attached
				assert.strictEqual(w1.attaches, 1, "redundant attach");

				w1.disconnectedCallback();
				w1.disconnectedCallback();	// shouldn't do anything, since already attached
				assert.strictEqual(w1.detaches, 1, "detach");

				w1.connectedCallback();	// shouldn't reattach
				assert.strictEqual(w1.attaches, 2, "reattach");

				w1.disconnectedCallback();	// re-detach
				assert.strictEqual(w1.detaches, 2, "re-detach");

				// Then destroy
				var w = document.getElementById("w1");
				w.destroy();
				assert.ok(!document.getElementById("w1"), "custom element no longer exists");

				// test the connection from w1 was destroyed (w2 still there)
				calls = 0;
				obj.foo();
				assert.strictEqual(calls, 1, "connection was deleted");

				// test the DOM node was removed
				assert.ok(!document.getElementById("w1"), "DOM Node removed");
			}), 0);
		},

		"#on": {
			programmatic: function () {
				// Create a custom element with a custom "foo" event, plus the standard "click" event.
				var MyCustomElement = register("my-widget2-on", [HTMLElement, CustomElement], {});

				var evt = null, clicked = 0;
				var w = new MyCustomElement({});
				w.on("foo", function (e) {
					evt = e;
				});
				w.on("click", function () {
					clicked++;
				});
				container.appendChild(w);

				w.emit("foo");
				assert.isNotNull(evt, "on('foo', ...) was called with event object");

				w.emit("click");
				assert.strictEqual(clicked, 1, "one click event");
			},

			declarative: function () {
				// Test that declarative instantiation (on-foo=...) works,
				// and also that CustomElement.on() works.

				// Define a custom element that emits two events, "click" and "custom".
				// You can catch the events via either programmatic on("click", ...) or declarative on-custom=...
				// syntax.
				register("my-custom-element-on", [HTMLElement, CustomElement], {});

				// Create variables accessed from the declarative custom element (see definition in <body>)
				/* global globalClicked:true */
				globalClicked = 0;
				/* global globalCustom:true */
				globalCustom = 0;
				/* global globalType:true */
				globalType = null;

				container.innerHTML =
					"<my-custom-element-on id='MyCustomElement' on-click='globalClicked++;' " +
					"on-custom='globalCustom++; globalType=event.type;'>hi</my-CustomElement-on>";

				setTimeout(this.async().callback(function () {
					var MyCustomElement = document.getElementById("MyCustomElement");

					var clicked = 0;
					MyCustomElement.on("click", function () {
						clicked++;
					});
					MyCustomElement.emit("click");
					assert.strictEqual(clicked, 1, ".on('clicked', ...)");
					assert.strictEqual(globalClicked, 1, "onclick='...'");

					var custom = 0;
					MyCustomElement.on("custom", function () {
						custom++;
					});
					MyCustomElement.emit("custom");
					assert.strictEqual(custom, 1, ".on('custom', ...)");
					assert.strictEqual(globalCustom, 1, "oncustom='...'");
					assert.strictEqual(globalType, "custom", "event parameter passed into handler");
				}), 0);
			}
		},

		// Test that Stateful notification of properties works.
		// Testing specifically here (in addition to decor) because CustomElement redefines Stateful#getProps()
		stateful: function () {
			var d = this.async(1000);

			// Create a custom element with a custom "foo" event, plus the standard "click" event.
			var MyCustomElement = register("my-widget-stateful", [HTMLElement, CustomElement], {
				_private: 1,

				foo: 2,
				_setFooAttr: function (val) {
					this._set("foo", val);
				},

				anotherFunc: function () {
				}
			});

			var w = new MyCustomElement({});
			w.observe(d.callback(function (oldValues) {
				assert.deepEqual(oldValues, {
					_private: 1,
					foo: 2
				});
			}));

			w._private = 11;
			w.foo = 22;
			w.instanceProp = 33;
			w.className = "foo";	// shouldn't cause notification as per CustomElement#_getProp()
		},

		// Test that we can observe changes to other native properties like tabIndex, dir, etc
		"observing native properties": {
			setup: function () {
				TestNativeProps = register("test-native-props", [HTMLElement, CustomElement], {
					lang: "hello",
					title: "world",
					constructor: function () {
						this.observe(function (oldProps) {
							Object.keys(oldProps).forEach(function (prop) {
								this["_" + prop] = this._get(prop);
							}, this);
						}.bind(this));
					}
				});
			},

			programmatic: function () {
				var myCustomElement = new TestNativeProps({
					title: "new title",
					lang: "new lang"
				});
				container.appendChild(myCustomElement);
				myCustomElement.connectedCallback();
				assert.strictEqual(myCustomElement._title, "new title");
				assert.strictEqual(myCustomElement._lang, "new lang");

				// test setting native props and then calling deliver
				myCustomElement.title = "new title 2";
				myCustomElement.lang = "new lang 2";
				myCustomElement.deliver();
				assert.strictEqual(myCustomElement._title, "new title 2");
				assert.strictEqual(myCustomElement._lang, "new lang 2");

				// test setting native props without calling deliver
				myCustomElement.title = "new title 3";
				myCustomElement.lang = "new lang 3";
				setTimeout(this.async().callback(function () {
					assert.strictEqual(myCustomElement._title, "new title 3");
					assert.strictEqual(myCustomElement._lang, "new lang 3");
				}), 10);
			},

			declarative: function () {
				container.innerHTML =
					"<test-native-props id=nativePropsTest lang=lang1 title=title1></test-native-props>";

				setTimeout(this.async().callback(function () {
					var declarative = document.getElementById("nativePropsTest");

					assert.strictEqual(declarative._title, "title1");
					assert.strictEqual(declarative._lang, "lang1");
				}), 0);
			}
		},

		"misc methods": {
			"#findCustomElements": function () {
				register("test-ce-foo", [HTMLElement, CustomElement], {
					name: "",
					attr1: 0,
					attr2: 0
				});
				register("test-ce-bar", [HTMLElement, CustomElement], {
					name: "",
					attr1: 0,
					attr2: 0
				});
				register("test-ce-baz", [HTMLElement, CustomElement], {
					name: "",
					attr1: 1,
					attr2: 1
				});
				container.innerHTML = html;

				setTimeout(this.async().callback(function () {
					assert.strictEqual(CustomElement.prototype.findCustomElements(container).length, 3);
					assert.strictEqual(
						CustomElement.prototype.findCustomElements(document.getElementById("threeWrapper")).length, 1);
				}), 0);
			}
		}
	});
});
