define([
	"intern!object",
	"intern/chai!assert",
	"delite/a11y",
	"decor/sniff",
	"requirejs-text/text!./resources/a11y.html"
], function (registerSuite, assert, a11y, has, html) {
	var container;
	registerSuite({
		name: "a11y",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			container.innerHTML = html;
		},
		"isTabNavigable": function () {
			assert.ok(a11y.isTabNavigable(document.getElementById("a-with-href")), "a-with-href");
			assert.ok(!a11y.isTabNavigable(document.getElementById("a-without-href")), "a-without-href");
			assert.ok(a11y.isTabNavigable(document.getElementById("button")), "button");
			assert.ok(a11y.isTabNavigable(document.getElementById("input")), "input");
			assert.ok(a11y.isTabNavigable(document.getElementById("object")), "object");
			assert.ok(a11y.isTabNavigable(document.getElementById("select")), "select");
			assert.ok(a11y.isTabNavigable(document.getElementById("textarea")), "textarea");
			assert.ok(!a11y.isTabNavigable(document.getElementById("empty")), "empty");
			assert.ok(a11y.isTabNavigable(document.getElementById("zero-tabindex-div")), "zero-tabindex-div");
			assert.ok(!a11y.isTabNavigable(document.getElementById("no-tabindex-div")), "no-tabindex-div");
			assert.ok(!a11y.isTabNavigable(document.getElementById("iframe")), "iframe");
		},
		"findTabundefinedOnEmpty": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("empty"), undefined);
			assert.strictEqual(a11y.getLastInTabbingOrder("empty"), undefined);
		},
		"findTabElements": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("div-container"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("a-without-href-container"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("a-with-href-container").id, "a-with-href");

			assert.strictEqual(a11y.getFirstInTabbingOrder("button-container").id, "button");
			assert.strictEqual(a11y.getFirstInTabbingOrder("input-container").id, "input");
			assert.strictEqual(a11y.getFirstInTabbingOrder("object-container").id, "object");
			assert.strictEqual(a11y.getFirstInTabbingOrder("select-container").id, "select");
			assert.strictEqual(a11y.getFirstInTabbingOrder("textarea-container").id, "textarea");
			assert.strictEqual(a11y.getLastInTabbingOrder("div-container"), undefined);
			assert.strictEqual(a11y.getLastInTabbingOrder("a-without-href-container"), undefined);
			assert.strictEqual(a11y.getLastInTabbingOrder("a-with-href-container").id, "a-with-href");

			assert.strictEqual(a11y.getLastInTabbingOrder("button-container").id, "button");
			assert.strictEqual(a11y.getLastInTabbingOrder("input-container").id, "input");
			assert.strictEqual(a11y.getLastInTabbingOrder("object-container").id, "object");
			assert.strictEqual(a11y.getLastInTabbingOrder("select-container").id, "select");
			assert.strictEqual(a11y.getLastInTabbingOrder("textarea-container").id, "textarea");
		},
		"findTabOnElementRatherThanString": function () {
			assert.strictEqual("a-with-href",
				a11y.getFirstInTabbingOrder(document.getElementById("a-with-href-container")).id);
			assert.strictEqual("a-with-href",
				a11y.getLastInTabbingOrder(document.getElementById("a-with-href-container")).id);
		},
		"findTabSkipDisabled": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("skip-disabled").id, "not-disabled-input");
			assert.strictEqual(a11y.getLastInTabbingOrder("skip-disabled").id, "not-disabled-input");
		},
		"findTabZeroTabindex": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("zero-tabindex-div-container").id, "zero-tabindex-div");
			assert.strictEqual(a11y.getFirstInTabbingOrder("zero-tabindex-input-container").id, "zero-tabindex-input");
			assert.strictEqual(a11y.getLastInTabbingOrder("zero-tabindex-div-container").id, "zero-tabindex-div");
			assert.strictEqual(a11y.getLastInTabbingOrder("zero-tabindex-input-container").id, "zero-tabindex-input");
		},
		"findTabPositiveTabindex": function () {
			assert.strictEqual("positive-tabindex-input1a",
				a11y.getFirstInTabbingOrder("positive-tabindex-mixed-with-no-tabindex").id);
			assert.strictEqual("positive-tabindex-input3a",
				a11y.getFirstInTabbingOrder("positive-tabindex").id);
			assert.strictEqual("no-tabindex-input2",
				a11y.getLastInTabbingOrder("positive-tabindex-mixed-with-no-tabindex").id);
			assert.strictEqual(a11y.getLastInTabbingOrder("positive-tabindex").id, "positive-tabindex-input4b");
		},
		"findTabSkipMinusOneTabindex": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("skip-minus-one").id, "not-minus-one-input");
			assert.strictEqual(a11y.getLastInTabbingOrder("skip-minus-one").id, "not-minus-one-input");
		},
		"findTabDescend": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("descend").id, "child-input1");
			assert.strictEqual(a11y.getLastInTabbingOrder("descend").id, "child-input2");
		},
		"findTabOuterInner": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("outer-inner-container").id, "outer1");
			assert.strictEqual(a11y.getLastInTabbingOrder("outer-inner-container").id, "inner2");
		},

		"skipNotShown": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("hidden-element-container"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("hidden-container-tabindex-zero"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("hidden-container-no-tabindex"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("container-with-hidden-containers"), undefined);

			assert.strictEqual(a11y.getFirstInTabbingOrder("display-none-element-container"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("display-none-container-tabindex-zero"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("display-none-container-no-tabindex"), undefined);
			assert.strictEqual(a11y.getFirstInTabbingOrder("container-with-display-none-containers"), undefined);
		},
		"multiDigitTabIndex": function () {
			assert.strictEqual(a11y.getFirstInTabbingOrder("multiDigitTabIndex").name, "one", "first");
			assert.strictEqual(a11y.getLastInTabbingOrder("multiDigitTabIndex").name, "eleven", "last");
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
