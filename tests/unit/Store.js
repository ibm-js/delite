define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/Widget",
	"delite/Store",
	"dojo/store/Observable", "dojo/store/JsonRest", "dojo/store/Memory"
], function (registerSuite, assert, register, Widget, Store, Observable, JsonRest, Memory) {
	var C = register("test-store", [HTMLElement, Widget, Store]);
	registerSuite({
		name: "Store",
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
			store.store = new JsonRest({ target: "/" });
			return d;
		},
*/
		"Updates" : function () {
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(2, store.renderItems.length);
				assert.deepEqual(myData[0], store.renderItems[0]);
				assert.deepEqual(myData[1], store.renderItems[1]);
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(2, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo2" }, store.renderItems[0]);
				assert.deepEqual({ id: "bar", name: "Bar" }, store.renderItems[1]);
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(3, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo2" }, store.renderItems[0]);
				assert.deepEqual({ id: "bar", name: "Bar" }, store.renderItems[1]);
				assert.deepEqual({ id: "fb", name: "FB" }, store.renderItems[2]);
				myStore.remove("bar");
				assert.equal(2, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo2" }, store.renderItems[0]);
				assert.deepEqual({ id: "fb", name: "FB" }, store.renderItems[1]);
			}));
			store.startup();
			var myStore = Observable(new Memory({ data: myData }));
			store.store = myStore;
			return d;
		},
		"Destroy" : function () {
			var d = this.async(2000);
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.on("query-success", d.callback(function () {
				assert(store.renderItems instanceof Array);
				assert.equal(2, store.renderItems.length);
				assert.deepEqual(myData[0], store.renderItems[0]);
				assert.deepEqual(myData[1], store.renderItems[1]);
				// we destroy the store, we should not get any notification after that
				store.destroy();
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.equal(2, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo" }, store.renderItems[0]);
				assert.deepEqual({ id: "bar", name: "Bar" }, store.renderItems[1]);
				myStore.add({ id: "fb", name: "FB" });
				assert.equal(2, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo" }, store.renderItems[0]);
				assert.deepEqual({ id: "bar", name: "Bar" }, store.renderItems[1]);
				myStore.remove("bar");
				assert.equal(2, store.renderItems.length);
				assert.deepEqual({ id: "foo", name: "Foo" }, store.renderItems[0]);
				assert.deepEqual({ id: "bar", name: "Bar" }, store.renderItems[1]);
			}));
			store.startup();
			var myStore = Observable(new Memory({ data: myData }));
			store.store = myStore;
			return d;
		},
		teardown : function () {
			//container.parentNode.removeChild(container);
		}
	});
});

