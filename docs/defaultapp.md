---
layout: doc
title: defaultapp.css
---

# The defaultapp.css

The `themes/defaultapp.css` file contains some global CSS rules and classes commonly used in web applications.

## Box sizing set to `border-box`

The following rule is applied to facilitate CSS layout.

```
* {
	box-sizing: border-box;
}
```

## Margin, padding and height of \<html> and \<body> tags
Margin and padding are set to 0 to avoid user-agent styling. For example, most of browsers set margins on \<body>.
To facilitate layout of pages that fill the whole available height, `height: 100%` is set on \<html> and \<body> tags.

```
html, body {
	height: 100%;
	margin: 0;
	padding: 0;
}
```

## The `width100` and `height100` utility classes

These classes are just shortcuts for setting width/height to 100%.

```
class="width100 height100" 
```

is equivalent to 

```
style="width: 100%; height: 100%"
```
