define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"dojo/_base/declare",
	"delite/register",
	"delite/Widget",
	"delite/StoreMap",
	"decor/ObservableArray"
], function (registerSuite, assert, dcl, declare, register, Widget, StoreMap, ObservableArray) {

	var container;

	registerSuite({
		name: "StoreMap-ObservableArray",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		Regular: function () {
			var C = register("test-storemap-observablearray-1", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(2000);
			var store = new C();
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: store.source[1] });

				store.source.push({ id: "fb", name: "FB", firstname: "4" });
				store.deliver();
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: store.source[1] });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4",
					__item: store.source[2] });

				store.source.splice(1, 1);
				store.deliver();
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4",
					__item: store.source[1] });
			}));
			store.placeAt(container);
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });
			return d;
		},

		// Test case for delite #283.
		RegularLateStartup: function () {
			var C = register("test-storemap-observablearray-late-startup", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(3000);
			var store = new C();
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });

			setTimeout(function () {
				store.placeAt(container);
			}, 1000);

			store.on("query-success", d.callback(function () {
				// connectedCallback() called late, after adding data to the store
				assert.strictEqual(store.renderItems.length, 2);
			}));
			return d;
		},

		copyAll: function () {
			var C = register("test-storemap-observablearray-2", [HTMLElement, Widget, StoreMap], {
				copyAllItemProps: true
			});
			var d = this.async(2000);
			var store = new C();
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", firstname: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2",
					__item: store.source[1] });

				store.source.push({ id: "fb", name: "FB", firstname: "4" });
				store.deliver();
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", firstname: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", name: "Bar", firstname: "2",
					__item: store.source[1] });
				assert.deepEqual(store.renderItems[2], { id: "fb", name: "FB", firstname: "4",
					__item: store.source[2] });

				store.source.splice(1, 1);
				store.deliver();
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", name: "Foo", firstname: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "fb", name: "FB", firstname: "4",
					__item: store.source[1] });
			}));
			store.placeAt(container);
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });
			return d;
		},

		InCtor: function () {
			var C = register("test-storemap-observablearray-3", [HTMLElement, Widget, StoreMap], {
			});
			var d = this.async(2000);
			var store = new C({"fooAttr": "name"});
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar",
					__item: store.source[1] });

				store.source.push({ id: "fb", name: "FB"});
				store.deliver();
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar",
					__item: store.source[1] });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB",
					__item: store.source[2] });

				store.source.splice(1, 1);
				store.deliver();
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB",
					__item: store.source[1] });
			}));
			store.placeAt(container);
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });
			return d;

		},

		AllowRemap: function () {
			var value = "1";
			var C = register("test-storemap-observablearray-4", [HTMLElement, Widget, StoreMap], {
				allowRemap: true,
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname + value;
				}
			});
			var d = this.async(2000);
			var store = new C();
			store.on("query-success", d.callback(function () {
				assert.deepEqual(store.renderItems[0].foo, "Foo");
				assert.deepEqual(store.renderItems[0].bar, "11");
				value = 2;
				store.remap();
				assert.deepEqual(store.renderItems[0].foo, "Foo");
				assert.deepEqual(store.renderItems[0].bar, "12");
			}));
			store.placeAt(container);
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });
			return d;
		},

		Markup: function () {
			register("test-storemap-observablearray-5", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name"
			});
			/* global fct:true */
			fct = function () { return "fct"; };
			container.innerHTML = "<test-storemap-observablearray-5 id='ts5' barAttr='firstname' mFunc='fct' " +
			"nFunc='return item.name + item.firstname;'></test-storemap-5>";
			register.deliver();

			var d = this.async(2000);
			var store = container.children[0];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1", m: "fct", n: "Foo1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2",
					__item: store.source[1] });

				store.source.push({ id: "fb", name: "FB", firstname: "4" });
				store.deliver();
				assert.strictEqual(store.renderItems.length, 3);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1", m: "fct", n: "Foo1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2", m: "fct", n: "Bar2",
					__item: store.source[1] });
				assert.deepEqual(store.renderItems[2], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4",
					__item: store.source[2] });

				store.source.splice(1, 1);
				store.deliver();
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1", m: "fct", n: "Foo1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "fb", foo: "FB", bar: "4", m: "fct", n: "FB4",
					__item: store.source[1] });
			}));
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });

			return d;
		},

		ItemToAndFrom: function () {
			var C = register("test-storemap-observablearray-6", [HTMLElement, Widget, StoreMap], {
				fooAttr: "name",
				barFunc: function (item) {
					return item.firstname;
				}
			});
			var d = this.async(2000);
			var store = new C();
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.strictEqual(store.renderItems.length, 2);
				assert.deepEqual(store.renderItems[0], { id: "foo", foo: "Foo", bar: "1",
					__item: store.source[0] });
				assert.deepEqual(store.renderItems[1], { id: "bar", foo: "Bar", bar: "2",
					__item: store.source[1] });

				store.renderItemToItem(store.renderItems[0]).then(d.callback(function (item) {
					assert.deepEqual(item, store.source[0]);
					var renderItem = store.itemToRenderItem(item);
					assert.deepEqual(renderItem, {id: "foo", foo: "Foo", bar: "1", __item: store.source[0]});
				}));
			}));
			store.placeAt(container);
			store.source = new ObservableArray({ id: "foo", name: "Foo", firstname: "1" },
				{ id: "bar", name: "Bar", firstname: "2" });
			return d;
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});


