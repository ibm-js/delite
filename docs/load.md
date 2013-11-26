# dui/themes/load!

Dui/themes/load! is a high level plugin for loading all the CSS files necessary for a given widget,
based on the theme and direction of a page.

The plugin takes a list of "simplified paths", for example:

	themes/load!./a/b/c/file1.css,./a/b/c/file2.css

The requirement is that:

- there is an a/b/c directory relative to the current directory
- it contains subdirectories holodark, ios, blackberry, and bootstrap
- each of those subdirectories contains not only file1.css and file2.css files,
  but also file1_rtl.css and file2_rtl.css files.


The theme is detected automatically based on the platform and browser, and the correct files are loaded.

You can alternately pass an additional URL parameter string
theme={theme widget} to force a specific theme through the browser
URL input.

The available theme ids are bootstrap, holodark (theme introduced in Android 3.0),
blackberry, and bootstrap. The theme names are case-sensitive.
