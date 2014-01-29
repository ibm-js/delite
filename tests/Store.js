define([
	"intern!object",
	"intern/chai!assert",
	"../register", "../Widget", "../Store",
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
				assert.deepEqual(myData, store.renderItems);
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.deepEqual([
					{ id: "foo", name: "Foo2" },
					{ id: "bar", name: "Bar" }
				], store.renderItems);
				myStore.add({ id: "fb", name: "FB" });
				assert.deepEqual([
					{ id: "foo", name: "Foo2" },
					{ id: "bar", name: "Bar" },
					{ id: "fb", name: "FB" }
				], store.renderItems);
				myStore.remove("bar");
				assert.deepEqual([
					{ id: "foo", name: "Foo2" },
					{ id: "fb", name: "FB" }
				], store.renderItems);
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
				assert.deepEqual(myData, store.renderItems);
				// we destroy the store, we should not get any notification after that
				store.destroy();
				myStore.put({ id: "foo", name: "Foo2" });
				// this works because put is synchronous & same for add etc...
				assert.deepEqual([
					{ id: "foo", name: "Foo" },
					{ id: "bar", name: "Bar" }
				], store.renderItems);
				myStore.add({ id: "fb", name: "FB" });
				assert.deepEqual([
					{ id: "foo", name: "Foo" },
					{ id: "bar", name: "Bar" }
				], store.renderItems);
				myStore.remove("bar");
				assert.deepEqual([
					{ id: "foo", name: "Foo" },
					{ id: "bar", name: "Bar" }
				], store.renderItems);
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

