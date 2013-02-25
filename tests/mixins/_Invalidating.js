define(["doh", "dojo/_base/declare", "../../mixins/_Invalidating", "../../_WidgetBase"],
	function(doh, declare, _Invalidating, _WidgetBase){
	doh.register("mixins._Invalidating", [
		function test_Lifecycle(t){
			var C = declare("MyWidget", [_WidgetBase, _Invalidating], {
				constructor: function(){
					this.invalidatingProperties = ["a"];
					this.addInvalidatingProperties(["b"]);
				}					
			});
			var o = new C();
			o.startup();
			t.is(["a", "b"], o.invalidatingProperties);
		}
	]);
});
