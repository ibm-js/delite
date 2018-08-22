define([
	"intern!object",
	"intern/chai!assert", "dcl/dcl", "dojo/_base/declare",
	"delite/register", "delite/Widget", "delite/Store",
	"dstore/Trackable", "dstore/Rest", "dstore/Memory"
], function (registerSuite, assert, dcl, declare, register, Widget, Store, Trackable, Rest, Memory) {

	var C = register("test-store", [HTMLElement, Widget, Store]);
	var M = declare([Memory, Trackable], {});
	var container;

	registerSuite({
		name: "Store",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		"Error": function () {
			var d = this.async(10000);	// SauceLabs takes 2-5 seconds for bogus URL to generate a 404 error
			var store = new C();
			store.on("query-error", function () {
				// should fire before the timeout
				d.resolve(true);
			});
			store.on("query-success", function () {
				d.reject(new Error("got query-success, should get query-error"));
			});
			store.source = new Rest({ target: "/foo" });	// bogus URL, should throw error
			store.deliver();
			return d;
		},

		Updates: function () {
			var d = this.async(1500);
			var store = new C();
			store.deliver();

			var refreshRenderingCallCount = 0;
			store.refreshRendering = function () {
				refreshRenderingCallCount++;
			};
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				mySource.putSync({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				store.deliver();
				assert.strictEqual(refreshRenderingCallCount, 1, "after store.put");
				mySource.addSync({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				assert.deepEqual(store.renderItems[2], { id: "fb", name: "FB" });
				store.deliver();
				assert.strictEqual(refreshRenderingCallCount, 2, "after store.add");
				mySource.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB" });
				store.deliver();
				assert.strictEqual(refreshRenderingCallCount, 3, "after store.remove");
			}));
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null});
			store.source = mySource;
			store.deliver();
			return d;
		},

		NullStore: function () {
			var d = this.async(1500);
			var store = new C({
				source: new M({ data: [{id: "foo", name: "Foo" }], model: null})
			});
			setTimeout(d.rejectOnError(function () {
				store.on("query-success", d.callback(function () {
					assert.strictEqual(store.renderItems.length, 0);
				}));

				// Test the change store to null triggers a so-called query
				store.source = null;
			}), 100);
			store.deliver();
			return d;
		},

		Destroy: function () {
			var d = this.async(1500);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				// we destroy the store, we should not get any notification after that
				store.destroy();
				mySource.putSync({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				mySource.addSync({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				mySource.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
			}));
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null });
			store.source = mySource;
			store.deliver();
			return d;
		},

		Query: function () {
			var d = this.async(1500);
			var store = new C();
			store.query = { id: "foo" };
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], myData[0]);
				mySource.putSync({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				mySource.addSync({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				mySource.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
			}));
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null });
			store.source = mySource;
			store.deliver();
			return d;
		},

		"set query in subclass": function () {
			// This test confirms that the subclass computeProperties() method can set this.query,
			// and Store will wait until after that to run the query against the store.

			var MyStoreSubclass = register("my-store-subclass", [HTMLElement, Widget, Store], {
				idToQuery: "place holder",

				constructor: function () {
					this.storeQueries = [];
				},

				computeProperties: function (oldVals) {
					if ("idToQuery" in oldVals) {
						this.query = {
							id: this.idToQuery
						};
					}
				},

				queryStoreAndInitItems: dcl.superCall(function (sup) {
					return function () {
						this.storeQueries.push(this.query);
						sup.apply(this, arguments);
					};
				})
			});

			var myStore = new MyStoreSubclass({
				source: new M({
					data: [
						{ id: "foo", name: "Foo" },
						{ id: "bar", name: "Bar" }
					],
					model: null
				}),
				idToQuery: "foo"
			});
			myStore.deliver();

			assert.deepEqual(myStore.storeQueries, [{ id: "foo" }]);
		},

		StoreFuncRange: function () {
			var d = this.async(15000);
			var store = new C();
			store.fetch = function (collection) {
				return collection.fetchRange({start: 0, end: 1});
			};
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 1);
				// all of this makes no sense to test until we have range management implemented directly
				// in delite/Store
				/*
				mySource.putSync({ id: "foo", name: "Foo2" });
				assert.strictEqual(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				mySource.addSync({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB" });
				mySource.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				*/
			}));
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null });
			store.source = mySource;
			store.deliver();
			return d;
		},

		StoreFuncSort: function () {
			var d = this.async(1500);
			var store = new C();
			store.processQueryResult = function (store) {
				return store.sort("index");
			};
			var myData = [
				{ id: "foo", name: "Foo", index: 0 },
				{ id: "bar", name: "Bar", index: 1 }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				var item = mySource.getSync("foo");
				item.index = 2;
				mySource.putSync(item);
				// this works because put is synchronous
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar", index: 1 });
				assert.deepEqual(store.renderItems[1], { id: "foo", name: "Foo", index: 2 });
				item = mySource.getSync("foo");
				item.index = 0;
				mySource.putSync(item);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", index: 0 });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", index: 1 });
			}));
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null });
			store.source = mySource;
			store.deliver();
			return d;
		},

		"deatch and reattach": function () {
			var mySource = new M({
				data: [
					{ id: "foo", name: "Foo" },
					{ id: "bar", name: "Bar" }
				],
				model: null
			});
			var store = new C({
				source: mySource
			});
			store.placeAt(container);

			assert.deepEqual(store.renderItems, [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			], "initial");

			container.removeChild(store);
			return mySource.put({ id: "zaz", name: "Zaz" }).then(function () {
				store.placeAt(container);
				assert.deepEqual(store.renderItems, [
					{ id: "foo", name: "Foo" },
					{ id: "bar", name: "Bar" },
					{ id: "zaz", name: "Zaz"}
				], "after detach, update, reattach");
			});
		},

		// TODO: re-enable when dstore will have re-introduced refresh event?

		/**
		SetData: function () {
			var d = this.async(1500);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			var init = true;
			store.on("query-success", d.rejectOnError(function () {
				assert(store.renderItems instanceof Array);
				if (init) {
					init = false;
					assert.strictEqual(store.renderItems.length, 2);
					assert.deepEqual(store.renderItems[0], myData[0]);
					assert.deepEqual(store.renderItems[1], myData[1]);
					// this will issue the query again
					mySource.setData([
						{ id: "another", name: "Another" }
					]);
				} else {
					assert.strictEqual(store.renderItems.length, 1);
					assert.deepEqual(store.renderItems[0], { id: "another", name: "Another" });
					d.resolve();
				}
			}));
			store.connectedCallback();
			// use empty model to easy comparison
			var mySource = new M({ data: myData, model: null });
			store.source = mySource;
			return d;
		},**/

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
