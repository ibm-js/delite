/*global module */
module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		jshint: {
			src: [
				"**/*.js",
				"!node_modules/**/*.js",

				// Note: skip this file since it gives a JSHint error about a character being silently deleted.
				// It will have to be fixed by the translators.
				"!nls/he/loading.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		// Task for compiling less files into CSS files
		less: {
			// Infrastructure
			common : {
				files: [
					{
						expand: true,
						src: ["css/common.less", "css/global.less"],
						ext: ".css"
					}
				]
			},

			// Compile less code for each widget
			widgets : {
				files: [
					{
						expand: true,
						src: [
							"DialogUnderlay/*.less",
							"Scrollable/*.less",
							"samples/ExampleWidget/*.less"
						],
						ext: ".css"
					}
				]
			}
		},

		"jsdoc-amddcl": {
			docs: {
				files: [
					{
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						imports: [
							"../decor/out"
						],
						paths: {
							"ibm-decor": "../../../node_modules/decor/docs/api/0.3.0/decor"
						},
						packagePathFormat: "${name}/docs/api/${version}",
						includeEventsInTOC: "false"
					}
				]
			},
			export: {
				files: [
					{
						args: [
							"-X"
						],
						src: [
							".",
							"./README.md",
							"./package.json"
						],
						dest: "./out/doclets.json",
						imports: [
							"../decor/out"
						]
					}
				]
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("jsdoc-amddcl");

	// Aliases
	grunt.registerTask("css", ["less"]);
	grunt.registerTask("jsdoc", "jsdoc-amddcl");
};
