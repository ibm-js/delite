define([
	"require",
	"intern!object",
	"intern/chai!assert",
	"requirejs-dplugins/Promise!",
	"delite/handlebars",
	"delite/register",
	"delite/Widget",
	"delite/handlebars!./templates/HandlebarsButton.html",
	"delite/theme!"		// to get CSS rules for d-hidden
], function (require, registerSuite, assert, Promise, handlebars, register, Widget, buttonHBTmpl) {
	var container, myButton;
	registerSuite({

		name: "handlebars",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		types: function () {
			var MyWidget = register("handlebars-types", [HTMLElement, Widget], {
				number: 0,
				boolean: false,
				string: "hi",
				"null": null,
				template: handlebars.compile(
					"<template>number {{number}}, boolean {{boolean}}, string {{string}}, null {{null}}</template>"
				)
			});

			var myWidget = new MyWidget({});

			assert.strictEqual(myWidget.textContent.trim(), "number 0, boolean false, string hi, null");
		},

		"load from file": function () {
			// Test that function returned from delite/handlebars! creates the template correctly
			var TestButton = register("handlebars-button", [HTMLButtonElement, Widget], {
				iconClass: "originalClass",
				label: "original label",
				template: buttonHBTmpl
			});
			myButton = new TestButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.firstChild.tagName.toLowerCase(), "span", "icon node exists too");
			assert.strictEqual(myButton.firstChild.className, "d-reset originalClass", "icon class set");
			assert.strictEqual(myButton.textContent.trim(), "original label", "label set");
		},

		update: function () {
			myButton.label = "new label";
			myButton.iconClass = "newClass";
			myButton.deliver();
			assert.strictEqual(myButton.textContent.trim(), "new label", "label updated");
			assert.strictEqual(myButton.firstChild.className, "d-reset newClass", "icon class set");
		},

		"attach-point": function () {
			// Testing that attach-point works

			var TestHtml = register("handlebars-attach-point", [HTMLElement, Widget], {
				// We support attach-point for most people, and data-attach-point for people that want to use
				// an HTML5 validator.
				template: handlebars.compile(
					"<template attach-point='root,root2'>" +
						"<button data-attach-point='myButton, myButton2'>hi</button>" +
					"</template>"
				)
			});

			var node = new TestHtml();

			assert.strictEqual(node.root.tagName.toLowerCase(), "handlebars-attach-point", "node.root");
			assert.strictEqual(node.root2.tagName.toLowerCase(), "handlebars-attach-point", "node.root");
			assert.strictEqual(node.myButton.tagName.toLowerCase(), "button", "node.myButton");
			assert.strictEqual(node.myButton2.tagName.toLowerCase(), "button", "node.myButton2");
		},

		"special props": {
			general: function () {
				var SpecialPropsWidget = register("handlebars-special-props", [HTMLElement, Widget], {
					inputClass: "originalClass",	// attribute called "class" but property called "className"
					inputValue: "original value",	// must be set as property
					role: "originalRole",			// must be set as attribute
					template: handlebars.compile(
						"<template>" +
							"<input class='{{inputClass}}' value='{{inputValue}}' role='{{role}}'/>" +
						"</template>"
					)
				});
				var mySpecialPropsWidget = new SpecialPropsWidget();
				var input = mySpecialPropsWidget.children[0];

				assert.strictEqual(input.value, "original value", "value set as property");
				assert.strictEqual(input.className, "originalClass",
					"class set even though property is called className, not class");
				assert.strictEqual(input.getAttribute("role"), "originalRole", "role set as attribute");

				mySpecialPropsWidget.mix({
					inputClass: "newClass",
					inputValue: "new value",
					role: "newRole"
				});
				mySpecialPropsWidget.deliver();

				assert.strictEqual(input.value, "new value", "value changed");
				assert.strictEqual(input.className, "newClass", "class changed");
				assert.strictEqual(input.getAttribute("role"), "newRole", "role changed");
			},

			select: function () {
				var MySelect = register("handlebars-select-1", [HTMLElement, Widget], {
					foo: 0,
					size: 0,
					multiple: false,
					template: handlebars.compile(
							"<template><select data-attach-point='select' foo='{{foo}}' " +
									"size='{{size}}' multiple='{{multiple}}'>" +
								"<option value=''>hello now</option>" +
								"<option selected='selected' value='CA16'>Reference Number</option>" +
							"</select></template>"
					)
				});

				var mySelect = new MySelect({ // custom values
					foo: 2,
					size: 2,
					multiple: true
				});

				var select = mySelect.select;
				assert.strictEqual(select.getAttribute("foo"), "2", "foo");
				assert.strictEqual(select.size, 2, "size");
				assert.strictEqual(select.multiple, true, "multiple");
				assert.strictEqual(select.selectedIndex, 1, "selected=selected");

				// Also make sure that <option selected> markup works.
				var MySelect2 = register("handlebars-select-2", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template><select attach-point='select'>" +
							"<option value=''>hello now</option>" +
							"<option selected value='CA16'>Reference Number</option>" +
						"</select></template>"
					)
				});
				var mySelect2 = new MySelect2();
				assert.strictEqual(mySelect2.select.selectedIndex, 1, "selected");
			},

			autocorrect: function () {
				var MyWidget = register("handlebars-special-props-3", [HTMLElement, Widget], {
					foo: 0,
					size: 0,
					multiple: false,
					template: handlebars.compile(
							"<template><input autocorrect='off'></template>"
					)
				});

				var myWidget = new MyWidget({});

				assert.strictEqual(myWidget.children[0].getAttribute("autocorrect"), "off");
			}
		},

		"special characters": function () {
			// Test that special characters are escaped.  This is actually testing template.js.
			var TestList = register("handlebars-ul", [HTMLUListElement, Widget], {
				label: "bill'\\",
				template: handlebars.compile(
					"<ul><li foo=\"a.b('c,d')\" bar='\\\"hello\"'>\"\\{{label}}\n\twas \n\there'</li></ul>")
			});
			var myList = new TestList();

			assert.strictEqual(myList.tagName.toLowerCase(), "ul", "root node exists");
			assert.strictEqual(myList.firstChild.tagName.toLowerCase(), "li", "child exists");
			assert.strictEqual(myList.firstChild.getAttribute("foo"), "a.b('c,d')", "single quotes prop");
			assert.strictEqual(myList.firstChild.getAttribute("bar"), "\\\"hello\"", "double quotes, backslash prop");
			assert.strictEqual(myList.firstChild.textContent, "\"\\bill'\\\n\twas \n\there'", "node text");
		},

		"attach-event": {
			"widget-callback": function () {
				// Test for syntax connecting to a method in the widget: on-click='{{clickHandler}}'
				var TestListener = register("handlebars-attach-events", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template><button on-click='{{clickHandler}}' type=button>click me</button></template>"),
					clicks: 0,
					clickHandler: function () {
						this.clicks++;
					}
				});
				var myListener = new TestListener();
				myListener.placeAt(container);
				myListener.firstChild.click();
				assert.strictEqual(myListener.clicks, 1, "click callback fired");
			},

			"anonymous-function": function () {
				// Test for syntax with an inline function definition.  Apparently used by dapp.
				/* global g:true */
				g = 1;
				var TestClick = register("handlebars-events", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template><button on-click='g = 2;' type=button>click me</button></template>")
				});
				var myClick = new TestClick();
				myClick.placeAt(container);
				myClick.firstChild.click();
				assert.strictEqual(g, 2, "click handler fired");
			}
		},

		"widgets in templates": {
			basic: function () {
				register("handlebars-heading", [HTMLElement, Widget], {
					text: "",
					template: handlebars.compile("<template>{{text}}</template>")
				});

				// This widget uses sub-widgets handlebars-button (defined in first test) and also handlebars-heading.
				var ComplexWidget = register("handlebars-widgets-in-template", [HTMLElement, Widget], {
					heading: "original heading",
					content: "original content",
					buttonLabel: "original button label",
					template: handlebars.compile(
						"<template>" +
							"<handlebars-heading text='{{heading}}'></handlebars-heading>" +
							"<span>{{content}}</span>" +
							"<button is='handlebars-button' label='{{buttonLabel}}'></button>" +
						"</template>"
					)
				});

				var myComplexWidget = new ComplexWidget(),
					headingWidget = myComplexWidget.getElementsByTagName("handlebars-heading")[0],
					buttonWidget = myComplexWidget.getElementsByTagName("button")[0];

				assert.ok(headingWidget.render, "heading widget was instantiated");
				assert.ok(buttonWidget.render, "button widget was instantiated");

				myComplexWidget.placeAt(container);

				assert.ok(myComplexWidget.attached, "myComplexWidget widget was attached");
				assert.ok(headingWidget.attached, "heading widget was attached");
				assert.ok(buttonWidget.attached, "button widget was attached");

				assert.strictEqual(headingWidget.textContent, "original heading",
					"heading widget got title from main widget");
				assert.strictEqual(buttonWidget.textContent.trim(), "original button label",
					"button widget got label from main widget");

				myComplexWidget.mix({
					heading: "new heading",
					buttonLabel: "new button label"
				});
				myComplexWidget.deliver();

				assert.strictEqual(headingWidget.textContent, "new heading", "heading changed");
				assert.strictEqual(buttonWidget.textContent.trim(), "new button label", "button changed");

				container.removeChild(myComplexWidget);
				myComplexWidget.detachedCallback();

				assert.isFalse(myComplexWidget.attached, "myComplexWidget widget was detached");
				assert.isFalse(headingWidget.attached, "heading widget was detached");
				assert.isFalse(buttonWidget.attached, "button widget was detached");
			},

			buttons: function () {
				var ButtonWidget = register("handlebars-buttons-in-template", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template>" +
							"<button is='handlebars-button' label='Default button'></button> " +
							"<button is='handlebars-button' label='Blue button'></button> " +
							"<button is='handlebars-button' label='Red button'></button> " +
						"</template>"
					)
				});
				var testWidget = new ButtonWidget();
				testWidget.placeAt(container);

				// Make sure all the buttons are siblings of each other, not parent-child.
				assert.strictEqual(testWidget.children.length, 3, "direct children");
			},

			"boolean bind var": function () {
				register("handlebars-layout", [HTMLElement, Widget], {
					vertical: true,
					num: 0,
					template: handlebars.compile(
						"<template class='{{this.vertical ? \"vertical\" : \"horizontal\"}}'></template>"
					)
				});

				// This widget uses sub-widgets handlebars-button (defined in first test) and also handlebars-heading.
				var ComplexWidget = register("handlebars-wit-boolean-bind", [HTMLElement, Widget], {
					layout: false,
					template: handlebars.compile(
						"<template>" +
							"<handlebars-layout vertical={{layout}}></handlebars-layout>" +
						"</template>"
					)
				});

				var myComplexWidget = new ComplexWidget();

				assert.strictEqual(myComplexWidget.firstElementChild.vertical, false, "prop is false not 'false'");
				assert.strictEqual(myComplexWidget.firstElementChild.className, "horizontal", "className");
			},

			"attribute boolean/number literal": function () {
				// This widget uses sub-widgets handlebars-button (defined in first test) and also handlebars-heading.
				var ComplexWidget = register("handlebars-wit-boolean-lit", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template>" +
							"<handlebars-layout vertical=false num=123></handlebars-layout>" +
						"</template>"
					)
				});

				var myComplexWidget = new ComplexWidget();

				assert.strictEqual(myComplexWidget.firstElementChild.vertical, false, "prop is false not 'false'");
				assert.strictEqual(myComplexWidget.firstElementChild.className, "horizontal", "className");
				assert.strictEqual(myComplexWidget.firstElementChild.num, 123, "num prop number, not string");
			}
		},

		requires: function () {
			// Another test of widgets in templatea.
			// This makes sure that the requires attribute (in the top level <template> node)
			// will pull in the specified modules.

			var templateText = "<!-- \n" +
				"Test having widgets in templates\n" +
				"-->\n" +
				"<template requires='delite/tests/unit/resources/TestWidget1, " +
						"delite/tests/unit/resources/TestWidget2'>\n" +
					"<test-widget-1>hello</test-widget-1>\n" +
					"<test-widget-2>world</test-widget-2>\n" +
				"</template>";

			return new Promise(function (resolve) {
				// workaround apparent requirejs or chrome race condition bug causing spurious
				// error about a load timeout for TestWidget1 and TestWidget2
				setTimeout(resolve, 10000);
			}).then(function () {
				return handlebars.requireAndCompile(templateText, require);
			}).then(function (template) {
				var CompoundWidget = register("test-compound-widget", [HTMLElement, Widget], {
					template: template
				});

				var myCompoundWidget = new CompoundWidget(),
					sub1 = myCompoundWidget.getElementsByTagName("test-widget-1")[0],
					sub2 = myCompoundWidget.getElementsByTagName("test-widget-2")[0];
				assert(sub1.render, "sub1 instantiated");
				assert(sub2.render, "sub2 instantiated");
			});
		},

		html: function () {
			// Testing that parsing still works if ending tags are missing

			var TestHtml = register("handlebars-html", [HTMLUListElement, Widget], {
				template: handlebars.compile("<ul><li>1</li><li><input></ul>")
			});

			var node = new TestHtml();
			assert.strictEqual(node.tagName.toLowerCase(), "ul", "root node exists");

			node = node.firstChild;
			assert.strictEqual(node.tagName.toLowerCase(), "li", "first li exists");
			assert.strictEqual(node.textContent, "1", "first li value");

			node = node.nextSibling;
			assert.strictEqual(node.tagName.toLowerCase(), "li", "second li exists");

			node = node.firstChild;
			assert.strictEqual(node.tagName.toLowerCase(), "input", "input exists");
		},

		svg: function () {
			// Testing template with embedded SVG, for:
			//		1. xmlns attribute recognized, calls createElementNS() not createElement()
			//		2. class attribute still works
			//		3. tags of SVG nodes are lowercase
			//		4. attribute names are case sensitive

			var template = "<!-- comment -->\n" +
				"<template style='width: 50px; height: 50px;'>\n" +
				"<svg width='20px' height='20px' version='1.1' viewBox='0 0 30 30' preserveAspectRatio='none'\n" +
				"class='svg-root-class' xmlns='http://www.w3.org/2000/svg'>\n" +
				"<rect width='100%' height='100%' fill='red'></rect>" +
				"<text x='49%' y='65%' font-size='14' font-weight='bold' fill='black' text-anchor='middle'>10%</text>" +
				"</svg>" +
				"</template>";
			var TestSvg = register("handlebars-svg", [HTMLElement, Widget], {
				template: handlebars.compile(template)
			});

			var node = new TestSvg();
			assert.strictEqual(node.tagName.toLowerCase(), "handlebars-svg", "root node exists");

			node = node.firstChild;
			assert.strictEqual(node.tagName, "svg", "svg node exists");
			assert.strictEqual(node.getAttribute("class"), "svg-root-class", "svg node class attribute");
			assert.strictEqual(node.getAttribute("viewBox"), "0 0 30 30", "viewBox");
			assert.strictEqual(node.namespaceURI, "http://www.w3.org/2000/svg", "svg.namespaceURI");

			node = node.firstChild;
			assert.strictEqual(node.tagName, "rect", "rect node exists");
			assert.strictEqual(node.namespaceURI, "http://www.w3.org/2000/svg", "rect.namespaceURI");
		},

		whitespace: function () {
			var WhiteSpace = register("handlebars-whitespace-one", [HTMLElement, Widget], {
				template: handlebars.compile(
					"<template>\n<span>hello</span> <span>world</span>\n</template>"
				)
			});
			var ws = new WhiteSpace();
			assert.strictEqual(ws.childNodes.length, 3, "middle whitespace preserved, start/end whitespace deleted");

			var WhiteSpaceNbsp = register("handlebars-whitespace-two", [HTMLElement, Widget], {
				template: handlebars.compile(
					"<template>&nbsp;<span>hello</span> <span>world</span>&nbsp;</template>"
				)
			});
			var wsn = new WhiteSpaceNbsp();
			assert.strictEqual(wsn.childNodes.length, 5, "all &nbsp preserved");

			var WhiteSpaceComments = register("handlebars-whitespace-three", [HTMLElement, Widget], {
				template: handlebars.compile(
					"<template>\n<!--stray comment-->\n<span>hello</span> <span>world</span>\n</template>"
				)
			});
			var wsc = new WhiteSpaceComments();
			assert.strictEqual(wsc.childNodes.length, 3, "comments don't break trimming");

			var WhiteSpacePre = register("handlebars-whitespace-pre", [HTMLElement, Widget], {
				template: handlebars.compile(
					"<template><pre>\thello\n\tworld </pre></template>"
				)
			});
			var wsp = new WhiteSpacePre();
			assert.strictEqual(wsp.innerHTML, "<pre>\thello\n\tworld </pre>", "pre whitespace preserved");
		},

		"self closing tags":  {
			html: function () {
				var SelfClosing = register("handlebars-self-closing", [HTMLElement, Widget], {
					template: handlebars.compile(
						"<template>Hello <br/><input>world</template>"
					)
				});
				var sc = new SelfClosing();
				assert.strictEqual(sc.childNodes.length, 4, "# of child nodes");
			},

			mixed: function () {
				var TestSvg = register("handlebars-self-closing-mixed", [HTMLElement, Widget], {
					template: handlebars.compile("<template>\n" +
					"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' " +
					"xmlns:xlink='http://www.w3.org/1999/xlink' width='32' height='32' viewBox='0 0 32 32'>\n" +
					"<path d='M27 4l-15 15-7-7-5 5 12 12 20-20z' fill='#000000'></path>\n" +
					"</svg>\n" +
					"<input type='checkbox' />\n" +
					"</template>")
				});

				var node = new TestSvg();
				assert.strictEqual(node.tagName.toLowerCase(), "handlebars-self-closing-mixed", "root node exists");
				assert.strictEqual(node.children.length, 2, "# of children");
			}
		},

		"undefined replacement vars": function () {
			// Tests that undefined replacement vars in className and innerHTML
			// convert to "" rather than "undefined".

			var TestUndefined = register("handlebars-undefined", [HTMLElement, Widget], {
				first: "Bob",

				template: handlebars.compile(
					"<span class={{className}}>Hello {{first}} {{last}}!</span>")
			});

			var node = new TestUndefined();
			assert.strictEqual(node.className, "", "class #1");
			assert.strictEqual(node.textContent.trim(), "Hello Bob !", "textContent #1");

			node.first = "Tom";
			node.deliver();
			assert.strictEqual(node.className, "", "class #2");
			assert.strictEqual(node.textContent.trim(), "Hello Tom !", "textContent #2");
		},

		nestedProperties: function () {
			// Testing that nested properties work, with the caveat that updates are only detected if
			// the top level property is changed.
			// Also tests that undefined replacement vars in className and innerHTML
			// convert to "" rather than "undefined".

			var TestNested = register("handlebars-nested", [HTMLElement, Widget], {
				item: {
					first: "Bob"
				},

				template: handlebars.compile(
					"<span class={{item.className}}>Hello {{item.first}} {{item.last}}!</span>")
			});

			var node = new TestNested();
			assert.strictEqual(node.className, "", "class #1");
			assert.strictEqual(node.textContent.trim(), "Hello Bob !", "textContent #1");

			node.item = {
				first: "Tom"
			};
			node.deliver();
			assert.strictEqual(node.className, "", "class #2");
			assert.strictEqual(node.textContent.trim(), "Hello Tom !", "textContent #2");

			node.item = {
				first: "Fred",
				last: "Smith",
				className: "blue"
			};
			node.deliver();
			assert.strictEqual(node.className, "blue", "class #3");
			assert.strictEqual(node.textContent.trim(), "Hello Fred Smith!", "textContent #3");
		},

		aria: function () {
			// To match the aria spec:
			// - boolean values like aria-selected must be represented as the strings "true" or "false".
			// - aria-valuenow attribute should be removed is the value is undefined, but exist if value is ""

			var TestAria = register("handlebars-aria", [HTMLElement, Widget], {
				selected: true,
				value: "",
				template: handlebars.compile(
					"<span aria-selected={{selected}} aria-valuenow={{value}}>hello world</span>")
			});

			// Initial values
			var node = new TestAria();
			node.placeAt(container);
			assert(node.hasAttribute("aria-valuenow"), "aria-valuenow exists");
			assert.strictEqual(node.getAttribute("aria-valuenow"), "", "aria-valuenow initial value");
			assert.strictEqual(node.getAttribute("aria-selected"), "true", "aria-selected initial value");

			// Change
			node.selected = false;
			node.value = undefined;
			node.deliver();
			assert.isFalse(node.hasAttribute("aria-valuenow"), "aria-valuenow removed");
			assert.strictEqual(node.getAttribute("aria-selected"), "false", "aria-selected updated value #1");

			// Change back
			node.selected = true;
			node.value = "";
			node.deliver();
			assert(node.hasAttribute("aria-valuenow"), "aria-valuenow recreated");
			assert.strictEqual(node.getAttribute("aria-valuenow"), "", "aria-valuenow new value");
			assert.strictEqual(node.getAttribute("aria-selected"), "true", "aria-selected updated value #2");
		},

		"hide and show node": {
			"d-hidden": function () {
				var TestNested = register("handlebars-hide", [HTMLElement, Widget], {
					hideSpan: true,
					template: handlebars.compile("<span d-hidden={{hideSpan}}>hello world</span>")
				});

				var node = new TestNested();
				node.placeAt(container);
				node.deliver();
				assert.strictEqual(getComputedStyle(node).display, "none", "hidden");

				node.hideSpan = false;
				node.deliver();
				assert.strictEqual(getComputedStyle(node).display, "inline", "not hidden");
			},

			"d-shown": function () {
				var TestNested = register("handlebars-show", [HTMLElement, Widget], {
					showSpan: true,
					template: handlebars.compile("<span d-shown={{showSpan}}>hello world</span>")
				});

				var node = new TestNested();
				node.placeAt(container);
				assert.strictEqual(getComputedStyle(node).display, "inline", "not hidden");

				node.showSpan = false;
				node.deliver();
				assert.strictEqual(getComputedStyle(node).display, "none", "hidden");
			}
		},

		// Make sure that .deliver() updates the widget synchronously, including updating widgets in the template,
		// and make sure that computeProperties() is called before refreshRendering().
		deliver: function () {
			register("handlebars-text", [HTMLElement, Widget], {
				text: "",
				template: handlebars.compile("<template>{{text}}</template>")
			});

			var ComplexWidget = register("handlebars-equation", [HTMLElement, Widget], {
				a: 0,
				b: 0,
				sum: 0,
				computeProperties: function () {
					this.sum = this.a + this.b;
				},
				template: handlebars.compile(
					"<template>" +
						"<handlebars-text text='{{a}}'></handlebars-text> + " +
						"<handlebars-text text='{{b}}'></handlebars-text> = " +
						"<handlebars-text text='{{sum}}'></handlebars-text>" +
					"</template>"
				)
			});

			var myComplexWidget = new ComplexWidget();
			myComplexWidget.placeAt(container);

			myComplexWidget.a = 1;
			myComplexWidget.b = 1;
			myComplexWidget.deliver();
			assert.strictEqual(myComplexWidget.textContent, "1 + 1 = 2");
		},

		expressions: function () {
			// Test {{ }} with arbitrary javascript

			var TextExpr = register("handlebars-expr", [HTMLElement, Widget], {
				mode: "show",
				bar: 1,
				item: {
					foo: 1
				},
				template: handlebars.compile(
					"<template d-shown=\"{{this.mode === 'show'}}\">" +
						// Intentionally put expression in separate <span> to make sure watching for changes works
						"<span>{{bar}} + {{item.foo}}</span> = <span>{{this.bar + this.item.foo}}</span>" +
					"</template>"
				)
			});

			// Initial values
			var node = new TextExpr();
			node.placeAt(container);
			assert.strictEqual(node.textContent.trim(), "1 + 1 = 2");
			assert.strictEqual(node.getAttribute("d-shown"), "true", "d-shown");

			// Change bar
			node.bar = 2;
			node.deliver();
			assert.strictEqual(node.textContent.trim(), "2 + 1 = 3");

			// Change item.foo
			node.item.foo = 2;
			node.notifyCurrentValue("item");
			node.deliver();
			assert.strictEqual(node.textContent.trim(), "2 + 2 = 4");

			// Change hidden
			node.mode = "hide";
			node.deliver();
			assert.strictEqual(node.getAttribute("d-shown"), "false", "d-shown");
		},

		img: function () {
			// Test that <img> tag in template doesn't try to load a file called {{item.src}}.
			// Unfortunately I can't test that automatically, but this code is here for manual testing.

			var ImgWidget = register("handlebars-img", [HTMLElement, Widget], {
				mode: "show",
				bar: 1,
				item: {
					src: require.toUrl("./images/plus.gif")
				},
				template: handlebars.compile(
					"<template>" +
						"<img " +		// add line break just to stress regex matching
							"src='{{item.src}}'>" +
					"</template>"
				)
			});

			var node = new ImgWidget();
			node.placeAt(container);

			assert.strictEqual(node.firstElementChild.nodeName.toLowerCase(), "img", "tag name");
			assert(/plus.gif/.test(node.firstElementChild.src), "img src set");
		},

		"class": function () {
			// Class is handled specially via addClass()/removeClass() so that it doesn't
			// overwrite the settings from baseClass or user defined classes.

			var ClassConstWidget = register("handlebars-const-class", [HTMLElement, Widget], {
				baseClass: "myBaseClass",
				template: handlebars.compile(
					"<template class='constClass'>" +
						"<span class='{{mySubClass}}'>hi</span>" +
					"</template>"
				)
			});

			var ClassVarWidget = register("handlebars-var-class", [HTMLElement, Widget], {
				baseClass: "myBaseClass",
				templateClass: "myTemplateClass1",
				template: handlebars.compile(
					"<template class='{{templateClass}}'>" +
						"<span class='{{mySubClass}}'>hi</span>" +
					"</template>"
				)
			});

			// Test declarative with class=const
			container.innerHTML = "<handlebars-const-class class='userDefinedClass'></handlebars-const-class>";
			register.parse(container);
			var cwdc = container.firstChild;
			assert.strictEqual(cwdc.className, "userDefinedClass constClass myBaseClass", "declarative const");

			// Test declarative with class={{foo}}
			container.innerHTML = "<handlebars-var-class class='userDefinedClass'></handlebars-var-class>";
			register.parse(container);
			var cwdv = container.firstChild;
			assert.strictEqual(cwdv.className, "userDefinedClass myTemplateClass1 myBaseClass",
				"declarative var, before update");

			cwdv.templateClass = "myTemplateClass2";
			cwdv.deliver();
			assert.strictEqual(cwdv.className, "userDefinedClass myBaseClass myTemplateClass2",
				"declarative var, after update");

			// Test programmatic with class=const
			var cwpc = new ClassConstWidget({
				className: "userDefinedClass"
			});
			assert.strictEqual(cwpc.className, "userDefinedClass constClass myBaseClass", "programmatic const");

			// Test programmatic with class={{foo}}
			var cwpv = new ClassVarWidget({
				className: "userDefinedClass"
			});
			assert.strictEqual(cwpv.className, "userDefinedClass myTemplateClass1 myBaseClass",
				"programmatic var, before update");

			cwpv.templateClass = "myTemplateClass2";
			cwpv.deliver();
			assert.strictEqual(cwpv.className, "userDefinedClass myBaseClass myTemplateClass2",
				"programmatic var, after update");
		},

		"destroying a template": function () {
			// Testing that destroying a template will:
			//		1. remove properties created by attach-point (both on root and sub-nodes)
			//		2. remove listeners set up on root node
			//		3. orphan all sub nodes created by the template

			var TestWidget = register("handlebars-destroy", [HTMLElement, Widget], {
				template: handlebars.compile(
					"<template attach-point='root,root2' on-click='{{clickHandler}}'>" +
					"<button data-attach-point='myButton, myButton2'>hi</button>" +
					"</template>"
				),
				clicks: 0,
				clickHandler: function () {
					this.clicks++;
				}
			});

			var node = new TestWidget();
			container.appendChild(node);

			assert.isDefined(node.root, "node.root set");
			assert.isDefined(node.myButton2, "node.myButton2 set");
			node.myButton.click();	// should bubble up to root element
			assert.strictEqual(node.clicks, 1, "click handler set up");

			node._templateHandle.destroy();

			assert.isUndefined(node.root, "node.root deleted");
			assert.isUndefined(node.myButton2, "node.myButton2 deleted");
			assert.strictEqual(node.children.length, 0, "children detached");

			// make sure click listener was removed
			node.appendChild(document.createElement("button"));
			node.firstChild.click();
			assert.strictEqual(node.clicks, 1, "click listener removed");
		},

		"dynamically updating a template": function () {
			// This is really a test of Widget, but putting it in this file since it uses the handlebars code

			var TestWidget = register("dynamic-template", [HTMLElement, Widget], {
				label: "my label",
				reversed: false,
				createdCallback: function () {
					this.notifyCurrentValue("reversed");
				},
				computeProperties: function (props) {
					if ("reversed" in props) {
						this.template = this.reversed ?
							handlebars.compile(
								"<template on-click='{{clickHandler}}'>" +
									"<input id={{widgetId}}_input type=checkbox data-attach-point=checkboxNode>" +
									"<label for={{widgetId}}_input  data-attach-point=labelNode>{{label}}</label>" +
								"</template>"
							) :
							handlebars.compile(
								"<template on-click='{{clickHandler}}'>" +
								"<label for={{widgetId}}_input  data-attach-point=labelNode>{{label}}</label>: " +
								"<input id={{widgetId}}_input type=checkbox data-attach-point=checkboxNode>" +
								"</template>"
							);
							
					}
				},
				clicks: 0,
				clickHandler: function () {
					this.clicks++;
				}
			});

			// Create widget and test that the "label: checkbox" template is used.
			// Confirms that widget template can be defined in computeProperties() rather than in prototype.
			var node = new TestWidget({
				label: "normal"
			});
			container.appendChild(node);
			assert.strictEqual(node.children[0], node.labelNode, "reversed=false, first child");
			assert.strictEqual(node.children[1], node.checkboxNode, "reversed=false, second child");
			assert.strictEqual(node.textContent.trim(), "normal:", "reversed=false, textContent");

			// Then test that widget template can by dynamically changed.
			node.reversed = true;
			node.label = "reversed";
			node.deliver();
			assert.strictEqual(node.children[0], node.checkboxNode, "reversed=true, first child");
			assert.strictEqual(node.children[1], node.labelNode, "reversed=true, second child");
			assert.strictEqual(node.textContent.trim(), "reversed", "reversed=true, textContent");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
