---
layout: doc
title: delite/nls
---

# delite's natural language support

## Locale

Delite supports a locale setting for the page.
This affects the language of boilerplate text in widgets as well as localizations
such as how numbers and dates are displayed.
The setting is based on the browser's locale, and affects all widgets on the page.

Note that the HTML `lang` attribute set on individual elements is ignored.
This is because messages are loaded via the i18n! plugin, which uses the locale of the page.

## RTL and BIDI support

Delite and dependent projects like deliteful support widgets rendered in either LTR or RTL.
Support encompasses features like:

* GUI layout (ex: whether a Combobox's arrow is to the left or right of the `<input>` area)
* Keyboard control: make sure that the left and right arrow keys move to the left and right (respectively) even when
the page is in RTL mode.
* `textdir` property used to control widget text direction independently of GUI direction.  See below for details.

### has("bidi") flag

If an application will (or may be) run in RTL locales, it should define the `has("bidi")` flag as follows:

```js
requirejs.config({
	...
	config: {
		...
		"requirejs-dplugins/has": {
			bidi: true
		}
	}
});
```

The `has("bidi")` flag enables advanced bidi features such as the `textdir` property.
In addition, for some widgets, it's necessary to turn on `has("bidi")` to get basic RTL features
such as correct keyboard handling and proper GUI layout.


### Textdir

The `textdir` property is useful in two cases:

1. When the application boilerplate text is LTR, but the user data contained by the application
is RTL (or vice-versa).  The typical case is that the application boilerplate text is in English, because it
hasn't been translated, but the user data displayed by the application is Hebrew, Arabic, etc.
2. When the user data (that widgets display) is [bidirectional text](http://en.wikipedia.org/wiki/Bi-directional_text),
for example a sentence in Hebrew that contains words in English.

In either case, `textdir` declares the "natural text direction", i.e. whether the text should be written
right-to-left or left-to-right.  For example, in the text "Hello אר!", "Hello" should appear on the left, but in
the text "!Bob שלום", the Hebrew word for "hello" appears on the right.

The allowed values are:

1. "ltr"
2. "rtl"
3. "auto" - contextual - the direction of a text defined by first strong letter (see
http://en.wikipedia.org/wiki/Bi-directional_text for an explanation of strong characters vs. weak characters)

Note that the `textdir` property must be set directly on each widget.
Unlike `dir`, `textdir` will not be inherited from a setting on `<html>` or `<body>`.

### Limitations of RTL support

For reasons of performance and practicality, delite has certain restrictions on its RTL and bidi support.

Delite's API is currently optimized to support one of the two cases:

1. application GUI layout and user data is LTR text
2. application GUI layout and user data is RTL text

In either case, delite will do the right thing simply by setting `<body dir=ltr>` or `<body dir=rtl>`.

Delite also has limited support for displaying part of the page in RTL but other parts in LTR,
by directly setting the `dir` and  of individual widgets, but the application should obey the following rules:

* Applications should not set `dir=ltr` or `dir=rtl` except on `<html>` or `<body>`, and on individual widgets.
* Applications should not change the `dir` setting on `<html>` or `<body>` after widgets have been instantiated.
* Applications should not set `dir=auto` on any widget, nor on any ancestor node.
* If the application sets the `dir` property of any widget or node, then it must explicitly set `dir` on all descendant
widgets too.

Breaking any of these rules will lead to undefined behavior.  Often it will lead to widgets being in a half-way
state where, for example, the layout becomes RTL but the keyboard support is still in LTR mode.
