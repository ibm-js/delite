define([
	"require",
	"intern!object",
	"intern/chai!assert",
	"dojo/on",
	"dojo/Deferred",
	"delite/DisplayContainer",
	"delite/Widget",
	"delite/register",
	"dojo/domReady!"
], function (require, registerSuite, assert, on, Deferred, DisplayContainer, Widget, register) {
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
			var deferred = new Deferred();
			register("test-default-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = register.createElement("test-default-display-container");
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
			view2.setAttribute("id", "view");
			initView(view2);
			container.appendChild(dcontainer);
			dcontainer.startup();
			// by node
			var transitionDeferred = dcontainer.show(view1);
			transitionDeferred.then(function () {
				testView(view1);
				// by id
				// test that a delite-after-show event is fired, if is not fired the test will fail by timeout
				on.once(dcontainer, "delite-after-show", function () {
					// test is finished
					deferred.resolve(true);
				});
				transitionDeferred = dcontainer.show("view");
				transitionDeferred.then(function () {
					testView(view2);
				});
			});
			return deferred.promise;
		},
		hide: function () {
			this.timeout = 2500;
			var deferred = new Deferred();
			register("test-hide-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = register.createElement("test-hide-display-container");
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
			view2.setAttribute("id", "view");
			initView(view2);
			container.appendChild(dcontainer);
			dcontainer.startup();
			var beforeDisplayCalled = false;
			dcontainer.on("delite-before-hide", function () {
				beforeDisplayCalled = true;
			});
			// by node
			var transitionDeferred = dcontainer.hide(view1);
			transitionDeferred.then(function () {
				assert(beforeDisplayCalled, "before-hide event must be dispatched");
				testView(view1);
				// by id
				// test that a delite-after-show event is fired, if is not fired the test will fail by timeout
				on.once(dcontainer, "delite-after-hide", function () {
					// test is finished
					deferred.resolve(true);
				});
				transitionDeferred = dcontainer.hide("view");
				transitionDeferred.then(function () {
					testView(view2);
				});
			});
			return deferred.promise;
		},
		event: function () {
			this.timeout = 2500;
			var deferred = new Deferred(), handler;
			function initView(view, id) {
				view.style.visibility = "hidden";
				view.style.display = "none";
				view.setAttribute("id", id + "-event");
			}
			document.addEventListener("delite-display-load", handler = function (event) {
				event.preventDefault();
				var view = document.createElement("div");
				initView(view, event.dest);
				event.loadDeferred.resolve({
					child: view
				});
			});
			register("test-event-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = register.createElement("test-event-display-container");
			dcontainer.setAttribute("id", "dcontainer");
			container.appendChild(dcontainer);
			dcontainer.startup();
			var beforeDisplayCalled = false;
			dcontainer.on("delite-before-show", function () {
				beforeDisplayCalled = true;
			});
			// by node
			var transitionDeferred = dcontainer.show("view1-event");
			transitionDeferred.then(function () {
				assert(beforeDisplayCalled, "before show event must be dispatched");
				document.removeEventListener("delite-display-load", handler);
				deferred.resolve(true);
			});
			return deferred.promise;
		},
		// test with a controller
		custom : function () {
			this.timeout = 2500;
			var deferred = new Deferred(), handler;
			function initView(view, id) {
				view.style.visibility = "hidden";
				view.style.display = "none";
				view.setAttribute("id", id);
			}
			document.addEventListener("delite-display-load", handler = function (event) {
				event.preventDefault();
				var view = document.createElement("div");
				initView(view, event.dest);
				event.loadDeferred.resolve({
					child: view
				});
			});
			register("test-custom-display-container", [HTMLElement, Widget, DisplayContainer]);
			var dcontainer = register.createElement("test-custom-display-container");
			dcontainer.setAttribute("id", "dcontainer");
			container.appendChild(dcontainer);
			dcontainer.startup();
			function testView(view) {
				assert.strictEqual(view.style.visibility, "visible", "visibility");
				assert.strictEqual(view.style.display, "", "display");
				assert.strictEqual(view.parentNode, dcontainer, "parentNode");
			}
			// by node
			var transitionDeferred = dcontainer.show("view1");
			transitionDeferred.then(function () {
				testView(document.getElementById("view1"));
				transitionDeferred = dcontainer.show("view2");
				transitionDeferred.then(function () {
					testView(document.getElementById("view2"));
					document.removeEventListener("delite-display-load", handler);
					// test is finished
					deferred.resolve(true);
				});
			});
			return deferred.promise;
		},
		teardown : function () {
			container.parentNode.removeChild(container);
		}
	});
});
