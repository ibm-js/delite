define([
	"require",
	"intern!object",
	"intern/chai!assert",
	"requirejs-dplugins/Promise!",
	"delite/DisplayContainer",
	"delite/Widget",
	"delite/register",
	"requirejs-domready/domReady!"
], function (require, registerSuite, assert, Promise, DisplayContainer, Widget, register) {
	var container;
	registerSuite({
		name: "DisplayContainer",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// test with no controller
		original: function () {
			this.timeout = 2500;
			register("test-default-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = document.createElement("test-default-display-container");

			function initView(view) {
				dcontainer.appendChild(view);
				view.style.visibility = "hidden";
				view.style.display = "none";
			}

			function testView(view) {
				assert.strictEqual(view.style.visibility, "visible", "visibility");
				assert.strictEqual(view.style.display, "", "display");
			}

			var view1 = document.createElement("div");
			initView(view1);
			var view2 = document.createElement("div");
			view2.setAttribute("id", "original-view");
			initView(view2);
			dcontainer.placeAt(container);
			var beforeShowCalled = false;
			dcontainer.on("delite-before-show", function () {
				beforeShowCalled = true;
			});
			return dcontainer.show(view1).then(function () {
				assert(beforeShowCalled, "before-show event must be dispatched");
				testView(view1);
			}).then(function () {
				return dcontainer.show("original-view");
			}).then(function () {
				testView(view2);
			});
		},

		hide: function () {
			this.timeout = 2500;
			register("test-hide-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = document.createElement("test-hide-display-container");

			function initView(view) {
				dcontainer.appendChild(view);
				view.style.visibility = "visible";
				view.style.display = "";
			}

			function testView(view) {
				assert.strictEqual(view.style.visibility, "hidden", "visibility");
				assert.strictEqual(view.style.display, "none", "display");
			}

			var view1 = document.createElement("div");
			initView(view1);
			var view2 = document.createElement("div");
			view2.setAttribute("id", "hide-view");
			initView(view2);
			dcontainer.placeAt(container);
			var beforeHideCalled = false;
			dcontainer.on("delite-before-hide", function () {
				beforeHideCalled = true;
			});
			// by node
			return dcontainer.hide(view1).then(function () {
				assert(beforeHideCalled, "before-hide event must be dispatched");
				testView(view1);
			}).then(function () {
				return dcontainer.hide("hide-view");
			}).then(function () {
				testView(view2);
			});
		},

		event: function () {
			this.timeout = 2500;
			var handler;

			function initView(view, id) {
				view.style.visibility = "hidden";
				view.style.display = "none";
				view.setAttribute("id", id + "-event");
			}

			document.addEventListener("delite-display-load", handler = function (event) {
				var view = document.createElement("div");
				initView(view, event.dest);
				event.setChild({
					child: view
				});
			});
			register("test-event-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = document.createElement("test-event-display-container");
			dcontainer.setAttribute("id", "dcontainer");
			dcontainer.placeAt(container);
			var beforeDisplayCalled = false;
			dcontainer.on("delite-before-show", function () {
				beforeDisplayCalled = true;
			});
			// by node
			return dcontainer.show("view1-event").then(function () {
				assert(beforeDisplayCalled, "before show event must be dispatched");
				document.removeEventListener("delite-display-load", handler);
			});
		},

		// test with a controller
		custom: function () {
			this.tiemout = 2500;
			var handler;

			function initView(view, id) {
				view.style.visibility = "hidden";
				view.style.display = "none";
				view.setAttribute("id", id);
			}

			document.addEventListener("delite-display-load", handler = function (event) {
				var view = document.createElement("div");
				initView(view, event.dest);
				event.setChild(new Promise(function (resolve) {	// test passing Promise to setChild()
					setTimeout(function () {
						resolve({child: view});
					}, 10);
				}));
			});
			register("test-custom-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = document.createElement("test-custom-display-container");
			dcontainer.setAttribute("id", "dcontainer");
			dcontainer.placeAt(container);
			function testView(view) {
				assert.strictEqual(view.style.visibility, "visible", "visibility");
				assert.strictEqual(view.style.display, "", "display");
				assert.strictEqual(view.parentNode, dcontainer, "parentNode");
			}

			// by node
			return dcontainer.show("view1").then(function () {
				testView(document.getElementById("view1"));
			}).then(function () {
				return dcontainer.show("view2");
			}).then(function () {
				testView(document.getElementById("view2"));
				document.removeEventListener("delite-display-load", handler);
			});
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
