define([
	"dcl/dcl",
	"dojo/_base/declare",
	"delite/register",
	"delite/Widget",
	"delite/Store",
	"dojo-dstore/Filter"
], function (
	dcl,
	declare,
	register,
	Widget,
	Store,
	Filter
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

	var C = register("test-store-array", [HTMLElement, Widget, Store]);

	registerSuite("Store-array", {
		Updates: function () {
			var refreshRenderingCallCount = 0;
			var store = new C();
			store.refreshRendering = function () {
				refreshRenderingCallCount++;
			};
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.source = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.deliver();
			assert(store.renderItems instanceof Array);
			assert.strictEqual(store.renderItems.length, 2);
			assert.deepEqual(store.renderItems[0], myData[0]);
			assert.deepEqual(store.renderItems[1], myData[1]);
			assert.strictEqual(refreshRenderingCallCount, 1, "initial");
		},

		NullStore: function () {
			var store = new C({
				source: [
					{id: "foo", name: "Foo"},
					{id: "bar", name: "Bar"}
				]
			});
			store.deliver();
			assert.strictEqual(store.renderItems.length, 2);

			// Test the change store to null triggers a so-called query
			store.source = null;
			store.deliver();
			assert.strictEqual(store.renderItems.length, 0);
		},

		AllTypeOfQuery: function () {
			var store1 = new C();
			store1.query = new Filter().ne("id", 1);
			store1.source = [
				{ id: 1, name: "item 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "item 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "item 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "item 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "item 9", number: 8 }
			];
			store1.deliver();
			assert(store1.renderItems instanceof Array);
			assert.strictEqual(store1.renderItems.length, 8, "ne");
			assert.deepEqual(store1.renderItems[0], {id: 2, name: "item 2", number: 4}, "ne");

			var store2 = new C();
			store2.query = new Filter().gt("number", 5);
			store2.deliver();
			store2.source = [
				{ id: 1, name: "item 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "item 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "item 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "item 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "item 9", number: 8 }
			];
			store2.deliver();
			assert.strictEqual(store2.renderItems.length, 5, "gt");

			var store3 = new C();
			store3.query = new Filter().gte("number", 5);
			store3.source = [
				{ id: 1, name: "item 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "item 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "item 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "item 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "item 9", number: 8 }
			];
			store3.deliver();
			assert.strictEqual(store3.renderItems.length, 8, "gte");

			var store4 = new C();
			store4.query = new Filter().lt("number", 5);
			store4.source = [
				{ id: 1, name: "item 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "item 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "item 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "item 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "item 9", number: 8 }
			];
			store4.deliver();
			assert.strictEqual(store4.renderItems.length, 1, "lt");

			var store5 = new C();
			store5.query = new Filter().lte("number", 5);
			store5.source = [
				{ id: 1, name: "item 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "item 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "item 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "item 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "item 9", number: 8 }
			];
			store5.deliver();
			assert.strictEqual(store5.renderItems.length, 4, "lte");

			var store6 = new C();
			store6.query = new Filter().match("name", /item/);
			store6.source = [
				{ id: 1, name: "itam 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "itam 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "itam 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "itam 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "itam 9", number: 8 }
			];
			store6.deliver();
			assert.strictEqual(store6.renderItems.length, 4, "match");

			var store7 = new C();
			store7.query = new Filter().in("number", [2, 4]);
			store7.source = [
				{ id: 1, name: "itam 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "itam 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "itam 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "itam 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "itam 9", number: 8 }
			];
			store7.deliver();
			assert.strictEqual(store7.renderItems.length, 1, "in");

			var store8 = new C();
			store8.query = new Filter().contains("numbers", [2, 4]);
			store8.source = [
				{ id: 1, name: "itam 1", numbers: [8, 2, 4] },
				{ id: 2, name: "item 2", numbers: [8, 1, 4] },
				{ id: 3, name: "itam 3", numbers: [8, 2, 4] },
				{ id: 4, name: "item 4", numbers: [8, 1, 4] },
				{ id: 5, name: "itam 5", numbers: [8, 2, 4] },
				{ id: 6, name: "item 6", numbers: [8, 1, 4] },
				{ id: 7, name: "itam 7", numbers: [8, 2, 4] },
				{ id: 8, name: "item 8", numbers: [8, 1, 4] },
				{ id: 9, name: "itam 9", numbers: [8, 2, 4] }
			];
			store8.deliver();
			assert.strictEqual(store8.renderItems.length, 5, "contains");

			var store9 = new C();
			var filter1 =  new Filter().lte("number", 5);
			var filter2 =  new Filter().gte("number", 5);
			store9.query = new Filter().and(filter1, filter2);
			store9.source = [
				{ id: 1, name: "itam 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "itam 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "itam 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "itam 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "itam 9", number: 8 }
			];
			store9.deliver();
			assert.strictEqual(store9.renderItems.length, 3, "and");

			var store10 = new C();
			filter1 =  new Filter().lte("number", 5);
			filter2 =  new Filter().eq("id", 1);
			store10.query = new Filter().or(filter1, filter2);
			store10.source = [
				{ id: 1, name: "itam 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "itam 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "itam 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "itam 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "itam 9", number: 8 }
			];
			store10.deliver();
			assert.strictEqual(store10.renderItems.length, 5, "or");

			var store11 = new C();
			store11.query = new Filter().lte("number", 5).gte("number", 5);
			store11.source = [
				{ id: 1, name: "itam 1", number: 8 },
				{ id: 2, name: "item 2", number: 4 },
				{ id: 3, name: "itam 3", number: 8 },
				{ id: 4, name: "item 4", number: 5 },
				{ id: 5, name: "itam 5", number: 8 },
				{ id: 6, name: "item 6", number: 5 },
				{ id: 7, name: "itam 7", number: 8 },
				{ id: 8, name: "item 8", number: 5 },
				{ id: 9, name: "itam 9", number: 8 }
			];
			store11.deliver();
			assert.strictEqual(store11.renderItems.length, 3, "multi query");
		},

		StoreFuncRange: function () {
			var store = new C();
			store.fetch = function (collection) {
				return collection.fetchRange({start: 0, end: 1});
			};
			store.source = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.deliver();
			assert(store.renderItems instanceof Array);
			assert.strictEqual(store.renderItems.length, 1);
		},

		StoreFuncSort: function () {
			var store = new C();
			store.processQueryResult = function (theStore) {
				return theStore.sort(function (a, b) {
					if (a.index > b.index) {
						return 1;
					}
					if (a.index < b.index) {
						return -1;
					}
					return 0;
				});
			};
			var myData = [
				{ id: "foo", name: "Foo", index: 1 },
				{ id: "bar", name: "Bar", index: 0 }
			];
			store.source = [
				{ id: "foo", name: "Foo", index: 1 },
				{ id: "bar", name: "Bar", index: 0 }
			];
			store.deliver();
			assert(store.renderItems instanceof Array);
			assert.strictEqual(store.renderItems.length, 2);
			assert.deepEqual(store.renderItems[0], myData[1]);
			assert.deepEqual(store.renderItems[1], myData[0]);
		},

		SetNewSource: function () {
			var store = new C();
			var myData = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			// use empty model to easy comparison
			store.source = [
				{ id: "foo", name: "Foo" },
				{ id: "bar", name: "Bar" }
			];
			store.deliver();
			assert(store.renderItems instanceof Array);
			assert.strictEqual(store.renderItems.length, 2);
			assert.deepEqual(store.renderItems[0], myData[0]);
			assert.deepEqual(store.renderItems[1], myData[1]);

			// this will issue the query again
			store.source = [
				{ id: "another", name: "Another" }
			];
			store.deliver();
			assert.strictEqual(store.renderItems.length, 1);
			assert.deepEqual(store.renderItems[0], { id: "another", name: "Another" });
		}
	});
});

