// Grunt plugin to convert specified CSS files into JS files

/* global module */
module.exports = function (grunt) {

	var fs = require("fs");

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask("cssToJs", "Convert CSS files to JS files", function () {
		var options = this.options();

		this.files.forEach(function (file) {
			grunt.log.writeln("Processing " + file.src.length + " files.");

			file.src.forEach(function (f) {
				var contents = fs.readFileSync(f, {encoding: "utf-8"}).trim();

				// Replace {{theme}} with name of current theme; used by ExampleWidget
				var theme = f.replace(/.*\/themes\//, "").replace(/\/[^/]+$/, "");
				contents = contents.replace(/{{theme}}/g, theme);

				// Escape quotes etc. in content
				contents = contents.replace(/([\\"\n])/mg, "\\$1");

				var destFile = f.replace(/\.css$/, "_css.js");
				grunt.log.writeln(f + " --> " + destFile);
				fs.writeFileSync(destFile,
					"define(function () {\n" +
						"\t/* jshint multistr: true */\n" +	// because we have multiline string with backslashes
						"\t/* jshint -W015 */\n" +		// workaround jshint spurious error
						"\t/* jshint -W033 */\n" +		// workaround jshint spurious error
						"\treturn \"\\\n" +
							contents +
						"\";\n});\n"
				);

				if (options.remove) {
					fs.unlinkSync(f);
				}
			});
		});
	});
};