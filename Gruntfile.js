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
						src: ["themes/*/common.less", "themes/*/global.less", "!themes/common/*.less"],
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
							"samples/ExampleWidget/themes/*/*.less"
						],
						ext: ".css"
					}
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
						],
						imports: [
							"../decor/out"
						],
						paths: {
							"decor": "../../../../decor/docs/api/0.3.0/decor"
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
	grunt.loadNpmTasks("intern");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("jsdoc-amddcl");

	// Aliases
	grunt.registerTask("css", ["less"]);
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