define([
	"require",
	"intern!object",
	"intern/chai!assert",
	"dojo/on",
	"dojo/Deferred",
	"../DisplayContainer",
	"../Widget",
	"../register",
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
			this.timeout = 5000;
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
				// test that a delite-display-complete event is fired, if is not fired the test will fail by timeout
				on.once("delite-display-complete", function () {
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
		// test with a controller
		custom : function () {
			this.timeout = 5000;
			var deferred = new Deferred();
			function initView(view, id) {
				view.style.visibility = "hidden";
				view.style.display = "none";
				view.setAttribute("id", id);
			}
			document.addEventListener("delite-display-load", function (event) {
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
