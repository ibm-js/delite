define([
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"../register",
	"dojo/text!../widgetTests/test_ViewStack.html",
	"dui/css!../themes/defaultapp.css",
	"dui/ViewStack"
], function (registerSuite, assert, domGeom, domClass, register, html) {
	var node;
	registerSuite({
		name: "ViewStack",
		setup: function () {
			document.body.innerHTML = html;
			register.parse(document.body);
			node = document.getElementById("vs");
		},
		"Default CSS" : function () {
			assert.isTrue(domClass.contains(node, "d-view-stack"));
		},
		teardown: function () {
			document.body.removeChild(document.body.children[0]);
		}
	});
});
