// Run grunt --help for help on how to run from the command line.
// Alternately, load this URL to run from the browser:
// http://localhost/delite/node_modules/intern/client.html?config=tests/intern&suites=delite/tests/unit/all

// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.

define({
	// The port on which the instrumenting proxy will listen
	proxyPort: 9000,

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: "internet explorer", version: "11", platform: "Windows 8.1", name: "delite" },
		{ browserName: "firefox", version: "45", platform: "Windows 7", name: "delite" },
		{ browserName: "chrome", version: "36", platform: "Windows 7", name: "delite" },
		{ browserName: "safari", version: "9", name: "delite" },

		{ browserName: "iphone", platform: "OS X 10.10", version: "9.3", deviceName: "iPad Retina", name: "delite" },
		{ browserName: "android", platform: "Linux", version: "5.1", deviceName: "Android Emulator", name: "delite" }
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,

	// Whether or not to start Sauce Connect before running tests
	tunnel: "SauceLabsTunnel",

	// Maximum duration of a test, in milliseconds
	defaultTimeout: 300000, // 5 minutes

	// Maximum time to wait for something (pollUntil, etc...)
	WAIT_TIMEOUT: 180000, // 3 minutes

	// Interval between two polling requests, in milliseconds (for pollUntil)
	POLL_INTERVAL: 500, // 0.5 seconds

	basePath: "..",

	loaders: {
		"host-node": "requirejs",
		"host-browser": "../../requirejs/require.js"
	},

	// Non-functional test suite(s) to run in each browser
	suites: [ "delite/tests/unit/all" ],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [ "delite/tests/functional/all" ],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation:
		/*jshint maxlen:1000*/
		/^(?:dcl|decor|dijit|dojo|dstore|jquery|lie|requirejs.*|webcomponentsjs|dpointer|delite\/(tests|node_modules)|.*\/themes)\//
});
