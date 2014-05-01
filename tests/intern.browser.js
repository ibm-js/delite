// Test file to run infrastructure tests from a browser
// Run using http://localhost/delite/node_modules/intern/client.html?config=tests/intern-browser

define([
	"./intern"
], function (intern) {

	intern.loader = {
		// Previously needed to set this to the location to "../../..", to be relative to client.html.
		// Now it needs more dots.  Not sure why, presumably an intern bug.
		baseUrl: "../../../../.."
	};

	return intern;
});
