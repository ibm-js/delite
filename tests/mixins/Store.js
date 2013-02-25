define(["doh", "dojo/_base/declare", "../../_WidgetBase",  "../../mixins/Store",
	"dojo/store/Observable", "dojo/store/JsonRest", "dojo/store/Memory", "dojo/when"],
	function(doh, declare, _WidgetBase, Store, Observable, JsonRest, Memory, when){

	var C = declare("MyWidget", [_WidgetBase, Store]);

	doh.register("mixins.Store", [
		function test_Error(t){
			var store = new C();
			when(store.set("store", new JsonRest({ target: "/" }), function(){
				t.f(true, "ok fct must not have been called");
			}, function(){
				t.t(true, "failure fct must have been called");
			}));
		},

		function test_Updates(t){
			var store = new C();
			var myData = [ { id: "foo", name: "Foo" }, { id: "bar", name: "Bar" } ];
			var myStore =  Observable(new Memory({ data: myData }));
			when(store.set("store", myStore), function(){
				t.assertEqual(myData, store.get("items"));
				myStore.put({ id: "foo", name : "Foo2" });
				t.assertEqual([ { id: "foo", name: "Foo2" }, { id: "bar", name: "Bar" } ], store.get("items"));
				myStore.add({ id: "fb", name : "FB" });
				t.assertEqual( [ { id: "foo", name: "Foo2" }, { id: "bar", name: "Bar" }, { id: "fb", name: "FB" } ], store.get("items"));
				myStore.remove("bar");
				t.assertEqual([{ id: "foo", name: "Foo2" }, { id: "fb", name: "FB" } ], store.get("items"));
			});
		}
	]);
});
