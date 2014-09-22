define([
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-class",
	"delite/register",
	"delite/Widget",
	"requirejs-domready/domReady!"
], function (registerSuite, assert, domClass, register, Widget) {
	var container;

	var SimpleWidget, simple, pane1;

	function getFragment() {
		var frag = document.createDocumentFragment();
		frag.appendChild(document.createElement("div"));
		frag.appendChild(document.createElement("div"));
		frag.appendChild(document.createElement("div"));
		return frag;
	}


	// tabIndex is problematic, see https://github.com/ibm-js/delite/issues/34.
	registerSuite({
		name: "Widget",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		tabIndex: {
			topLevel: function () {
				// Test when tabIndex is declared top level, in the props passed to register().

				// TODO: enable this test when https://github.com/uhop/dcl/issues/9 is fixed
				if (1 === 1) {
					return;
				}

				var SpecialNames = register("test-tabindex-names", [HTMLElement, Widget], {
					tabIndex: "0",

					postRender: function () {
						this.observe(function (props) {
							if ("tabIndex" in props) {
								this.watchedTabIndex = this.tabIndex;
							}
						}.bind(this));
					}
				});
				var widget = new SpecialNames({ });
				widget.tabIndex = "3";
				document.body.appendChild(widget);
				widget.startup();
				assert.strictEqual(widget.watchedTabIndex, "3", "reported on widget");
			},

			mixin: function () {
				// And test when tabIndex is declared in a mixin.
				var SpecialNamesMixin = register.dcl(Widget, {
					tabIndex: "0",
					_setTabIndexAttr: function (val) {
						// In a real widget, if you declare a tabIndex property then you better have a custom setter
						// too.  Otherwise, tabIndex updates won't have any effect.  For testing purposes we are just
						// saving the new value without applying it to any this.focusNode Element.
						this._set("tabIndex", val);
					},
					postRender: function () {
						this.observe(function (props) {
							if ("tabIndex" in props) {
								this.watchedTabIndex = this._get("tabIndex");
							}
						}.bind(this));
					}
				});
				var SpecialExtendedWidget = register("test-tabindex-names-extended", [HTMLElement, SpecialNamesMixin], {
					tabIndex: "0",
					value: "0",
					isrange: false,
					isbool: false,

					postRender: function () {
						this.observe(function (props) {
							if ("tabIndex" in props) {
								this.watchedTabIndex = this._get("tabIndex");
							}
						}.bind(this));
					}
				});

				var extended = new SpecialExtendedWidget({ });
				extended.tabIndex = "5";
				document.body.appendChild(extended);
				extended.startup();

				var d = this.async(1000);

				setTimeout(d.callback(function () {
					// use assert.equal() because result is 5 or "5" depending on browser
					assert.equal(extended.watchedTabIndex, "5", "reported on extended");
				}), 10);

				return d;
			},

			declarative: function () {
				// And also test for declarative widgets, to make sure the tabIndex property is
				// removed from the root node, to prevent an extra tab stop
				container.innerHTML +=
					"<test-tabindex-names-extended id=specialNames value=5 isrange isbool tabIndex=8/>";
				var declarative = document.getElementById("specialNames");
				register.upgrade(declarative);
				assert.isFalse(declarative.hasAttribute("tabindex"), "tabindex attr removed");
				assert.isTrue(declarative.isrange, "isrange set");
				assert.isTrue(declarative.isbool, "isbool set");

				var d = this.async(1000);

				setTimeout(d.callback(function () {
					assert.strictEqual(declarative.value, "5", "value");
				}), 10);

				return d;
			},

			notInPrototype: function () {
				// And, test when the widget prototype doesn't declare tabIndex at all.
				// Then the widget should just act like a simple <div>, passing tabIndex through to root node.
				var SimpleWidget = register("tabindex-not-in-prototype", [HTMLElement, Widget], { });
				var simple = new SimpleWidget({ tabIndex: 5 });
				document.body.appendChild(simple);
				simple.startup();

				var d = this.async(1000);

				setTimeout(d.callback(function () {
					// make sure that tabIndex was correctly set
					assert.strictEqual(simple.getAttribute("tabindex"), "5", "programmatic set");
				}), 10);

				return d;
			},

			declarativeTabIndexRemoved: function () {
				// And also test for declarative widgets, to make sure the tabIndex property is
				// removed from the root node, to prevent an extra tab stop
				container.innerHTML += "<tabindex-not-in-prototype id=simple tabIndex=8></tabindex-not-in-prototype>";
				var simpleDeclarative = document.getElementById("simple");
				register.upgrade(simpleDeclarative);

				// make sure that tabIndex wasn't unset
				var d = this.async(1000);
				setTimeout(d.callback(function () {
					assert.strictEqual(simpleDeclarative.getAttribute("tabindex"), "8", "declarative set");
				}), 10);
				return d;
			}
		},

		widgetId: function () {
			var TestWidget = register("test-lifecycle-widget", [HTMLElement, Widget], { });
			var w1 = new TestWidget(),
				w2 = new TestWidget();

			assert(w1.widgetId, "w1.widgetId");
			assert(w2.widgetId, "w2.widgetId");
			assert.notStrictEqual(w1.widgetId, w2.widgetId, "id's are different");
		},

		baseClass: function () {
			// First check that baseClass specified in prototype gets set
			var TestWidget = register("test-lifecycle-widget2", [HTMLElement, Widget], {
				baseClass: "base2"
			});
			var myWidget = new TestWidget();
			myWidget.placeAt(container);
			myWidget.startup();
			myWidget.deliver();

			assert(domClass.contains(myWidget, "base2"), "baseClass is base2");

			// Then test that baseClass specified as widget parameter gets set
			var myWidgetCustom = new TestWidget();
			myWidgetCustom.baseClass = "customBase";
			myWidgetCustom.placeAt(container);
			myWidgetCustom.startup();
			myWidgetCustom.deliver();

			assert(domClass.contains(myWidgetCustom, "customBase"), "baseClass is customBase");
		},

		startup: function () {
			var TestSimpleWidget = register("widget-simple", [HTMLElement, Widget], {
			});
			var TestStartupWidget = register("widget-startup", [HTMLElement, Widget], {
				buildRendering: function () {
					this.appendChild(new TestSimpleWidget());
					this.appendChild(this.containerNode = this.ownerDocument.createElement("div"));
					this.containerNode.appendChild(new TestSimpleWidget());
				}
			});

			var w1 = new TestStartupWidget();
			container.appendChild(w1);
			w1.startup();

			// Startup should be called on all widgets, not just those inside containerNode.
			var descendants = w1.findCustomElements();
			assert.strictEqual(descendants.length, 2, "# of custom elements");
			assert(descendants[0].started, "started first child");
			assert(descendants[1].started, "started second child");
		},


		placeAt: {
			setup: function () {
				SimpleWidget = register("simple-widget-place-at", [HTMLElement, Widget], {
					buildRendering: function () {
						this.containerNode = document.createElement("div");
						this.appendChild(this.containerNode);
					}
				});
			},

			"Place a child": function () {
				// create a SimpleWidget
				simple = (new SimpleWidget({id: "simple-place-at-id"})).placeAt(container);
				assert.strictEqual(container, simple.parentNode, "simple is child of container");
			},

			"Place as widget child": function () {
				// add the child to the SimpleWidget now
				pane1 = (new SimpleWidget({ title: "pane1" })).placeAt("simple-place-at-id");
				assert.strictEqual(pane1, simple.containerNode.children[0], "pane1 is child of SimpleWidget");
				assert.strictEqual(simple.containerNode, pane1.parentNode, "pane1 added to simple.containerNode");
			},

			"Place as widget child ordered": function () {
				// add this child (created second) as the new first child
				var pane2 = (new SimpleWidget({ title: "pane2" })).placeAt("simple-place-at-id", 0);
				assert.strictEqual(simple.containerNode, pane2.parentNode, "pane2 added to simple.containerNode");
				assert.strictEqual(pane2, simple.containerNode.children[0], "pane2 is new first child of SimpleWidget");
				assert.strictEqual(pane1, simple.containerNode.children[1], "pane1 now second child of SimpleWidget");
			},

			"Place before": function () {
				var button = document.createElement("button");
				container.appendChild(button);
				var widget = (new SimpleWidget({})).placeAt(button, "before");
				assert.strictEqual(widget.nextSibling, button, "widget before button");
			},

			"Place before id": function () {
				var button = document.createElement("button");
				button.id = "button-id";
				container.appendChild(button);
				var widget = (new SimpleWidget({})).placeAt("button-id", "before");
				assert.strictEqual(widget.nextSibling, button, "widget before button");
			},

			"Place after": function () {
				var button = document.createElement("button");
				container.appendChild(button);
				var widget = (new SimpleWidget({})).placeAt(button, "after");
				assert.strictEqual(button.nextSibling, widget, "widget after button");
			},

			"Place first widget": function () {
				simple.startup();
				var pane3 = (new SimpleWidget({ title: "pane3" })).placeAt("simple-place-at-id", "first");
				assert.strictEqual(simple.containerNode, pane3.parentNode, "pane3 added to simple.containerNode");
				assert.strictEqual(pane3, simple.containerNode.children[0], "pane3 is new first child of SimpleWidget");
				assert.ok(pane3.started, "pane3 was automatically started because simple was already started");
			},

			"Place last widget": function () {
				var pane4 = (new SimpleWidget({ title: "pane4" })).placeAt(simple.containerNode, "last");
				assert.strictEqual(pane4, simple.containerNode.children[simple.containerNode.children.length - 1],
					"pane4 is new last child of SimpleWidget");
				assert.ok(pane4.started, "pane4 was automatically started because simple was already started");
			},

			"Place replace": function () {
				var before = document.createElement("button");
				container.appendChild(before);
				var replace = document.createElement("button");
				container.appendChild(replace);
				var after = document.createElement("button");
				container.appendChild(after);
				var widget = (new SimpleWidget({})).placeAt(replace, "replace");
				assert.strictEqual(before.nextSibling, widget, "before.nextSibling");
				assert.strictEqual(after.previousSibling, widget, "after.previousSibling");
			}
		},

		"placeAt(DocumentFragment)": {
			placeAsLastNode: function () {
				var frag = getFragment();
				simple = (new SimpleWidget({id: "simple"})).placeAt(frag);
				assert.strictEqual(simple, frag.lastChild);
				simple.destroy();
			},

			placeAsFirstNode: function () {
				var frag = getFragment();
				simple = (new SimpleWidget({id: "simple"})).placeAt(frag, "first");
				assert.strictEqual(simple, frag.firstChild);
				simple.destroy();
			},

			placeAsOnlyNode: function () {
				var frag = getFragment();
				simple = (new SimpleWidget({id: "simple"})).placeAt(frag, "only");
				assert.strictEqual(frag.childNodes.length, 1);
				assert.strictEqual(simple, frag.firstChild);
				simple.destroy();
			},

			placeAtPosition: function () {
				var frag = getFragment();
				simple = (new SimpleWidget({id: "simple"})).placeAt(frag, 2);
				assert.strictEqual(simple, frag.childNodes[2]);
				simple.destroy();
			}
		},

		"#getEnclosingWidget": function () {
			register("test-foo", [HTMLElement, Widget], {
				name: "",
				attr1: 0,
				attr2: 0
			});
			register("test-bar", [HTMLElement, Widget], {
				name: "",
				attr1: 0,
				attr2: 0
			});
			register("test-baz", [HTMLElement, Widget], {
				name: "",
				attr1: 1,
				attr2: 1
			});

			/*jshint multistr: true */
			var html = "<test-foo id='one' name='bob' attr1=10 attr2=10></test-foo> \
			<test-foo id='two' name='is' attr1=5 attr2=10></test-foo> \
			<div id='threeWrapper'> \
				<test-bar id='three' name='your' attr1=5 attr2=5> \
					<div id='three.one'> \
						<div id='three.one.one'></div> \
						<test-bar id='four' name='uncle' attr1=10 attr2=5></test-bar> \
					</div> \
				</test-bar> \
			</div> \
			<div id='not-a-widget'></div>";

			container.innerHTML = html;
			register.parse(container);

			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("not-a-widget")), null,
				"not-a-widget");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three")).name, "your",
				"three");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one")).name, "your",
				"three.one");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one.one")).name,
				"your", "three.one.one");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});

});
