define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"dojo/_base/declare",
	"delite/register",
	"delite/Widget",
	"delite/StoreMap",
	"dstore/Trackable",
	"dstore/Memory", "dcl/inherited"
], function (registerSuite, assert, dcl, declare, register, Widget, StoreMap, Trackable, Memory) {

	var container;
	var M = declare([Memory, Trackable], {});

	registerSuite({
		name: "StoreMap",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},
		
		Regular: function () {
			var C = register("test-storemap-1", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: myStore.getSync("bar") });
				myStore.putSync({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: myStore.getSync("bar") });
				myStore.addSync({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: myStore.getSync("bar") });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4",
					__item: myStore.getSync("fb") });
				myStore.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4",
					__item: myStore.getSync("fb") });
			}));
			store.placeAt(container);
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;
		},

		// Test case for delite #283.
		RegularLateStartup: function () {
			var C = register("test-storemap-late-startup", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(3000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			var myStore = new M({ data: myData });
			store.store = myStore;
			setTimeout(function () {
				store.placeAt(container);
			}, 1000);

			store.on("query-success", d.callback(function () {
				// attachedCallback() called late, after adding data to the store
				assert.strictEqual(store.renderItems.length, 2);
			}));
			return d;
		},

		copyAll: function () {
			var C = register("test-storemap-2", [HTMLElement, Widget, StoreMap], {
				copyAllItemProps: true
			});
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", firstname: "1",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2",
					__item: myStore.getSync("bar") });
				myStore.putSync({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2",
					__item: myStore.getSync("bar") });
				myStore.addSync({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2",
					__item: myStore.getSync("bar") });
				assert.deepEqual(store.renderItems[2], { id: "fb", name: "FB", firstname: "4",
					__item: myStore.getSync("fb") });
				myStore.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB", firstname: "4",
					__item: myStore.getSync("fb") });
			}));
			store.placeAt(container);
			// use empty model to ease comparison
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;
		},

		InCtor: function () {
			var C = register("test-storemap-3", [HTMLElement, Widget, StoreMap], {
			});
			var d = this.async(2000);
			var store = new C({"fooAttr": "name"});
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar",
					__item: myStore.getSync("bar") });
				myStore.putSync({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar",
					__item: myStore.getSync("bar") });
				myStore.addSync({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar",
					__item: myStore.getSync("bar") });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB",
					__item: myStore.getSync("fb") });
				myStore.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB",
					__item: myStore.getSync("fb") });
			}));
			store.placeAt(container);
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},

		AllowRemap: function () {
			var value = "1";
			var C = register("test-storemap-4", [HTMLElement, Widget, StoreMap], {
				allowRemap: true,
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname + value;
				}
			});
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert.deepEqual(store.renderItems[0].foo, "Foo");
				assert.deepEqual(store.renderItems[0].bar, "11");
				myStore.putSync({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.deepEqual(store.renderItems[0].foo, "Foo2");
				assert.deepEqual(store.renderItems[0].bar, "31");
				value = 2;
				assert.deepEqual(store.renderItems[0].foo, "Foo2");
				assert.deepEqual(store.renderItems[0].bar, "31");
				store.remap();
				assert.deepEqual(store.renderItems[0].foo, "Foo2");
				assert.deepEqual(store.renderItems[0].bar, "32");
			}));
			store.placeAt(container);
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},

		Markup: function () {
			register("test-storemap-5", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name"
			});
			/* global fct:true */
			fct = function () { return "fct"; };
			container.innerHTML = "<test-storemap-5 id='ts5' barAttr='firstname' mFunc='fct' " +
				"nFunc='return item.name + item.firstname;'></test-storemap-5>";
			register.parse(container);
			var d = this.async(2000);
			var store = container.children[0];
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1", m: "fct", n: "Foo1",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2",
					__item: myStore.getSync("bar") });
				myStore.putSync({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2",
					__item: myStore.getSync("bar") });
				myStore.addSync({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2",
					__item: myStore.getSync("bar") });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4",
					__item: myStore.getSync("fb") });
				myStore.removeSync("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4",
					__item: myStore.getSync("fb") });
			}));
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},

		ItemToAndFrom: function () {
			var C = register("test-storemap-6", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.rejectOnError(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: myStore.getSync("foo") });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: myStore.getSync("bar") });
				store.renderItemToItem(store.renderItems[0]).then(d.callback(function (item) {
					assert.deepEqual(item, myData[0]);
					var renderItem = store.itemToRenderItem(item);
					assert.deepEqual(renderItem, { id: "foo", foo: "Foo", bar: "1",
						__item: myStore.getSync("foo") });
				}));
			}));
			store.placeAt(container);
			var myStore = new Memory({ data: myData });
			store.store = myStore;
			return d;
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});

