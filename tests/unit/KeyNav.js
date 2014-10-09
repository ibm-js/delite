define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/KeyNav"
], function (registerSuite, assert, register, KeyNav) {
	var container;

	var SimpleKeyNav = register("simple-key-nav", [HTMLElement, KeyNav], {
		descendantSelector: ".child"
	});

	registerSuite({
		name: "KeyNav",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		getNext: function () {
			var skn = new SimpleKeyNav();
			skn.placeAt(container);
			skn.innerHTML = "<div label='not a child'>not a child</div>" +
					"<div>" +
						"<div class=child label='child 1'></div>" +
						"<div class=child label='child 2'>" +
							"<div class=child label='child 3'></div>" +
							"<div class=child label='child 4'>" +
								"<div class=child label='child 5'></div>" +
								"<div label='not a child'>not a child</div> text node " +
							"</div>" +
						"</div>" +
						"<div class=child label='child 6'></div>" +
					"</div>";

			function scanAll(dir) {
				var children = [], child = skn;
				for (var i = 0; i < 7; i++) {
					child = skn.getNext(child, dir);
					children.push(child.getAttribute("label"));
				}
				return children;
			}
			assert.strictEqual(scanAll(1).join(", "), "child 1, child 2, child 3, child 4, child 5, child 6, child 1",
				"children in natural order");

			assert.strictEqual(scanAll(-1).join(", "), "child 6, child 5, child 4, child 3, child 2, child 1, child 6",
				"children in reverse order");
		},

		getNextOnEmptyContainer: function () {
			var skn2 = new SimpleKeyNav();
			skn2.placeAt(container);

			assert.isNull(skn2.getNext(skn2, 1), "forward");
			assert.isNull(skn2.getNext(skn2, -1), "backward");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
