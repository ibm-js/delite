/*global module */
module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		jshint: {
			src: [
				"**/*.js",
				"!{node_modules,dijit,form,layout,mobile}/**/*.js",

				// Note: skip this file since it gives a JSHint error about a character being silently deleted.
				// It will have to be fixed by the translators.
				"!nls/he/loading.js"
			],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		// Task for compiling less files into CSS files
		less : {
			// Compile theme independent files
			transitions: {
				expand: true,
				cwd: "themes/common/transitions",
				src: ["*.less"],
				dest: "themes/common/transitions",
				ext: ".css"
			},

			// Infrastructure per-theme files
			common : {
				files: [
					{
						expand: true,
						src: ["themes/*/*.less", "!themes/common/*.less", "!**/variables.less", "!**/common.less"],
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
							"*/themes/*/*.less",
							"samples/ExampleWidget/themes/*/*.less",
							"!{dijit,mobile}/themes/*/*.less"
						],
						ext: ".css"
					}
				]
			}
		},

		// convert CSS files to JS files
		cssToJs : {
			// conversions removing the CSS files
			replace: {
				src: [
					// infrastructure
					"themes/*/*.css",
					"!themes/common/*.css",
					"themes/common/transitions/*.css",

					// widgets
					"*/themes/*/*.css",
					"samples/ExampleWidget/themes/*/*.css",
					"!{dijit,mobile}/themes/*/*.css"
				],
				options: {
					remove: true
				}
			},

			// conversions keeping the CSS files
			keep: {
				src: [
					// some apps may want to load defaultapp.css as a JS file rather than a CSS file.
					"themes/defaultapp.css",

					// files originally authored as CSS
					"tests/unit/css/*.css"
				]
			}
		},

		intern: {
			local: {
				options: {
					runType: "runner",
					config: "tests/intern.local",
					reporters: ["runner"]
				}
			},
			remote: {
				options: {
					runType: "runner",
					config: "tests/intern",
					reporters: ["runner"]
				}
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
						]
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
						dest: "./out/doclets.json"
					}
				]
			}
		}
	});

	// Load plugins
	grunt.loadNpmTasks("intern");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("jsdoc-amddcl");
	grunt.loadTasks("themes/tasks");// Custom cssToJs task to convert CSS to JS

	// Aliases
	grunt.registerTask("css", ["less", "cssToJs"]);
	grunt.registerTask("jsdoc", "jsdoc-amddcl");

	// Testing.
	// Always specify the target e.g. grunt test:remote, grunt test:remote
	// then add on any other flags afterwards e.g. console, lcovhtml.
	var testTaskDescription = "Run this task instead of the intern task directly! \n" +
		"Always specify the test target e.g. \n" +
		"grunt test:local\n" +
		"grunt test:remote\n\n" +
		"Add any optional reporters via a flag e.g. \n" +
		"grunt test:local:console\n" +
		"grunt test:local:lcovhtml\n" +
		"grunt test:local:console:lcovhtml";
	grunt.registerTask("test", testTaskDescription, function (target) {
		function addReporter(reporter) {
			var property = "intern." + target + ".options.reporters",
				value = grunt.config.get(property);
			if (value.indexOf(reporter) !== -1) {
				return;
			}
			value.push(reporter);
			grunt.config.set(property, value);
		}

		if (this.flags.lcovhtml) {
			addReporter("lcovhtml");
		}

		if (this.flags.console) {
			addReporter("console");
		}
		grunt.task.run("intern:" + target);
	});
};