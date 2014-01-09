define([
	"dcl/dcl",
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"delite/register",
	"./ScrollableTestContainer",
	"./Scrollable-shared"
], function (dcl, registerSuite, assert, domGeom, domClass, register,
			 ScrollableTestContainer, ScrollableSharedTests) {
	var container, MyScrollableTestContainer;

	// The test cases are shared with tests/ScrollableTestContainer-markup via
	// tests/Scrollable-shared which is dynamically mixed into the 
	// test suite below.

	var suite = {
		name: "delite/Scrollable: ScrollableTestContainer programatically",
		setup: function () {
			MyScrollableTestContainer = register("my-sc-prog", [ScrollableTestContainer], {});

			var w = new ScrollableTestContainer({ id: "sc1" });
			w.style.position = "absolute";
			w.style.width = "200px";
			w.style.height = "200px";
			w.startup();
			document.body.appendChild(w);

			var innerContent = document.createElement("div");
			innerContent.id = "sc1content";
			innerContent.style.width = "2000px";
			innerContent.style.height = "2000px";
			w.startup();
			w.appendChild(innerContent);

			w = new MyScrollableTestContainer({ id: "mysc1" });
			w.startup();
			document.body.appendChild(w);

			w = new ScrollableTestContainer({ id: "sc2" });
			w.scrollDirection = "none";
			w.startup();
			document.body.appendChild(w);
		},
		teardown: function () {
			var body = document.body;
			while (body.firstChild) {
				body.removeChild(body.firstChild);
			}
		}
	};

	dcl.mix(suite, ScrollableSharedTests);

	registerSuite(suite);
});
