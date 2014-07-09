define([
	"intern!object",
	"intern/chai!assert",
	"delite/register",
	"delite/Selection"
], function (registerSuite, assert, register, Selection) {
	var C = register("test-selection", [HTMLElement, Selection], {
		updateRenderers: function () {
		},
		getIdentity: function (item) {
			return item;
		}
	});
	registerSuite({
		name: "Selection",
		"testSetGet": function () {
			var o = new C();
			o.selectedItem = "1";
			assert.deepEqual(o.selectedItem, "1");
			assert.deepEqual(o.selectedItems, ["1"]);
			o.selectedItems = ["2"];
			assert.deepEqual(o.selectedItem, "2");
			assert.deepEqual(o.selectedItems, ["2"]);
			o = new C({selectedItem: "1"});
			assert.deepEqual(o.selectedItem, "1");
			assert.deepEqual(o.selectedItems, ["1"]);
			assert.isTrue(o.isSelected("1"));
			assert.isFalse(o.isSelected("2"));
		},
		"multipletosingle": function () {
			var o = new C();
			o.selectionMode = "multiple";
			o.selectedItems = ["2", "3"];
			assert.deepEqual(o.selectedItems, ["2", "3"]);
			o.selectionMode = "single";
			assert.deepEqual(o.selectedItems, ["2"]);
			o.selectionMode = "multiple";
			o.selectedItems = [];
			assert.deepEqual(o.selectedItems, []);
			o.selectionMode = "single";
			assert.deepEqual(o.selectedItems, []);
		},
		"multipletoradio": function () {
			var o = new C();
			o.selectionMode = "multiple";
			o.selectedItems = ["2", "3"];
			assert.deepEqual(o.selectedItems, ["2", "3"]);
			o.selectionMode = "radio";
			assert.deepEqual(o.selectedItems, ["2"]);
			o.selectionMode = "multiple";
			o.selectedItems = [];
			assert.deepEqual(o.selectedItems, []);
			o.selectionMode = "radio";
			assert.deepEqual(o.selectedItems, []);
		},
		"singletonone": function () {
			var o = new C();
			o.selectedItem = "1";
			assert.deepEqual("1", o.selectedItem);
			o.selectionMode = "none";
			assert.equal(o.selectedItem, null);
			assert.deepEqual(o.selectedItems, []);
		},
		"radiotonone": function () {
			var o = new C();
			o.selectionMode = "radio";
			o.selectedItem = "1";
			assert.deepEqual("1", o.selectedItem);
			o.selectionMode = "none";
			assert.equal(o.selectedItem, null);
			assert.deepEqual(o.selectedItems, []);
		},
		"testEvent": function () {
			var o = new C({selectedItem: "1"});
			var callbackCalled = false;
			o.on("selection-change", function (evt) {
				assert.deepEqual(evt.oldValue, "1");
				assert.deepEqual(evt.newValue, "2");
				callbackCalled = true;
			});
			o.startup();
			o.selectFromEvent({}, "2", null, true);
			assert.isTrue(callbackCalled, "selection-change callback");
		},
		"fromEvent": function () {
			var o = new C({selectedItem: "1"});
			o.startup();
			o.selectFromEvent({}, "2", null, true);
			assert.deepEqual(o.selectedItems, ["2"]);
			o = new C({selectedItem: "1"});
			o.selectionMode = "multiple";
			o.isMultipleSelection = function () {
				return true;
			};
			o.startup();
			o.selectFromEvent({}, "2", null, true);
			assert.deepEqual(o.selectedItems, ["2"]);
			o.selectFromEvent({ ctrlKey: true, metaKey: true }, "1", null, true);
			assert.deepEqual(o.selectedItems, ["1", "2"]);
			o.selectFromEvent({ ctrlKey: true, metaKey: true }, "1", null, true);
			assert.deepEqual(o.selectedItems, ["2"]);
			o.selectionMode = "single";
			o.selectFromEvent({ ctrlKey: true, metaKey: true }, "2", null, true);
			assert.deepEqual(o.selectedItems, []);
			o.selectFromEvent({ ctrlKey: true, metaKey: true }, "2", null, true);
			assert.deepEqual(o.selectedItems, ["2"]);
			o.selectionMode = "radio";
			o.selectFromEvent({ ctrlKey: true, metaKey: true }, "2", null, true);
			assert.deepEqual(o.selectedItems, ["2"]);
		},
		teardown: function () {
			//container.parentNode.removeChild(container);
		}
	});
});
