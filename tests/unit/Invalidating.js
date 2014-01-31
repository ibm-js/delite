define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl", "dojo/Evented", "delite/Stateful", "delite/register", "delite/Invalidating", "delite/Widget"
], function (registerSuite, assert, dcl, Evented, Stateful, register, Invalidating, Widget) {
	registerSuite({
		name: "Invalidating",
		"PostCreation": function () {
			var d = this.async(2000);
			var C = register("test-invalidating-post", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a");
					this.addInvalidatingProperties("b");
				},
				a: null,
				b: null,
				refreshProperties: function () {
					assert(false, "refreshProperties should not be called");
				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"b": true});
				}
			});
			var o = new C();
			var afterPropsR, beforePropsR;
			o.on("refresh-properties-complete", function () {
				assert(false, "refreshProperties should not be called");
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = o._invalidatedProperties;
				beforePropsR = e.invalidatedProperties;
			});
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateRendering", "b": "invalidateRendering" });
			o.b = "foo";
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"b": true});
				d.resolve();
			}, 1000);
			return d;
		},
		"InCreation": function () {
			var d = this.async(2000);
			var C = register("test-invalidating-in", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a", "b");
				},
				a: null,
				b: null,
				refreshProperties: function () {
					assert(false, "refreshProperties should not be called");
				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"b": true});
				}
			});
			var o = new C({b: "foo"});
			var afterPropsR, beforePropsR;
			o.on("refresh-properties-complete", function () {
				assert(false, "refreshProperties should not be called");
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = o._invalidatedProperties;
				beforePropsR = e.invalidatedProperties;
			});
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateRendering", "b": "invalidateRendering" });
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"b": true});
				d.resolve();
			}, 1000);
			return d;
		},
		"OnlyRefreshProperty": function () {
			var d = this.async(2000);
			var C = register("test-invalidating-only-refresh-props", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty"});
					this.addInvalidatingProperties({"b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: function (props) {
					assert.deepEqual(props, {"a": true, "b": true});
					// only a should lead to a refreshRendering
					delete props.b;

				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"a": true});
				}
			});
			var o = new C();
			var afterPropsR, beforePropsR, afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = o._invalidatedProperties;
				beforePropsR = e.invalidatedProperties;
			});
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			o.a = "bar";
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsP, {"a": true});
				assert.deepEqual(beforePropsP, {"a": true, "b": true});
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"a": true});
				d.resolve();
			}, 1000);
			return d;
		},
		"Manual": function () {
			var d = this.async(2000);
			var C = register("test-invalidating-manual", [HTMLElement, Widget, Invalidating], {
				a: null,
				b: null,
				refreshProperties: function (props) {
					assert.deepEqual(props, {"b": true});
				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"b": true});
				}
			});
			var o = new C();
			var afterPropsR, beforePropsR, afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = Object.create(o._invalidatedProperties);
				beforePropsR = e.invalidatedProperties;
			});
			o.startup();
			assert.isNull(o._invalidatingProperties);
			o.b = "foo";
			o.invalidateProperty("b");
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"b": true});
				d.resolve();
			}, 1000);
			return d;
		},
		"PropertyAndRendering": function () {
			var d = this.async(2000);
			var C = register("test-invalidating-prop-rendering", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty", "b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: function (props) {
					assert.deepEqual(props, {"b": true});
				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"b": true});
				}
			});
			var o = new C();
			var afterPropsR, beforePropsR, afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = Object.create(null, o._invalidatedProperties);
				beforePropsR = e.invalidatedProperties;
			});
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"b": true});
				d.resolve();
			}, 1000);
			return d;
		},
		"NonWidget" : function (t) {
			var d = this.async(2000);
			var C = dcl([Invalidating, Stateful, Evented], {
				constructor: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty", "b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: function (props) {
					assert.deepEqual(props, {"b": true});
				},
				refreshRendering: function (props) {
					assert.deepEqual(props, {"b": true});
				}
			});
			var o = new C();
			var afterPropsR, beforePropsR, afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", function (e) {
				afterPropsR = Object.create(o._invalidatedProperties);
				beforePropsR = e.invalidatedProperties;
			});
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			// we need to check before the timeout that refresh-complete was called
			setTimeout(function () {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(afterPropsR, {});
				assert.deepEqual(beforePropsR, {"b": true});
				d.resolve();
			}, 1000);
			return d;
		}
	});
});
