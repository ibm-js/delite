define([
	"intern!object",
	"intern/chai!assert",
	"dcl/advise",
	"dcl/dcl",
	"delite/Destroyable",
	"dojo/Deferred",
	"dojo/Stateful",
	"dojo/on"
], function (registerSuite, assert, advise, dcl, Destroyable, Deferred, Stateful, on) {
	var container;
	registerSuite({
		name: "Destroyable",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		general: function () {
			var SupportingWidget = dcl(null, {
				destroyCalls: 0,
				constructor: function (name) {
					this.name = name;
				},
				destroy: function () {
					this.destroyCalls++;
				}
			});

			var watchMe = new Stateful({
				name: "watchMe",
				x: 0
			});

			var DestroyableSubClass = dcl(Destroyable, {
				// number of times my button was clicked
				clicks: 0,

				// number of times watchMe changed value of x
				watches: 0,

				constructor: function () {
					var self = this;
					this.domNode = document.createElement("button");
					this.own(
						// setup an event handler (to be destroyed when I'm destroyed)
						on(this.domNode, "click", function () {
							self.clicks++;
						}),

						// watch external watchMe class (to be unwatch()'d when I'm destroyed)
						watchMe.watch("x", function () {
							self.watches++;
						})
					);

					// Setup two supporting widgets, to be destroyed when I'm destroyed
					this.own(this.sw1 = new SupportingWidget("sw1"));
					this.own(this.sw2 = new SupportingWidget("sw2"));
				}
			});

			var destroyable1 = new DestroyableSubClass();
			container.appendChild(destroyable1.domNode);

			destroyable1.domNode.click();
			assert.strictEqual(1, destroyable1.clicks);

			// make sure watch handler was setup
			watchMe.set("x", 1);
			assert.strictEqual(1, destroyable1.watches);

			// manually destroy one of the supporting widgets
			destroyable1.sw1.destroy();
			assert.strictEqual(1, destroyable1.sw1.destroyCalls);

			// Destroy the Destroyable instance itself.   destroyable1 should:
			// 		- destroy the sw2 supporting widget, but not try to re-destroy sw1
			//		- disconnect the watch() listener on watchMe
			//		- disconnect the click event handler on destroyable1.domNode
			destroyable1.destroy();
			assert.strictEqual(1, destroyable1.sw1.destroyCalls);

			destroyable1.domNode.click();
			assert.strictEqual(1, destroyable1.sw2.destroyCalls);

			destroyable1.domNode.click();
			assert.strictEqual(1, destroyable1.clicks);

			watchMe.set("x", 2);
			assert.strictEqual(1, destroyable1.watches);
		},

		multipleDestroyFunctions: function () {
			var removeCount = 0;
			var destroyCount = 0;

			var W1 = dcl(Destroyable, {
				remove: function () {
					removeCount++;
					this.destroy();
				},
				destroy: function () {
					destroyCount++;
				}
			});

			var W2 = dcl(Destroyable, {
				test: function () {
					var w1 = new W1();
					this.own(w1);
					w1.destroy();
				}
			});

			var W3 = dcl(Destroyable, {
				test: function () {
					var w1 = new W1();
					this.own(w1);
					w1.remove();
				}
			});

			var w2 = new W2();
			w2.test();
			w2.destroy();
			assert.strictEqual(removeCount, 0, "remove #1");
			assert.strictEqual(destroyCount, 1, "destroy #1");

			removeCount = 0;
			destroyCount = 0;
			var w3 = new W3();
			w3.test();
			w3.destroy();
			assert.strictEqual(removeCount, 1, "remove #2");
			assert.strictEqual(destroyCount, 1, "destroy #2");
		},

		owningPromises: function () {
			var cancels = 0;
			var W1 = dcl(Destroyable, {
				constructor: function () {
					this.p1 = new Deferred(function () {
						cancels++;
					});
					this.p2 = new Deferred(function () {
						cancels++;
					});
					this.p3 = new Deferred(function () {
						cancels++;
					});
					this.p4 = new Deferred(function () {
						cancels++;
					});
					this.own(this.p1, this.p2, this.p3, this.p4);
				}
			});

			var w1 = new W1();

			w1.p1.resolve(true);
			advise.after(w1.p1, "cancel", function () {
				throw new Error("p1 shouldn't have been canceled");
			});

			w1.p2.reject(new Error("I was rejected"));
			advise.after(w1.p2, "cancel", function () {
				throw new Error("p2 shouldn't have been canceled");
			});

			w1.p3.cancel();
			assert.strictEqual(cancels, 1, "one promise canceled manually before destroy");

			// Destroying the widget should only cancel p4; it's the only Promise that hasn't been dealt with already.
			// OTOH if Destroyable is broken, one of the asserts above may go off during the destroy() call.
			w1.destroy();

			assert.strictEqual(cancels, 2, "only p4 canceled on widget destroy");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
