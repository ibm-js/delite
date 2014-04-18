define([
	"intern!object",
	"intern/chai!assert",
	"dojo/on",
	"delite/handlebars",
	"delite/register",
	"delite/Widget",
	"delite/handlebars!./templates/SimpleHandleBarsButton.html",
	"delite/handlebars!./templates/HandlebarsButton.html",
	"delite/handlebars!./templates/SvgWidget.html"
], function (registerSuite, assert, on, handlebars, register, Widget, simpleHBTmpl, buttonHBTmpl, svgTmpl) {
	var container, myButton;
	registerSuite({
		name: "handlebars",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},
		load: function () {
			// Test that function returned from delite/handlebars! creates the template correctly
			var TestButton = register("test-button", [HTMLButtonElement, Widget], {
				iconClass: "originalClass",
				label: "original label",
				buildRendering: simpleHBTmpl
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

			var TestHtml = register("test-data-attach-point", [HTMLElement, Widget], {
				buildRendering: handlebars.compile(
						"<div data-attach-point='root,root2'>" +
						"<button data-attach-point='myButton, myButton2'>hi</button>" +
						"</div>"
				)
			});

			var node = new TestHtml();

			assert.strictEqual(node.root.tagName.toLowerCase(), "test-data-attach-point", "node.root");
			assert.strictEqual(node.root2.tagName.toLowerCase(), "test-data-attach-point", "node.root");
			assert.strictEqual(node.myButton.tagName.toLowerCase(), "button", "node.myButton");
			assert.strictEqual(node.myButton2.tagName.toLowerCase(), "button", "node.myButton2");
		},

		branching: function () {
			var NoLabelButton = register("no-label-button", [HTMLButtonElement, Widget], {
				iconClass: "originalClass",
				showLabel: false,
				label: "original label",
				buildRendering: buttonHBTmpl
			});
			myButton = new NoLabelButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.firstChild.tagName.toLowerCase(), "span", "icon node exists too");
			assert.strictEqual(myButton.firstChild.className, "d-reset originalClass", "icon class set");
			assert.strictEqual(myButton.textContent.trim(), "", "no label");
			myButton.label = "new label";
			assert.strictEqual(myButton.textContent.trim(), "", "still no label");

			// Test true if condition
			var LabelButton = register("label-button", [HTMLButtonElement, Widget], {
				iconClass: "originalClass",
				showLabel: true,
				label: "original label",
				buildRendering: buttonHBTmpl
			});
			myButton = new LabelButton();
			assert.strictEqual(myButton.tagName.toLowerCase(), "button", "root node exists");
			assert.strictEqual(myButton.firstChild.tagName.toLowerCase(), "span", "icon node exists too");
			assert.strictEqual(myButton.firstChild.className, "d-reset originalClass", "icon class set");
			assert.strictEqual(myButton.textContent.trim(), "original label", "label");

			// Make sure that changes still work
			myButton.label = "new label";
			assert.strictEqual(myButton.textContent.trim(), "new label", "label updated");

		},

		"special props": function () {
			var SpecialPropsWidget = register("special-props", [HTMLElement, Widget], {
				inputClass: "originalClass",	// attribute called "class" but property called "className"
				inputValue: "original value",	// must be set as property
				role: "originalRole",			// must be set as attribute
				buildRendering: handlebars.compile(
						"<special-props><input class='{{inputClass}}' value='{{inputValue}}' " +
						"role='{{role}}'/></special-props>"
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
			var TestList = register("test-ul", [ HTMLUListElement, Widget], {
				label: "bill'\\",
				buildRendering: handlebars.compile(
					"<ul><li foo=\"a.b('c,d')\" bar='\\\"hello\"'>\"\\{{label}}\n\twas \n\there'</li></ul>")
			});
			var myList = new TestList();
			assert.strictEqual(myList.tagName.toLowerCase(), "ul", "root node exists");
			assert.strictEqual(myList.firstChild.tagName.toLowerCase(), "li", "child exists");
			assert.strictEqual(myList.firstChild.getAttribute("foo"), "a.b('c,d')", "single quotes prop");
			assert.strictEqual(myList.firstChild.getAttribute("bar"), "\\\"hello\"", "double quotes, backslash prop");
			assert.strictEqual(myList.firstChild.textContent, "\"\\bill'\\ was here'", "node text");
		},

		events: function () {
			// Test that listeners like onclick work.
			/* global g:true */
			g = 1;
			var TestClick = register("test-events", [ HTMLElement, Widget], {
				buildRendering: handlebars.compile(
					"<span><span onclick='g = 2;'>click me</span></span>")
			});
			var myClick = new TestClick();
			myClick.placeAt(container);
			on.emit(myClick.firstChild, "click", {});
			assert.strictEqual(g, 2, "click handler fired");
		},

		"widgets in templates": function () {
			register("simple-heading", [HTMLElement, Widget], {
				text: "",
				buildRendering: handlebars.compile("<simple-heading>{{text}}</simple-heading>")
			});

			// This widget uses sub-widgets test-button (defined in first test) and also simple-heading.
			var ComplexWidget = register("widgets-in-template", [HTMLElement, Widget], {
				heading: "original heading",
				content: "original content",
				buttonLabel: "original button label",
				buildRendering: handlebars.compile(
						"<widgets-in-template>" +
						"<simple-heading text='{{heading}}'></simple-heading>" +
						"<span>{{content}}</span>" +
						"<button is='test-button' label='{{buttonLabel}}'></button>" +
						"</widgets-in-template>"
				)
			});

			var myComplexWidget = new ComplexWidget(),
				headingWidget = myComplexWidget.getElementsByTagName("simple-heading")[0],
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

		html: function () {
			// Testing that parsing still works if ending tags are missing

			var TestHtml = register("test-html", [HTMLUListElement, Widget], {
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

			var TestSvg = register("test-svg", [HTMLElement, Widget], {
				buildRendering: svgTmpl
			});

			var node = new TestSvg();
			assert.strictEqual(node.tagName.toLowerCase(), "test-svg", "root node exists");

			node = node.firstChild;
			assert.strictEqual(node.tagName, "svg", "svg node exists");
			assert.strictEqual(node.getAttribute("class"), "svg-root-class", "svg node class attribute");
			assert.strictEqual(node.getAttribute("viewBox"), "0 0 30 30", "viewBox");
			assert.strictEqual(node.namespaceURI, "http://www.w3.org/2000/svg", "svg.namespaceURI");

			node = node.firstChild;
			assert.strictEqual(node.tagName, "rect", "rect node exists");
			assert.strictEqual(node.namespaceURI, "http://www.w3.org/2000/svg", "rect.namespaceURI");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
