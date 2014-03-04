/*global module */
module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		jshint: {
			src: [
				// only doing top level files for now, to avoid old files in dijit/, form/, layout/, and mobile
				"*.js",

				// Skip files that still have many errors or haven't been updated at all (TODO: fix)
				"!a11y.js",
				"!a11yclick.js",
				"!focus.js",
				"!handlebars.js",
				"!place.js",
				"!popup.js",
				"!template.js",
				"!typematic.js"
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
						src: ["themes/*/*.less", "!themes/common/*.less", "!**/variables.less"],
						ext: ".css"
					}
				]
			},

			// Compile less code for each widget
			widgets : {
				files: [
					{
						expand: true,
						src: ["*/themes/*/*.less", "!{dijit,mobile}/themes/*/*.less"],
						ext: ".css"
					}
				]
			}
		},

		// Convert CSS files to JS files
		cssToJs : {
			// convert CSS files generated from LESS files
			intermediate: {
				src: [
					"themes/*/*.css", "!themes/common/*.css", "themes/common/transitions/*.css",	// infrastructure
					"*/themes/*/*.css", "!{dijit,mobile}/themes/*/*.css"	// widgets
				],
				options: {
					remove: true
				}
			},

			// convert files originally authored as CSS, without removing the original CSS files
			original: {
				src: [ "tests/unit/css/*.css" ]
			}
		},

		// Copied from grunt web site but not tested
		uglify: {
			options: {
				banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n"
			},
			build: {
				src: "src/<%= pkg.name %>.js",
				dest: "build/<%= pkg.name %>.min.js"
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
		}
	});
	// Load plugins
	grunt.loadNpmTasks("intern");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadTasks("themes/tasks");// Custom cssToJs task to convert CSS to JS

	grunt.registerTask("default", ["less", "cssToJs"]);
	// always specify the target e.g. grunt test:remote, grunt test:remote
	// then add on any other flags afterwards e.g. console, lcovhtml
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