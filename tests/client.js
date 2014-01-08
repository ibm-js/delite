// Test file to run infrastructure tests from a browser
// Run using http://localhost/delite/node_modules/intern/client.html?config=tests/client

define({
	loader: {
		// location of all the packages, relative to client.html
		baseUrl: "../../.."
	},

	useLoader: {
		"host-node": "requirejs",
		"host-browser": "../../../requirejs/require.js"
	},

	// Non-functional test suites
	suites: [ "delite/tests/unit" ]
});
