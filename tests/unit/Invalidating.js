define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl", "dojo/Evented", "delite/Stateful", "delite/register", "delite/Invalidating", "delite/Widget"
], function (registerSuite, assert, dcl, Evented, Stateful, register, Invalidating, Widget) {
	registerSuite({
		name: "Invalidating",
		"PostCreation": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-post", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a");
					this.addInvalidatingProperties("b");
				},
				a: null,
				b: null,
				refreshProperties: function () {
					d.reject("refreshProperties should not be called");
				},
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
					assert.equal(this, o, "this should be the object instance");
				})
			});
			var o = new C();
			o.on("refresh-properties-complete", function () {
				d.reject("refreshProperties should not be called");
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"b": true});
			}));
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateRendering", "b": "invalidateRendering" });
			o.b = "foo";
			return d;
		},
		"InCreation": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-in", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a", "b");
				},
				a: null,
				b: null,
				refreshProperties: function () {
					d.reject("refreshProperties should not be called");
				},
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				})
			});
			var o = new C({b: "foo"});
			o.on("refresh-properties-complete", function () {
				d.reject("refreshProperties should not be called");
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"b": true});
			}));
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateRendering", "b": "invalidateRendering" });
			return d;
		},
		"OnlyRefreshProperty": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-only-refresh-props", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty"});
					this.addInvalidatingProperties({"b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"a": true, "b": true});
					// only a should lead to a refreshRendering
					delete props.b;
				}),
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"a": true});
				})
			});
			var o = new C();
			var afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(afterPropsP, {"a": true});
				assert.deepEqual(beforePropsP, {"a": true, "b": true});
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"a": true});
			}));
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			o.a = "bar";
			return d;
		},
		"Manual": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-manual", [HTMLElement, Widget, Invalidating], {
				a: null,
				b: null,
				refreshProperties: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				}),
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				})
			});
			var o = new C();
			var afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"b": true});
			}));
			o.startup();
			assert.isNull(o._invalidatingProperties);
			o.b = "foo";
			o.invalidateProperty("b");
			return d;
		},
		"PropertyAndRendering": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-prop-rendering", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty", "b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				}),
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				})
			});
			var o = new C();
			var afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"b": true});
			}));
			o.startup();
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			return d;
		},
		"NonWidget": function () {
			var d = this.async(1000);
			var C = dcl([Invalidating, Stateful, Evented], {
				constructor: function () {
					this.addInvalidatingProperties({"a": "invalidateProperty", "b": "invalidateProperty"});
				},
				a: null,
				b: null,
				refreshProperties: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				}),
				refreshRendering: d.rejectOnError(function (props) {
					assert.deepEqual(props, {"b": true});
				})
			});
			var o = new C();
			var afterPropsP, beforePropsP;
			o.on("refresh-properties-complete", function (e) {
				afterPropsP = {};
				dcl.mix(afterPropsP, o._invalidatedProperties);
				beforePropsP = e.invalidatedProperties;
			});
			o.on("refresh-rendering-complete", d.callback(function (e) {
				assert.deepEqual(afterPropsP, {"b": true});
				assert.deepEqual(beforePropsP, {"b": true});
				assert.deepEqual(o._invalidatedProperties, {});
				assert.deepEqual(e.invalidatedProperties, {"b": true});
			}));
			assert.deepEqual(o._invalidatingProperties, { "a": "invalidateProperty", "b": "invalidateProperty" });
			o.b = "foo";
			return d;
		},
		"ChangeInRendering": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-change", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a", "b");
				},
				a: null,
				b: null,
				callCount: 0,
				refreshRendering: d.rejectOnError(function (props) {
					if (this.callCount === 0) {
						this.callCount++;
						assert.equal(this.b, "foo");
						assert.isNull(this.a);
						assert.deepEqual(props, {"b": true});
						this.a = "bar";
					} else if (this.callCount === 1) {
						this.callCount++;
						assert.equal(this.b, "foo");
						assert.equal(this.a, "bar");
						assert.deepEqual(props, {"a": true});
						// let some time to verify we are not called yet another time (like infinite call stack
						setTimeout(function () {
							d.resolve();
						}, 500);
					} else {
						// should not happen
						assert(false, "should not happen");
					}
				})
			});
			var o = new C();
			o.startup();
			o.b = "foo";
			return d;
		},
		"Destroy": function () {
			var d = this.async(1000);
			var C = register("test-invalidating-destroy", [HTMLElement, Widget, Invalidating], {
				preCreate: function () {
					this.addInvalidatingProperties("a");
				},
				a: null,
				refreshRendering: function () {
					d.reject("refreshRendering should not be called");
				}
			});
			var o = new C();
			o.startup();
			o.a = "foo";
			o.destroy();
			// let some time to verify we are not called in refreshRendering despite the destroy
			setTimeout(function () {
				d.resolve();
			}, 500);
			return d;
		}
	});
});
