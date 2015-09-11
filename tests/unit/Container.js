define([
	"intern!object",
	"intern/chai!assert",
	"delite/a11y",
	"delite/handlebars",
	"delite/register",
	"delite/Widget",
	"delite/Container"
], function (registerSuite, assert, a11y, handlebars, register, Widget, Container) {
	var container, PlainWidget, TestContainer, TestContained, html, zero, two, four;
	/*jshint multistr: true */
	html = "<label for='input'>before:</label><input id='input'/> \
		<test-container id='container'> \
			<!-- comment just to make sure that numbering isn't thrown off --> \
			<test-contained id='zero'></test-contained> \
			<test-contained id='one'></test-contained> \
			<test-contained id='two'></test-contained> \
			<plain-widget id='three'></plain-widget> \
			<!-- at least for now it needs to have a widget ID to be returned by getChildren() --> \
			<div id='four' widgetId='four'></div> \
		</test-container> \
		<plain-widget id='outside'></plain-widget> \
		<test-contained id='outsideCont'></test-contained>";


	// Convert result of querySelectorAll() etc. into array of strings
	function getStrings(res) {
		return Array.prototype.map.call(res, function (elem) {
			return elem.innerHTML;
		});
	}

	registerSuite({
		name: "Container",

		setup: function () {
			PlainWidget = register("plain-widget", [HTMLElement, Widget], {});
			TestContainer = register("test-container", [HTMLElement, Widget, Container], {});
			TestContained = register("test-contained", [HTMLElement, Widget], {});
		},

		basic: {
			setup: function () {
				container = document.createElement("div");
				document.body.appendChild(container);
				container.innerHTML = html;
				register.parse(container);
			},

			getChildren: function () {
				var c = document.getElementById("container");
				var children = c.getChildren();
				assert.strictEqual(children.length, 5);
				assert.strictEqual(children[0].id, "zero");
				assert.strictEqual(children[1].id, "one");
				assert.strictEqual(children[2].id, "two");
				assert.strictEqual(children[3].id, "three");
				assert.strictEqual(children[4].id, "four");
			},

			getIndexOfChild: function () {
				var c = document.getElementById("container");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("zero")), 0, "zero test");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("one")), 1, "one test");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("two")), 2, "two test");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("three")), 3, "threetest");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("four")), 4, "four test");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("outside")), -1, "outside test");
				assert.strictEqual(c.getIndexOfChild(document.getElementById("outsideCont")), -1, "outsideCont test");
			},

			removeChild: function () {
				var c = document.getElementById("container");
				var children = c.getChildren();
				assert.strictEqual(children.length, 5);
				zero = document.getElementById("zero");
				c.removeChild(zero);
				two = document.getElementById("two");
				c.removeChild(1); // should remove "two" - because zero is already removed
				four = document.getElementById("four");
				c.removeChild(four);
				children = c.getChildren();
				assert.strictEqual(children.length, 2);
				assert.strictEqual(children[0].id, "one");
				assert.strictEqual(children[1].id, "three");
			},

			addChild: function () {
				var c = document.getElementById("container");
				// Add child at beginning
				c.addChild(zero, 0);
				var children = c.getChildren();
				assert.strictEqual(children.length, 3);
				assert.strictEqual(children[0].id, "zero", "after addChild(zero), zero");
				assert.strictEqual(children[1].id, "one", "after addChild(zero), one");
				assert.strictEqual(children[2].id, "three", "after addChild(zero), three");

				// Add child in middle
				c.addChild(two, 2);
				children = c.getChildren();
				assert.strictEqual(children.length, 4);
				assert.strictEqual(children[0].id, "zero", "after addChild(two), zero");
				assert.strictEqual(children[1].id, "one", "after addChild(two), one");
				assert.strictEqual(children[2].id, "two", "after addChild(two), two");
				assert.strictEqual(children[3].id, "three", "after addChild(two), three");

				// Add a DOMNode at the end
				c.addChild(four);
				children = c.getChildren();
				assert.strictEqual(children.length, 5);
				assert.strictEqual(children[0].id, "zero", "after addChild(four), zero");
				assert.strictEqual(children[1].id, "one", "after addChild(four), one");
				assert.strictEqual(children[2].id, "two", "after addChild(four), two");
				assert.strictEqual(children[3].id, "three", "after addChild(four), three");
				assert.strictEqual(children[4].id, "four", "after addChild(four), four");

				// Add child at end
				c.addChild(new TestContained({id: "five"}));
				children = c.getChildren();
				assert.strictEqual(children.length, 6);
				assert.strictEqual(children[0].id, "zero", "after addChild(five), zero");
				assert.strictEqual(children[1].id, "one", "after addChild(five), one");
				assert.strictEqual(children[2].id, "two", "after addChild(five), two");
				assert.strictEqual(children[3].id, "three", "after addChild(five), three");
				assert.strictEqual(children[4].id, "four", "after addChild(five), four");
				assert.strictEqual(children[5].id, "five", "after addChild(five), five");

				// Add child at end with explicit position specified
				c.addChild(new TestContained({id: "six"}), 6);
				children = c.getChildren();
				assert.strictEqual(children.length, 7);
				assert.strictEqual(children[0].id, "zero", "after addChild(six), zero");
				assert.strictEqual(children[1].id, "one", "after addChild(six), one");
				assert.strictEqual(children[2].id, "two", "after addChild(six), two");
				assert.strictEqual(children[3].id, "three", "after addChild(six), three");
				assert.strictEqual(children[4].id, "four", "after addChild(six), four");
				assert.strictEqual(children[5].id, "five", "after addChild(six), five");
				assert.strictEqual(children[6].id, "six", "after addChild(six), five");
			},

			teardown: function () {
				container.parentNode.removeChild(container);
			}
		},

		notifications: function () {
			var log = [], addEventLog = [], removeEventLog = [];
			var MyContainer = register("my-container", [HTMLElement, Container], {
				onAddChild: register.superCall(function (sup) {
					return function (child) {
						sup.apply(this, arguments);
						log.push(child.id);
					};
				})
			});

			// Create and attach a container.
			var container = new MyContainer();
			container.on("delite-add-child", function (evt) {
				addEventLog.push(evt.child.id);
			});
			container.on("delite-remove-child", function (evt) {
				removeEventLog.push(evt.child.id);
			});
			container.placeAt(document.body);

			// Adding children should call attachedCallback() on the children, and also call onAddChild(),
			// and also emit a delite-add-child event.
			var a1 = new PlainWidget({id: "a1"}),
				a2 = new PlainWidget({id: "a2"}),
				a3 = new PlainWidget({id: "a3"}),
				ib1 = new PlainWidget({id: "ib1"}),
				ib3 = new PlainWidget({id: "ib3"});
			container.appendChild(a1);
			container.appendChild(a2);
			container.appendChild(a3);
			container.insertBefore(ib1, a1);
			container.insertBefore(ib3, a3);
			assert.deepEqual(log, ["a1", "a2", "a3", "ib1", "ib3"], "log");
			assert.deepEqual(addEventLog, ["a1", "a2", "a3", "ib1", "ib3"], "addEventLog");
			assert.deepEqual(["ib1", "a1", "a2", "ib3", "a3"],
				Array.prototype.map.call(container.children, function (child) { return child.id; }), "children");

			assert(Array.prototype.every.call(container.children, function (child) { return child.attached; }),
				"all children attached");

			// Removing children should emit a delite-remove-child event.
			container.removeChild(1);
			container.removeChild(ib3);
			assert.deepEqual(removeEventLog, ["a1", "ib3"], "removeEventLog");

			// TODO: Add test where placeAt() is called after the appendChild() calls.
			// Should just check that attachedCallback() called for every descendant.
			// Requires updating placeAt()

			// cleanup
			container.parentNode.removeChild(container);
		},

		// Test when containerNode points to a different node.
		containerNode: {
			setup: function () {
				TestContainer = register("my-container-node", [HTMLElement, Container], {
					render: function () {
						// during render(), this.appendChild() should always go to root node, so
						// "last" should be a sibling of "first"
						var s1 = this.ownerDocument.createElement("span");
						s1.innerHTML = "first";
						this.appendChild(s1);

						this.appendChild(this.containerNode = this.ownerDocument.createElement("div"));

						var s3 = this.ownerDocument.createElement("span");
						s3.innerHTML = "last";
						this.appendChild(s3);
					}
				});
			},

			programmatic: function () {
				// add a started container
				var myWidget = new TestContainer();
				myWidget.placeAt(document.body);

				// appendChild() and insertBefore() should add children to the containerNode, not the root node
				var child1 = document.createElement("span");
				child1.innerHTML = "child 1";
				myWidget.appendChild(child1);

				var child3 = document.createElement("span");
				child3.innerHTML = "child 3";
				myWidget.insertBefore(child3, null);	// this should work the same as appendChild()

				var child2 = document.createElement("span");
				child2.innerHTML = "child 2";
				myWidget.insertBefore(child2, child3);

				assert.deepEqual(getStrings(myWidget.getChildren()),
					["child 1", "child 2", "child 3"], "getChildren()");
				assert.deepEqual(getStrings(myWidget.querySelectorAll("span")),
					["first", "child 1", "child 2", "child 3", "last"], "all children, from root node");

				// cleanup
				myWidget.destroy();
			},

			declarative: function () {
				var container = document.createElement("div");
				container.innerHTML = "<my-container-node>" +
					"<span>child 1</span> <span>child 2</span> <span>child 3</span>" +
					"</my-container-node>";
				document.body.appendChild(container);
				register.parse(container);

				var myWidget = container.firstElementChild;
				assert.deepEqual(getStrings(myWidget.getChildren()),
					["child 1", "child 2", "child 3"], "getChildren()");
				assert.deepEqual(getStrings(myWidget.querySelectorAll("span")),
					["first", "child 1", "child 2", "child 3", "last"], "all children, from root node");

				// cleanup
				container.parentNode.removeChild(container);
			}
		},

		"dynamically updating a template": function () {
			register("dynamic-template-container", [HTMLElement, Container], {
				label: "my label",
				reversed: false,
				createdCallback: function () {
					this.notifyCurrentValue("reversed");
				},
				computeProperties: function (props) {
					if ("reversed" in props) {
						this.template = this.reversed ?
							handlebars.compile(
								"<template>" +
									"<div data-attach-point=containerNode></div>" +
									" <span data-attach-point=labelNode>{{label}}</span>" +
								"</template>"
							) :
							handlebars.compile(
								"<template>" +
								"<span data-attach-point=labelNode>{{label}}</span>: " +
								"<div data-attach-point=containerNode></div>" +
								"</template>"
							);
					}
				}
			});

			// Create widget and test that the "label: containerNode" template is used.
			var container = document.createElement("div");
			container.innerHTML = "<dynamic-template-container>" +
					"<span>child 1</span> <span>child 2</span> <span>child 3</span>" +
				"</dynamic-template-container>";
			document.body.appendChild(container);
			register.parse(container);
			var myWidget = container.children[0];
			assert.strictEqual(myWidget.children[0], myWidget.labelNode, "reversed=false, first child");
			assert.strictEqual(myWidget.children[1], myWidget.containerNode, "reversed=false, second child");
			assert.deepEqual(getStrings(myWidget.getChildren()), ["child 1", "child 2", "child 3"], "getChildren()");
			assert.strictEqual(myWidget.textContent.trim(), "my label: child 1 child 2 child 3");

			// Then test that children moved when widget template changed.
			myWidget.reversed = true;
			myWidget.label = "reversed";
			myWidget.deliver();
			assert.strictEqual(myWidget.children[0], myWidget.containerNode, "reversed=true, first child");
			assert.strictEqual(myWidget.children[1], myWidget.labelNode, "reversed=true, second child");
			assert.deepEqual(getStrings(myWidget.getChildren()), ["child 1", "child 2", "child 3"], "getChildren()");
			assert.strictEqual(myWidget.textContent.trim(), "child 1 child 2 child 3 reversed");

			// cleanup
			container.parentNode.removeChild(container);
		}
	});
});
