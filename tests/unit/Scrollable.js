define([
	"dcl/dcl",
	"intern!object",
	"intern/chai!assert",
	"requirejs-dplugins/jquery!attributes/classes",	// hasClass()
	"delite/register",
	"delite/Widget",
	"delite/Scrollable",
	"./resources/ScrollableTestContainer",
	"./resources/Scrollable-shared"
], function (dcl, registerSuite, assert, $, register, Widget,
	Scrollable, ScrollableTestContainer, ScrollableSharedTests) {

	var container, MyScrollableWidget, MyScrollableTestContainer;
	/*jshint multistr: true */
	var html = "<test-scrollable-container id='sc1' \
			style='position: absolute; width: 200px; height: 200px;'> \
			<div id='sc1content' style='width: 2000px; height: 2000px;'></div> \
			</test-scrollable-container>\
			<my-scrollable-test-container id='mysc1'> \
			</my-scrollable-test-container> \
			<test-scrollable-container scrollDirection='none' id='sc2'> \
			</test-scrollable-container>";

	registerSuite({
		name: "delite/Scrollable",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			MyScrollableWidget = register("my-scrollable-widget", [HTMLElement, Widget, Scrollable], {
				// to be able to check that scrollableNode is already set to the 
				// correct value when refreshRendering() gets called.
				scrollableNodeInRefreshRendering: null,

				refreshRendering: function () {
					// Store the value at the moment refreshRendering() was called,
					// such that the test can later check it.
					this.scrollableNodeInRefreshRendering = this.scrollableNode;
				}
			});
		},

		"Default CSS": function () {
			var w = (new MyScrollableWidget({id: "mysw"})).placeAt(container);

			assert.strictEqual(w.scrollableNode, w,
				"The scrollableNode should be the widget itself!");
			assert.strictEqual(w.scrollableNodeInRefreshRendering, w.scrollableNode,
				"The scrollableNode should been already set to 'this' when refreshRendering() was called!");
			// The CSS class d-scrollable is expected to be added by the mixin delite/Scrollable
			assert.isTrue($(w.scrollableNode).hasClass("d-scrollable"),
				"Expecting d-scrollable CSS class!");
		},

		"scrollableNode property": function () {
			// Test case for a custom widget which sets the scrollableNode in its render().
			var ScrollableWithCustomScrollableNode = register("my-scrollable-widget-sn",
				[HTMLElement, Widget, Scrollable], {
					// to be able to check that scrollableNode isn't changed afterwards,
					// store here the instance of custom node set in render().
					createdScrollableNode: null,

					render: dcl.superCall(function (sup) {
						return function () {
							this.scrollableNode = document.createElement("div");
							this.createdScrollableNode = this.scrollableNode;
							this.appendChild(this.scrollableNode);
							sup.apply(this, arguments);
						};
					})
				});
			var w = (new ScrollableWithCustomScrollableNode()).placeAt(container);
			assert.strictEqual(w.scrollableNode, w.createdScrollableNode,
				"The scrollableNode property has changed since it was set in render!");
			// Test that the CSS class d-scrollable has been added by the mixin delite/Scrollable
			// on the custom scrollableNode.
			assert.isTrue($(w.scrollableNode).hasClass("d-scrollable"),
				"Expecting d-scrollable CSS class on my-scrollable-widget-sn!");
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
			register("my-scrollable-test-container", [ScrollableTestContainer], {});
			register.deliver();
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	};

	function mix(a, b) {
		for (var n in b) {
			a[n] = b[n];
		}
	}

	mix(suite, ScrollableSharedTests.testCases);

	registerSuite(suite);

	// Programmatic creation

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
			w.placeAt(container);

			var innerContent = document.createElement("div");
			innerContent.id = "sc1content";
			innerContent.style.width = "2000px";
			innerContent.style.height = "2000px";
			w.appendChild(innerContent);

			w = new MyScrollableTestContainer({ id: "mysc1" });
			w.placeAt(container);

			w = new ScrollableTestContainer({ id: "sc2" });
			w.scrollDirection = "none";
			w.placeAt(container);
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	};

	mix(suite, ScrollableSharedTests.testCases);

	registerSuite(suite);
});
