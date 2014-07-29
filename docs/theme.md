---
layout: default
title: delite/theme!
---

# delite/theme!

Delite/theme! is a high level plugin for loading a CSS file based on the theme of the page.

The plugin is similar to the CSS loader, but will substitute {% raw %}`{{theme}}`{% endraw %} with the page's theme.
It will also load the common css file for the theme, {% raw %}`delite/themes/{{theme}}/common.css`{% endraw %},
even if no resource is provided (like in `delite/theme!`).


To load {% raw %}`delite/theme!./a/b/{{theme}}/file1.css`{% endraw %}, the requirements are that:

- there is an a/b directory relative to the current directory
- it contains subdirectories holodark, ios, and bootstrap
- each of those subdirectories contains `file1.css`
- there is a `common.css` file for each theme

The theme is detected automatically based on the platform and browser,
and the correct file is loaded as well as the global css file for the theme.

You can alternately pass an additional URL parameter string
`theme={theme widget}` to force a specific theme through the browser
URL input.

The available theme ids are:

- bootstrap
- holodark (theme introduced in Android 3.0)
- ios

The theme names are case-sensitive.

Note: As of release 0.2.0-dev, holodark and ios themes are disabled.
They can be enabled using the following configuration:

```js
require.config({
	config: {
		"delite/theme": {
			themeMap: [
				[/Holodark|Android/, "holodark"],
				[/iPhone|iPad/, "ios"],
				[/.*/, "bootstrap"]
			]
		}
	}
});
```

## Example

To load the css file {% raw %} `./a/b/{{theme}}/file1.css` you can use:

{% raw %}
```js
require(["delite/theme!./a/b/{{theme}}/file1.css"], function (){
	// Code placed here will wait for ./a/b/{{theme}}/file1.css before running.
});
```
{% endraw %}

Or as a widget dependency:

{% raw %}
```js
define(["delite/theme!./a/b/{{theme}}/file1.css"], function (){
	// My widget factory
});
```
{% endraw %}