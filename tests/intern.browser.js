// Test file to run infrastructure tests from a browser
// Run using http://localhost/delite/node_modules/intern/client.html?config=tests/intern-browser

define([
	"./intern"
], function (intern) {

	intern.loader = {
		// relative to client.html
		baseUrl: "../../.."
	};

	return intern;
});
