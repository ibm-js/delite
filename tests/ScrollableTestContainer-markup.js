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
	var container;

	/*jshint multistr: true */
	html = "<test-scrollable-container id='sc1' \
			style='position: absolute; width: 200px; height: 200px;'> \
			<div id='sc1content' style='width: 2000px; height: 2000px;'></div> \
			</test-scrollable-container>\
			<my-scrolable-test-container id='mysc1'> \
			</my-scrolable-test-container> \
			<test-scrollable-container scrollDirection='none' id='sc2'> \
			</test-scrollable-container>";

	// The test cases are shared with tests/ScrollableTestContainer-prog via
	// tests/Scrollable-shared which is dynamically mixed into the 
	// test suite below.

	var suite = {
		name: "delite/Scrollable: ScrollableTestContainer in markup",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			container.innerHTML = html;
			register("my-scrolable-test-container", [ScrollableTestContainer], {});
			register.parse();
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
