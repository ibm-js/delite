// run grunt --help for help on how to run
define([
	"./intern"
], function (intern) {
	intern.tunnel = "NullTunnel";

	// Uncomment this line (and modify machine name) for testing against remote VM.
	// intern.proxyUrl = "http://mac.local:9000";

	intern.environments = [
		{ browserName: "chrome" }
	];

	// Instrumentation is disabled for the remote tests due to internal errors on iOS,
	// but we can still turn it on locally.
	intern.excludeInstrumentation =
		/*jshint maxlen:1000*/
		/^(?:dcl|decor|dijit|dojo|dstore|jquery|lie|requirejs.*|webcomponentsjs|dpointer|delite\/(tests|node_modules)|.*\/themes)\//;

	return intern;
});
