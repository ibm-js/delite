define([
	"intern!object",
	"intern/chai!assert",
	"dojo/on",
	"delite/handlebars",
	"delite/register",
	"delite/Widget",
	"delite/handlebars!./templates/HandlebarsButton.html",
	"delite/handlebars!./templates/SvgWidget.html",
	"delite/handlebars!./templates/CompoundWidget.html",
	"delite/theme!"		// to get CSS rules for d-hidden
], function (registerSuite, assert, on, handlebars, register, Widget, buttonHBTmpl, svgTmpl, compoundTmpl) {
	var container, myButton;
	registerSuite({

		name: "handlebars",

		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		load: function () {
			// Test that function returned from delite/handlebars! creates the template correctly
			var TestButton = register("handlebars-button", [HTMLButtonElement, Widget], {
				iconClass: "originalClass",
				label: "original label",
				buildRendering: buttonHBTmpl
			});
			myButton = new TestButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.firstChild.tagName.toLowerCase(), "span", "icon node exists too");
			assert.strictEqual(myButton.firstChild.className, "d-reset originalClass", "icon class set");
			assert.strictEqual(myButton.textContent.trim(), "original label", "label set");
		},

		update: function () {
			myButton.label = "new label";
			assert.strictEqual(myButton.textContent.trim(), "new label", "label updated");

			myButton.iconClass = "newClass";
			assert.strictEqual(myButton.firstChild.className, "d-reset newClass", "icon class set");

		},

		"data-attach-point": function () {
			// Testing that data-attach-point works

			var TestHtml = register("handlebars-data-attach-point", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
						"<template data-attach-point='root,root2'>" +
						"<button data-attach-point='myButton, myButton2'>hi</button>" +
						"</template>"
				)
			});

			var node = new TestHtml();

			assert.strictEqual(node.root.tagName.toLowerCase(), "handlebars-data-attach-point", "node.root");
			assert.strictEqual(node.root2.tagName.toLowerCase(), "handlebars-data-attach-point", "node.root");
			assert.strictEqual(node.myButton.tagName.toLowerCase(), "button", "node.myButton");
			assert.strictEqual(node.myButton2.tagName.toLowerCase(), "button", "node.myButton2");
		},

		"special props": function () {
			var SpecialPropsWidget = register("handlebars-special-props", [HTMLElement, Widget], {
				inputClass: "originalClass",	// attribute called "class" but property called "className"
				inputValue: "original value",	// must be set as property
				role: "originalRole",			// must be set as attribute
				buildRendering: handlebars.compile(
						"<template><input class='{{inputClass}}' value='{{inputValue}}' " +
						"role='{{role}}'/></template>"
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
			assert.strictEqual(input.value, "new value", "value changed");
			assert.strictEqual(input.className, "newClass", "class changed");
			assert.strictEqual(input.getAttribute("role"), "newRole", "role changed");

			// TODO: implement and then test reverse binding, from input.value --> widget.value?
		},

		"special characters": function () {
			// Test that special characters are escaped.  This is actually testing template.js.
			var TestList = register("handlebars-ul", [HTMLUListElement, Widget], {
				label: "bill'\\",
				buildRendering: handlebars.compile(
					"<ul><li foo=\"a.b('c,d')\" bar='\\\"hello\"'>\"\\{{label}}\n\twas \n\there'</li></ul>")
			});
			var myList = new TestList();
			assert.strictEqual(myList.tagName.toLowerCase(), "ul", "root node exists");
			assert.strictEqual(myList.firstChild.tagName.toLowerCase(), "li", "child exists");
			assert.strictEqual(myList.firstChild.getAttribute("foo"), "a.b('c,d')", "single quotes prop");
			assert.strictEqual(myList.firstChild.getAttribute("bar"), "\\\"hello\"", "double quotes, backslash prop");
			assert.strictEqual(myList.firstChild.textContent, "\"\\bill'\\\n\twas \n\there'", "node text");
		},

		events: function () {
			// Test that listeners like onclick work.
			/* global g:true */
			g = 1;
			var TestClick = register("handlebars-events", [ HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<template><span onclick='g = 2;'>click me</span></template>")
			});
			var myClick = new TestClick();
			myClick.placeAt(container);
			on.emit(myClick.firstChild, "click", {});
			assert.strictEqual(g, 2, "click handler fired");
		},

		"widgets in templates": function () {
			register("handlebars-heading", [HTMLElement, Widget], {
				text: "",
				buildRendering: handlebars.compile("<handlebars-heading>{{text}}</handlebars-heading>")
			});

			// This widget uses sub-widgets handlebars-button (defined in first test) and also handlebars-heading.
			var ComplexWidget = register("handlebars-widgets-in-template", [HTMLElement, Widget], {
				heading: "original heading",
				content: "original content",
				buttonLabel: "original button label",
				buildRendering: handlebars.compile(
					"<handlebars-widgets-in-template>" +
						"<handlebars-heading text='{{heading}}'></handlebars-heading>" +
						"<span>{{content}}</span>" +
						"<button is='handlebars-button' label='{{buttonLabel}}'></button>" +
					"</handlebars-widgets-in-template>"
				)
			});

			var myComplexWidget = new ComplexWidget(),
				headingWidget = myComplexWidget.getElementsByTagName("handlebars-heading")[0],
				buttonWidget = myComplexWidget.getElementsByTagName("button")[0];
			assert.ok(headingWidget.buildRendering, "heading widget was instantiated");
			assert.strictEqual(headingWidget.textContent, "original heading",
				"heading widget got title from main widget");
			assert.ok(buttonWidget.buildRendering, "button widget was instantiated");
			assert.strictEqual(buttonWidget.textContent.trim(), "original button label",
				"button widget got label from main widget");

			myComplexWidget.mix({
				heading: "new heading",
				buttonLabel: "new button label"
			});
			assert.strictEqual(headingWidget.textContent, "new heading", "heading changed");
			assert.strictEqual(buttonWidget.textContent.trim(), "new button label", "button changed");
		},

		"data-requires": function () {
			// Another test of widgets in templates, but this time loading the template from a file.
			// This makes sure that the data-requires attribute will pull in the specified modules.
			var CompoundWidget = register("test-compound-widget", [HTMLElement, Widget], {
				buildRendering: compoundTmpl
			});

			var myCompoundWidget = new CompoundWidget(),
				sub1 = myCompoundWidget.getElementsByTagName("test-widget-1")[0],
				sub2 = myCompoundWidget.getElementsByTagName("test-widget-2")[0];
			assert(sub1.buildRendering, "sub1 instantiated");
			assert(sub2.buildRendering, "sub2 instantiated");
		},

		html: function () {
			// Testing that parsing still works if ending tags are missing

			var TestHtml = register("handlebars-html", [HTMLUListElement, Widget], {
				buildRendering: handlebars.compile("<ul><li>1</li><li><input></ul>")
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

			var TestSvg = register("handlebars-svg", [HTMLElement, Widget], {
				buildRendering: svgTmpl
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
				buildRendering: handlebars.compile(
					"<template>\n<span>hello</span> <span>world</span>\n</template>"
				)
			});
			var ws = new WhiteSpace();
			assert.strictEqual(ws.childNodes.length, 3, "middle whitespace preserved, start/end whitespace deleted");

			var WhiteSpaceNbsp = register("handlebars-whitespace-two", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<template>&nbsp;<span>hello</span> <span>world</span>&nbsp;</template>"
				)
			});
			var wsn = new WhiteSpaceNbsp();
			assert.strictEqual(wsn.childNodes.length, 5, "all &nbsp preserved");

			var WhiteSpaceComments = register("handlebars-whitespace-three", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<template>\n<!--stray comment-->\n<span>hello</span> <span>world</span>\n</template>"
				)
			});
			var wsc = new WhiteSpaceComments();
			assert.strictEqual(wsc.childNodes.length, 3, "comments don't break trimming");

			var WhiteSpacePre = register("handlebars-whitespace-pre", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<template><pre>\thello\n\tworld </pre></template>"
				)
			});
			var wsp = new WhiteSpacePre();
			assert.strictEqual(wsp.innerHTML, "<pre>\thello\n\tworld </pre>", "pre whitespace preserved");
		},

		"self closing tags": function () {
			var SelfClosing = register("handlebars-self-closing", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<template>Hello <br/><input>world</template>"
				)
			});
			var sc = new SelfClosing();
			assert.strictEqual(sc.childNodes.length, 4, "# of child nodes");
		},

		nestedProperties: function () {
			// Testing that nested properties work, with the caveat that updates are only detected if
			// the top level property is changed.
			// Also tests that undefined values convert to "" rather than "undefined".

			var TestNested = register("handlebars-nested", [HTMLElement, Widget], {
				item: {
					first: "Bob"
				},

				buildRendering: handlebars.compile(
					"<span class={{item.className}}>Hello {{item.first}} {{item.last}}!</span>")
			});

			var node = new TestNested();
			assert.strictEqual(node.className, "", "class #1");
			assert.strictEqual(node.textContent.trim(), "Hello Bob !", "textContent #1");

			node.item = {
				first: "Tom"
			};
			assert.strictEqual(node.className, "", "class #2");
			assert.strictEqual(node.textContent.trim(), "Hello Tom !", "textContent #2");

			node.item = {
				first: "Fred",
				last: "Smith",
				className: "blue"
			};
			assert.strictEqual(node.className, "blue", "class #3");
			assert.strictEqual(node.textContent.trim(), "Hello Fred Smith!", "textContent #3");
		},

		"d-hidden": function () {
			var TestNested = register("handlebars-hide", [HTMLElement, Widget], {
				hideSpan: true,
				buildRendering: handlebars.compile("<span d-hidden={{hideSpan}}>hello world</span>")
			});

			var node = new TestNested();
			node.placeAt(container);
			assert.strictEqual(getComputedStyle(node).display, "none", "hidden");

			node.hideSpan = false;
			assert.strictEqual(getComputedStyle(node).display, "inline", "not hidden");
		},

		"d-shown": function () {
			var TestNested = register("handlebars-show", [HTMLElement, Widget], {
				showSpan: true,
				buildRendering: handlebars.compile("<span d-shown={{showSpan}}>hello world</span>")
			});

			var node = new TestNested();
			node.placeAt(container);
			assert.strictEqual(getComputedStyle(node).display, "inline", "not hidden");

			node.showSpan = false;
			assert.strictEqual(getComputedStyle(node).display, "none", "hidden");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
