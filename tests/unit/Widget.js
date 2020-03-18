define([
	"dcl/dcl",
	"delite/register",
	"delite/Widget",
	"requirejs-domready/domReady!"
], function (
	dcl,
	register,
	Widget
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

	var container;

	var SimpleWidget, TestDir, simple, pane1;

	function getFragment () {
		var frag = document.createDocumentFragment();
		frag.appendChild(document.createElement("div"));
		frag.appendChild(document.createElement("div"));
		frag.appendChild(document.createElement("div"));
		return frag;
	}

	// tabIndex is problematic, see https://github.com/ibm-js/delite/issues/34.
	registerSuite("Widget", {
		before: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		tests: {
			"tabIndex": {
				topLevel: function () {
					// Test when tabIndex is declared top level, in the props passed to register().

					var SpecialNames = register("test-tabindex-names", [HTMLElement, Widget], {
						tabIndex: "0",

						afterInitializeRendering: function () {
							this.observe(function (props) {
								if ("tabIndex" in props) {
									this.watchedTabIndex = this.tabIndex;
								}
							}.bind(this));
						}
					});
					var widget = new SpecialNames({ });
					container.appendChild(widget);

					setTimeout(this.async().callback(function () {
						widget.tabIndex = "3";
						widget.deliver();
						assert.strictEqual(widget.watchedTabIndex, "3", "reported on widget");
					}), 0);
				},

				mixin: function () {
					// And test when tabIndex is declared in a mixin.
					var SpecialNamesMixin = dcl(Widget, {
						tabIndex: {
							set: function (val) {
								// In a real widget, if you declare a tabIndex property then you better have a custom
								// setter too.  Otherwise, tabIndex updates won't have any effect.  For testing
								// purposes we are just saving the new value without applying it to any
								// this.focusNode Element.
								this._set("tabIndex", val);
							},
							get: function () {
								return this._has("tabIndex") ? this._get("tabIndex") : "0";
							}
						},

						constructor: function () {
							this.observe(function (props) {
								if ("tabIndex" in props) {
									this.watchedTabIndex = this._get("tabIndex");
								}
							}.bind(this));
						}
					});

					var SpecialExtendedWidget = register("test-tabindex-names-extended",
						[HTMLElement, SpecialNamesMixin], {
						tabIndex: "0",
						value: "0",
						isrange: false,
						isbool: false,

						afterInitializeRendering: function () {
							this.observe(function (props) {
								if ("tabIndex" in props) {
									this.watchedTabIndex = this._get("tabIndex");
								}
							}.bind(this));
						}
					});

					var extended = new SpecialExtendedWidget({ });
					extended.tabIndex = "5";
					container.appendChild(extended);

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
					container.innerHTML =
						"<test-tabindex-names-extended id=specialNames value=5 isrange isbool tabIndex=8/>";
					var declarative = document.getElementById("specialNames");
					register.upgrade(declarative);
					assert.isFalse(declarative.hasAttribute("tabindex"), "tabindex attr removed");
					assert.isTrue(declarative.isrange, "isrange set");
					assert.isTrue(declarative.isbool, "isbool set");
					assert.strictEqual(declarative.value, "5", "value");
				},

				notInPrototype: function () {
					// And, test when the widget prototype doesn't declare tabIndex at all.
					// Then the widget should just act like a simple <div>, passing tabIndex through to root node.
					var SimpleWidget2 = register("tabindex-not-in-prototype", [HTMLElement, Widget], { });
					var simple2 = new SimpleWidget2({ tabIndex: 5 });
					container.appendChild(simple2);

					var d = this.async(1000);

					setTimeout(d.callback(function () {
						// make sure that tabIndex was correctly set
						assert.strictEqual(simple2.getAttribute("tabindex"), "5", "programmatic set");
					}), 10);

					return d;
				},

				declarativeTabIndexRemoved: function () {
					// And also test for declarative widgets, to make sure the tabIndex property is
					// removed from the root node, to prevent an extra tab stop
					container.innerHTML =
						"<tabindex-not-in-prototype id=simple tabIndex=8></tabindex-not-in-prototype>";
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

			// Widget listens for changes to dir and then sets style.direction and the d-rtl class.
			"dir": {
				before: function () {
					TestDir = register("test-dir", [HTMLElement, Widget], {});
				},

				tests: {
					"programmatic": function () {
						var myWidget = new TestDir({
							dir: "rtl"
						});
						container.appendChild(myWidget);

						assert.strictEqual(myWidget.style.direction, "rtl", "style.direction");
						assert(myWidget.classList.contains("d-rtl"), "has d-rtl class");

						myWidget.dir = "ltr";
						myWidget.deliver();
						assert.strictEqual(myWidget.style.direction, "ltr", "style.direction 2");
						assert.isFalse(myWidget.classList.contains("d-rtl"), "doesn't have d-rtl class");
					},

					"programmatic inherit dir": function () {
						var bodyOriginalDir = window.getComputedStyle(document.body).direction;

						try {
							// setting dir to "" should inherit from <body>
							document.body.dir = "rtl";
							var myWidget = new TestDir();
							container.appendChild(myWidget);
							assert(myWidget.classList.contains("d-rtl"), "has d-rtl class");
						} finally {
							// Revert changes made to body.dir.   Should be able to just say dir = "" but due to
							// apparent bugs in Safari 7 (used during saucelabs testing), that leaves the browser
							// in an RTL state and the Scrollable tests start to fail.
							document.body.dir = bodyOriginalDir;
						}
					},

					"declarative": function () {
						container.innerHTML = "<test-dir id=dirTest dir='rtl'></test-dir>";

						setTimeout(this.async().callback(function () {
							var declarative = document.getElementById("dirTest");
							assert.strictEqual(declarative.style.direction, "rtl", "style.direction");
							assert(declarative.classList.contains("d-rtl"), "has d-rtl class");
						}), 0);
					}
				}
			},

			"widgetId": function () {
				var TestWidget = register("test-lifecycle-widget", [HTMLElement, Widget], { });
				var w1 = new TestWidget(),
					w2 = new TestWidget();

				assert(w1.widgetId, "w1.widgetId");
				assert(w2.widgetId, "w2.widgetId");
				assert.notStrictEqual(w1.widgetId, w2.widgetId, "id's are different");
			},

			"baseClass": function () {
				// First check that baseClass specified in prototype gets set
				var TestWidget = register("test-lifecycle-widget2", [HTMLElement, Widget], {
					baseClass: "base2"
				});
				var myWidget = new TestWidget();
				container.appendChild(myWidget);

				assert(myWidget.classList.contains("base2"), "baseClass is base2");

				// Then test that baseClass specified as widget parameter gets set
				var myWidgetCustom = new TestWidget();
				myWidgetCustom.baseClass = "customBase";
				container.appendChild(myWidgetCustom);
				myWidgetCustom.deliver();

				assert(myWidgetCustom.classList.contains("customBase"), "baseClass is customBase");
			},

			"placeAt": {
				before: function () {
					SimpleWidget = register("simple-widget-place-at", [HTMLElement, Widget], {
						initializeRendering: function () {
							this.containerNode = document.createElement("div");
							this.appendChild(this.containerNode);
						}
					});
				},

				tests: {
					"Place a child": function () {
						// create a SimpleWidget
						simple = (new SimpleWidget({id: "simple-place-at-id"})).placeAt(container);
						assert.strictEqual(container, simple.parentNode, "simple is child of container");
						assert(simple.attached, "connectedCallback() ran");
					},

					"Place as widget child": function () {
						// add the child to the SimpleWidget now
						pane1 = (new SimpleWidget({ title: "pane1" })).placeAt("simple-place-at-id");
						assert.strictEqual(pane1, simple.containerNode.children[0], "pane1 is child of SimpleWidget");
						assert.strictEqual(simple.containerNode, pane1.parentNode,
							"pane1 added to simple.containerNode");
					},

					"Place as widget child ordered": function () {
						// add this child (created second) as the new first child
						var pane2 = (new SimpleWidget({ title: "pane2" })).placeAt("simple-place-at-id", 0);
						assert.strictEqual(simple.containerNode, pane2.parentNode,
							"pane2 added to simple.containerNode");
						assert.strictEqual(pane2, simple.containerNode.children[0],
							"pane2 is new first child of SimpleWidget");
						assert.strictEqual(pane1, simple.containerNode.children[1],
							"pane1 now second child of SimpleWidget");
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
						var pane3 = (new SimpleWidget({ title: "pane3" })).placeAt("simple-place-at-id", "first");
						assert.strictEqual(simple.containerNode, pane3.parentNode,
							"pane3 added to simple.containerNode");
						assert.strictEqual(pane3, simple.containerNode.children[0],
							"pane3 is new first child of SimpleWidget");
						assert.ok(pane3.attached,
							"pane3 was automatically attached because simple was already attached");
					},

					"Place last widget": function () {
						var pane4 = (new SimpleWidget({ title: "pane4" })).placeAt(simple.containerNode, "last");
						assert.strictEqual(pane4,
							simple.containerNode.children[simple.containerNode.children.length - 1],
							"pane4 is new last child of SimpleWidget");
						assert.ok(pane4.attached,
							"pane4 was automatically attached because simple was already attached");
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

				container.innerHTML = "<test-foo id='one' name='bob' attr1=10 attr2=10></test-foo> \
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

				register.deliver();

				assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("not-a-widget")),
					null, "not-a-widget");
				assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three")).name,
					"your", "three");
				assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one")).name,
					"your", "three.one");
				assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one.one")).name,
					"your", "three.one.one");
			},

			"#getParent": function () {
				var MyWidget = register("test-get-parent", [HTMLElement, Widget], {
					name: "",
					attr1: 0,
					attr2: 0
				});

				var w = new MyWidget();
				assert.strictEqual(w.getParent(), null, "null if not connected to anything");

				w.placeAt(container);
				assert.strictEqual(w.getParent(), null, "null if connected but no parent widget");

				var div = document.createElement("div");
				w.appendChild(div);
				var w2 = new MyWidget();
				w.appendChild(w2);
				assert.strictEqual(w2.getParent(), w, "getParent() finds grandparent widget");
			},

			"addClass": function () {
				var MyWidget = register("test-add-class", [HTMLElement, Widget], {
					name: "",
					attr1: 0,
					attr2: 0
				});

				var w = new MyWidget();
				w.addClass("foo bar");
				assert.isTrue(w.classList.contains("foo"), "should contain foo in the classList");
				assert.isTrue(w.classList.contains("bar"), "should contain bar in the classList");

				w.addClass("another");
				assert.isTrue(w.classList.contains("another"), "should contain another in the classList");
			},

			"removeClass": function () {
				var MyWidget = register("test-remove-class", [HTMLElement, Widget], {
					name: "",
					attr1: 0,
					attr2: 0
				});

				var w = new MyWidget();
				w.addClass("foo bar another");
				assert.isTrue(w.classList.contains("foo"), "should contain foo in the classList");
				assert.isTrue(w.classList.contains("bar"), "should contain bar in the classList");
				assert.isTrue(w.classList.contains("another"), "should contain another in the classList");

				w.removeClass("foo bar");
				assert.isFalse(w.classList.contains("foo"), "should not contain foo in the classList");
				assert.isFalse(w.classList.contains("bar"), "should not contain bar in the classList");
				assert.isTrue(w.classList.contains("another"), "should contain another in the classList");

				w.removeClass("another");
				assert.isFalse(w.classList.contains("another"), "should not contain another in the classList");
			},

			"toggleClass": function () {
				var MyWidget = register("test-toggle-class", [HTMLElement, Widget], {
					name: "",
					attr1: 0,
					attr2: 0
				});

				var w = new MyWidget();
				w.addClass("foo bar");
				assert.isTrue(w.classList.contains("foo"), "should contain foo in the classList");
				assert.isTrue(w.classList.contains("bar"), "should contain bar in the classList");

				w.toggleClass("foo");
				assert.isFalse(w.classList.contains("foo"), "should not contain foo in the classList");
				assert.isTrue(w.classList.contains("bar"), "should contain bar in the classList");

				w.toggleClass("foo bar");
				assert.isTrue(w.classList.contains("foo"), "should contain foo in the classList");
				assert.isFalse(w.classList.contains("bar"), "should not contain bar in the classList");

				w.toggleClass("another", false);
				assert.isFalse(w.classList.contains("another"), "should not contain another in the classList");

				w.toggleClass("another", true);
				assert.isTrue(w.classList.contains("another"), "should contain another in the classList");
			}
		},

		after: function () {
			container.parentNode.removeChild(container);
		}
	});

});
