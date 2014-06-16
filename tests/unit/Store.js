define([
	"intern!object",
	"intern/chai!assert", "dcl/dcl", "dojo/_base/declare",
	"delite/register", "delite/Widget", "delite/Store",
	"dstore/Observable", "dstore/Rest", "dstore/Memory"
], function (registerSuite, assert, dcl, declare, register, Widget, Store, Observable, Rest, Memory) {
	var C = register("test-store", [HTMLElement, Widget, Store]);
	var M = declare([Memory, Observable], {});
	registerSuite({
/*
// commented out until https://github.com/ibm-js/delite/issues/93 fixed
		"Error" : function () {
			var d = this.async(2000);
			var store = new C();
			var callbackCalled = false;
			store.on("query-error", function () {
				// should fire before the timeout
				d.resolve();
			});
			store.startup();
			store.store = new Rest({ target: "/" });
			return d;
		},
*/
		"Updates": function () {
			var d = this.async(1500);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				assert.deepEqual(store.renderItems[2], { id: "fb", name: "FB" });
				myStore.remove("bar");
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB" });
			}));
			store.startup();
			// use empty model to easy comparison
			var myStore = new M({ data: myData, model: null});
			store.store = myStore;
			return d;
		},
		"NullStore": function () {
			var d = this.async(1500);
			var store = new C();
			store.on("query-success", d.callback(function () {
				assert.equal(store.renderItems.length, 0);
			}));
			store.startup();
			store.store = null;
			return d;
		},
		"Destroy": function () {
			var d = this.async(1500);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				// we destroy the store, we should not get any notification after that
				store.destroy();
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
				myStore.remove("bar");
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar" });
			}));
			store.startup();
			// use empty model to easy comparison
			var myStore = new M({ data: myData, model: null });
			store.store = myStore;
			return d;
		},
		"Query": function () {
			var d = this.async(1500);
			var store = new C();
			store.query = { id: "foo" };
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], myData[0]);
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
				myStore.remove("bar");
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2" });
			}));
			store.startup();
			// use empty model to easy comparison
			var myStore = new M({ data: myData, model: null });
			store.store = myStore;
			return d;
		},
		"StoreFuncRange": function () {
			var d = this.async(1500);
			var store = new C();
			store.startIndex = 1;
			store.endIndex = 2;
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" },
				{ id: "xx", name: "Bar" },
				{ id: "zz", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(store.renderItems.length, 1);
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar" });
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar" });
				myStore.put({ id: "bar", name: "Bar2" });
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar2" });
				myStore.remove("foo");
				assert.equal(store.renderItems.length, 1);
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar2" });
			}));
			store.startup();
			// use empty model to easy comparison
			var myStore = new M({ data: myData, model: null });
			store.store = myStore;
			return d;
		},
		"StoreFuncSort": function () {
			var d = this.async(1500);
			var store = new C();
			store.processStore = function (store) {
				return store.sort("index");
			};
			var myData = [
				{ id: "foo", name: "Foo", index: 0 },
				{ id: "bar", name: "Bar", index: 1 }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], myData[0]);
				assert.deepEqual(store.renderItems[1], myData[1]);
				var item = myStore.get("foo");
				item.index = 2;
				myStore.put(item);
				assert.deepEqual(store.renderItems[0], { id: "bar", name: "Bar", index: 1 });
				assert.deepEqual(store.renderItems[1], { id: "foo", name: "Foo", index: 2 });
				item = myStore.get("foo");
				item.index = 0;
				myStore.put(item);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", index: 0 });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", index: 1 });
			}));
			store.startup();
			// use empty model to easy comparison
			var myStore = new M({ data: myData, model: null });
			store.store = myStore;
			return d;
		},
		teardown: function () {
			//container.parentNode.removeChild(container);
		}
	});
});

