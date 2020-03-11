define([
	"dcl/dcl",
	"delite/register",
	"delite/Widget",
	"delite/Scrollable",
	"./resources/ScrollableTestContainer",
	"./resources/Scrollable-shared"
], function (
	dcl,
	register,
	Widget,
	Scrollable,
	ScrollableTestContainer,
	ScrollableSharedTests
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

	var container, MyScrollableWidget, MyScrollableTestContainer;
	var html = "<test-scrollable-container id='sc1' \
			style='position: absolute; width: 200px; height: 200px;'> \
			<div id='sc1content' style='width: 2000px; height: 2000px;'></div> \
			</test-scrollable-container>\
			<my-scrollable-test-container id='mysc1'> \
			</my-scrollable-test-container> \
			<test-scrollable-container scrollDirection='none' id='sc2'> \
			</test-scrollable-container>";

	registerSuite("delite/Scrollable", {
		before: function () {
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

		tests: {
			"Default CSS": function () {
				var w = (new MyScrollableWidget({id: "mysw"})).placeAt(container);

				assert.strictEqual(w.scrollableNode, w,
					"The scrollableNode should be the widget itself!");
				assert.strictEqual(w.scrollableNodeInRefreshRendering, w.scrollableNode,
					"The scrollableNode should been already set to 'this' when refreshRendering() was called!");
				// The CSS class d-scrollable is expected to be added by the mixin delite/Scrollable
				assert.isTrue(w.scrollableNode.classList.contains("d-scrollable"),
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
				assert.isTrue(w.scrollableNode.classList.contains("d-scrollable"),
					"Expecting d-scrollable CSS class on my-scrollable-widget-sn!");
			}
		},

		// The remaining of the API of the mixin delite/Scrollable is tested
		// in tests/ScrollableTestContainer-markup and tests/ScrollableTestContainer-prog
		// via an ad-hoc widget (tests/ScrollableTestContainer) which uses the mixin.

		after: function () {
			container.parentNode.removeChild(container);
		}
	});

	// Markup use-case
	registerSuite("delite/Scrollable: ScrollableTestContainer in markup", {
		before: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			container.innerHTML = html;
			register("my-scrollable-test-container", [ScrollableTestContainer], {});
			register.deliver();
		},

		after: function () {
			container.parentNode.removeChild(container);
		},

		tests: ScrollableSharedTests.testCases
	});

	// Programmatic creation
	registerSuite("delite/Scrollable: ScrollableTestContainer programatically", {
		before: function () {
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

		after: function () {
			container.parentNode.removeChild(container);
		},

		tests: ScrollableSharedTests.testCases
	});
});
