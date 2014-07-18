define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"dojo/_base/declare",
	"delite/register",
	"delite/Widget",
	"delite/StoreMap",
	"dstore/Observable",
	"dstore/Memory", "dcl/inherited"
], function (registerSuite, assert, dcl, declare, register, Widget, StoreMap, Observable, Memory) {
	var M = declare([Memory, Observable], {});

	registerSuite({
		name: "StoreMap",
		"Regular": function () {
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
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2" });
				myStore.put({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2" });
				myStore.add({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2" });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4" });
				myStore.remove("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3" });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4" });
			}));
			store.startup();
			var myStore = new M({ data: myData});
			store.store = myStore;
			return d;
		},
		"copyAll": function () {
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
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", firstname: "1" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2" });
				myStore.put({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2" });
				myStore.add({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3" });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2" });
				assert.deepEqual(store.renderItems[2], { id: "fb", name: "FB", firstname: "4" });
				myStore.remove("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo2", firstname: "3" });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB", firstname: "4" });
			}));
			store.startup();
			// use empty model to ease comparison
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;
		},
		"InCtor": function () {
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
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar" });
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar" });
				myStore.add({ id: "fb", name: "FB" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar" });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB" });
				myStore.remove("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2" });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB" });
			}));
			store.startup();
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},
		"AllowRemap": function () {
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
				myStore.put({ id: "foo", name: "Foo2", firstname: "3" });
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
			store.startup();
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},
		"Markup": function () {
			register("test-storemap-5", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name"
			});
			/* global fct:true */
			fct = function () { return "fct"; };
			var tag = "<test-storemap-5 id='ts6' barAttr='firstname' mFunc='fct' " +
				"nFunc='return item.name + item.firstname;'></test-storemap-6>";
			var tagHolder = document.createElement("div");
			tagHolder.innerHTML = tag;
			register.parse(tagHolder);
			var d = this.async(2000);
			var store = tagHolder.children[0];
			var myData = [
				{ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1", m: "fct", n: "Foo1" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2" });
				myStore.put({ id: "foo", name: "Foo2", firstname: "3" });
				// this works because put is synchronous & same for add etc...
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2" });
				myStore.add({ id: "fb", name: "FB", firstname: "4" });
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2" });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4" });
				myStore.remove("bar");
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo2", bar: "3", m: "fct", n: "Foo23" });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4" });
			}));
			var myStore = new M({ data: myData });
			store.store = myStore;
			return d;

		},
		"ItemToAndFrom": function () {
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
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1" });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2" });
				var item = store.renderItemToItem(store.renderItems[0]);
				assert.deepEqual(item, myData[0]);
				var renderItem = store.itemToRenderItem(item);
				assert.deepEqual(renderItem, { id: "foo", foo: "Foo", bar: "1" });
			}));
			store.startup();
			var myStore = new Memory({ data: myData });
			store.store = myStore;
			return d;
		},
		teardown: function () {
			//container.parentNode.removeChild(container);
		}
	});
});

