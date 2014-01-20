define([
	"dcl/dcl",
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-class",
	"delite/register",
	"delite/Widget",
	"delite/Scrollable",
	"./ScrollableTestContainer",
	"./Scrollable-shared"
], function (dcl, registerSuite, assert, domClass, register, Widget, 
	Scrollable, ScrollableTestContainer, ScrollableSharedTests) {
		
	var container, MyScrollableWidget, MyScrollableTestContainer;
	/*jshint multistr: true */
	var html = "<test-scrollable-container id='sc1' \
			style='position: absolute; width: 200px; height: 200px;'> \
			<div id='sc1content' style='width: 2000px; height: 2000px;'></div> \
			</test-scrollable-container>\
			<my-scrolable-test-container id='mysc1'> \
			</my-scrolable-test-container> \
			<test-scrollable-container scrollDirection='none' id='sc2'> \
			</test-scrollable-container>";

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
		
		"Default CSS" : function () {
			var w = (new MyScrollableWidget({id: "mysw"})).placeAt(container);
			w.startup();
			w.validateRendering();
			assert.isTrue(domClass.contains(w.scrollableNode, "d-scrollable"), // class added by the mixin delite/Scrollable
				"Expecting d-scrollable CSS class!");
		},
		
		// The remaining of the API of the mixin delite/Scrollable is tested
		// in tests/ScrollableTestContainer-markup and tests/ScrollableTestContainer-prog
		// via an ad-hoc widget (tests/ScrollableTestContainer) which uses the mixin.
		 
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
	
	// Markup use-case
	
	var suite = {
		name: "delite/Scrollable: ScrollableTestContainer in markup",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			container.innerHTML = html;
			register("my-scrolable-test-container", [ScrollableTestContainer], {});
			register.parse();
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	};

	dcl.mix(suite, ScrollableSharedTests);

	registerSuite(suite);
	
	// Programatic creation 
	
	suite = {
		name: "delite/Scrollable: ScrollableTestContainer programatically",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			
			MyScrollableTestContainer = register("my-sc-prog", [ScrollableTestContainer], {});

			var w = new ScrollableTestContainer({ id: "sc1" });
			w.style.position = "absolute";
			w.style.width = "200px";
			w.style.height = "200px";
			container.appendChild(w);
			w.startup();

			var innerContent = document.createElement("div");
			innerContent.id = "sc1content";
			innerContent.style.width = "2000px";
			innerContent.style.height = "2000px";
			w.appendChild(innerContent);
			w.startup();

			w = new MyScrollableTestContainer({ id: "mysc1" });
			container.appendChild(w);
			w.startup();

			w = new ScrollableTestContainer({ id: "sc2" });
			w.scrollDirection = "none";
			container.appendChild(w);
			w.startup();
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	};

	dcl.mix(suite, ScrollableSharedTests);

	registerSuite(suite);
});
