define([
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-class",
	"delite/register",
	"delite/Widget",
	"dojo/domReady!"
], function (registerSuite, assert, domClass, register, Widget) {
	var container;
	registerSuite({
		name: "Widget misc",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// tabIndex is problematic, see https://github.com/ibm-js/delite/issues/34.
		"tabIndex" : function () {
			// Test when tabIndex is declared top level, in the props passed to register().
			// TODO: enable when https://github.com/uhop/dcl/issues/9 is fixed
			/*
			 var SpecialNames = register("test-special-names", [HTMLElement, Widget], {
			 tabIndex: "0",

			 postCreate: function () {
			 this.watch("tabIndex", function(name, o, n){
			 this.watchedTabIndex = n;
			 });
			 }
			 });
			 var widget = new SpecialNames({ });
			 widget.tabIndex = "3";
			 document.body.appendChild(widget);
			 widget.startup();
			 assert.equal("3", widget.watchedTabIndex, "watch fired on widget");
			 */

			// And test when tabIndex is declared in a mixin.
			var SpecialNamesMixin = register.dcl(Widget, {
				tabIndex: "0",

				postCreate: function () {
					this.watch("tabIndex", function(name, o, n){
						this.watchedTabIndex = n;
					});
				}
			});
			var SpecialExtendedWidget = register("test-special-names-extended", [HTMLElement, SpecialNamesMixin], {
				tabIndex: "0",
				value: "0",
				isrange: false,
				isbool: false,

				postCreate: function () {
					this.watch("tabIndex", function(name, o, n){
						this.watchedTabIndex = n;
					});
				}
			});

			var extended = new SpecialExtendedWidget({ });
			extended.tabIndex = "5";
			document.body.appendChild(extended);
			extended.startup();
			assert.equal("5", extended.watchedTabIndex, "watch fired on extended");

			// And also test for declarative widgets, to make sure the tabIndex property is
			// removed from the root node, to prevent an extra tab stop
			container.innerHTML += "<test-special-names-extended id=specialNames value=5 isrange isbool tabIndex=8/>";
			var declarative = document.getElementById("specialNames");
			register.upgrade(declarative);
			assert.isFalse(declarative.hasAttribute("tabindex"), "tabindex attr removed");
			assert.isTrue(declarative.isrange, "isrange set");
			assert.isTrue(declarative.isbool, "isbool set");
			assert.strictEqual("5", declarative.value, "value");

			// Finally, test when the widget prototype doesn't declare tabIndex at all.
			// Then the widget should just act like a simple <div>, passing tabIndex through to root node.
			var SimpleWidget = register("simple-widget", [HTMLElement, Widget], { });
			var simple = new SimpleWidget({ tabIndex: 5 });
			document.body.appendChild(simple);
			simple.startup();

			// make sure that tabIndex was correctly set
			assert.strictEqual("5", simple.getAttribute("tabindex"), "programmatic set");

			// And also test for declarative widgets, to make sure the tabIndex property is
			// removed from the root node, to prevent an extra tab stop
			container.innerHTML += "<simple-widget id=simple tabIndex=8>";
			var simpleDeclarative = document.getElementById("simple");
			register.upgrade(simpleDeclarative);

			// make sure that tabIndex wasn't unset
			assert.strictEqual("8", simpleDeclarative.getAttribute("tabindex"), "declarative set");
		},

		widgetId : function() {
			var TestWidget = register("test-lifecycle-widget", [HTMLElement, Widget], { });
			var w1 = new TestWidget(),
				w2 = new TestWidget();

			assert(w1.widgetId, "w1.widgetId");
			assert(w2.widgetId, "w2.widgetId");
			assert.notStrictEqual(w1.widgetId, w2.widgetId, "id's are different");
		},

		baseClass : function() {
			// First check that baseClass specified in prototype gets set
			var TestWidget = register("test-lifecycle-widget2", [HTMLElement, Widget], {
				baseClass: "base2"
			});
			var myWidget = new TestWidget();
			myWidget.placeAt(container);
			myWidget.startup();

			assert(domClass.contains(myWidget, "base2"), "baseClass is base2");

			// Then test that baseClass specified as widget parameter gets set
			var myWidgetCustom = new TestWidget();
			myWidgetCustom.baseClass = "customBase";
			myWidgetCustom.placeAt(container);
			myWidgetCustom.startup();

			assert(domClass.contains(myWidgetCustom, "customBase"), "baseClass is customBase");
		},

		teardown : function () {
			container.parentNode.removeChild(container);
		}
	});

	registerSuite({
		name: "Widget#placeAt",
		setup: function () {
			container = document.createElement("div");
			container.id = "container-id";
			document.body.appendChild(container);
			SimpleWidget = register("simple-widget-place-at", [HTMLElement, Widget], {
				buildRendering: function () {
					this.containerNode = document.createElement("div");
					this.appendChild(this.containerNode);
				}
			});
		},
		"Place a child" : function () {
			// create a SimpleWidget
			simple = (new SimpleWidget({id: "simple-place-at-id"})).placeAt(container);
			assert.deepEqual(container, simple.parentNode, "simple is child of container");
		},
		"Place as widget child" : function () {
			// add the child to the SimpleWidget now
			pane1 = (new SimpleWidget({ title: "pane1" })).placeAt("simple-place-at-id");
			assert.deepEqual(pane1, simple.getChildren()[0], "pane1 is child of SimpleWidget");
			assert.deepEqual(simple.containerNode, pane1.parentNode, "pane1 added to simple.containerNode not simple");
		},
		"Place as widget child ordered" : function () {
			// add this child (created second) as the new first child
			pane2 = (new SimpleWidget({ title: "pane2" })).placeAt("simple-place-at-id", 0);
			assert.deepEqual(simple.containerNode, pane2.parentNode, "pane2 added to simple.containerNode not simple");
			assert.deepEqual(pane2, simple.getChildren()[0], "pane2 is new first child of SimpleWidget");
			assert.deepEqual(pane1, simple.getChildren()[1], "pane1 is now second child of SimpleWidget");
		},
		"Place before" : function () {
			var TestWidget = register("test-place-before-widget", [HTMLElement, Widget], { });
			var button = (new TestWidget({})).placeAt(container, "before");
			assert.deepEqual(container, button.nextSibling, "button is before tab container");
		},
		"Place before id" : function () {
			var TestWidget = register("test-place-after-widget", [HTMLElement, Widget], { });
			var button = (new TestWidget({})).placeAt("container-id", "before");
			assert.deepEqual(container, button.nextSibling, "button is before tab container");
		},
		"Place first widget" : function () {
			simple.startup();
			pane3 = (new SimpleWidget({ title: "pane3" })).placeAt("simple-place-at-id", "first");
			assert.deepEqual(simple.containerNode, pane3.parentNode, "pane3 added to simple.containerNode not simple")
			assert.deepEqual(pane3, simple.getChildren()[0], "pane3 is new first child of SimpleWidget");
			assert.ok(pane3._started, "pane3 was automatically started because simple was already started");
		},
		"Place last widget" : function () {
			pane4 = (new SimpleWidget({ title: "pane4" })).placeAt(simple.containerNode, "last");
			assert.deepEqual(pane4, simple.getChildren()[simple.getChildren().length - 1], "pane4 is new last child of SimpleWidget");
			assert.ok(pane4._started, "pane4 was automatically started because simple was already started");
		},
		teardown : function () {
			container.parentNode.removeChild(container);
		}
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

	registerSuite({
		name: "Widget#getEnclosingWidget",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
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
			container.innerHTML = html;
			register.parse(container);
		},
		"getEnclosingWidget" : function () {
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("not-a-widget")), null, "not-a-widget");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three")).name, "your", "three");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one")).name, "your", "three.one");
			assert.strictEqual(Widget.prototype.getEnclosingWidget(document.getElementById("three.one.one")).name, "your", "three.one.one");
		},
		teardown : function () {
			container.parentNode.removeChild(container);
		}
	});

});
