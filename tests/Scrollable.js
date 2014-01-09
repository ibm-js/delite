define([
	"dcl/dcl",
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-class",
	"delite/register",
	"delite/Widget",
	"delite/Scrollable"
], function (dcl, registerSuite, assert, domClass, register, Widget, Scrollable) {
	var container, MyScrollableWidget;

	registerSuite({
		name: "delite/Scrollable",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			MyScrollableWidget = register("my-scrollable-widget", [HTMLElement, Widget, Scrollable], {
				buildRendering: dcl.superCall(function (sup) {
					return function () {
						sup.apply(this, arguments);
					};
				})
			});
		},
		"parse" : function () {
			register.parse(container);
		},
		
		"Default CSS" : function () {
			var w = (new MyScrollableWidget({id: "mysw"})).placeAt(container);
			w.startup();
			w.validateRendering();
			
			assert.isTrue(domClass.contains(w.scrollableNode, "d-scrollable")); // via the mixin delite/Scrollable
		},
		
		// The remaining of the API of the mixin delite/Scrollable is tested
		// in tests/ScrollableTestContainer-markup and tests/ScrollableTestContainer-prog
		// via an ad-hoc widget (tests/ScrollableTestContainer) which uses the mixin.
		 
		teardown: function () {
			var body = document.body;
			while (body.firstChild) {
				body.removeChild(body.firstChild);
			}
		}
	});
});
