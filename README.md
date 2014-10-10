# delite [![Build Status](https://travis-ci.org/ibm-js/delite.png?branch=master)](https://travis-ci.org/ibm-js/delite)

This project provides a UI Widget framework working both on desktop and mobile platforms.

One goal of the project is to
[converge the dijit and dojox/mobile widgets](https://docs.google.com/document/d/1_kgrX25ylxuhtZCRrqAoABMaSdgxjAQgpyd0Ap4xvZU/edit#)
into a single set of components.

Another is to
[build on emerging web standards](https://docs.google.com/document/d/1kqe3Oq7W6lg-JY_iqMl5G7SxGTD0uQ6FFIoP4KPAkUw/edit#heading=h.ct7kwnepj0cc).

## Status

No official release yet.

## Migration

For developers migrating a widget from dijit, migration will require manual steps listed [here](docs/migration.md).

## Issues

Bugs and open issues are tracked in the
[github issues tracker](https://github.com/ibm-js/delite/issues).

## Licensing

This project is distributed by the Dojo Foundation and licensed under the ["New" BSD License](./LICENSE) except the 
[Bootstrap variables.less](./themes/bootstrap/variables.less) file which is distributed under 
[MIT](./themes/bootstrap/LICENSE) license.

All contributions require a [Dojo Foundation CLA](http://dojofoundation.org/about/claForm).

## Dependencies

This project requires the following other projects to run:
 * dojo
 * dcl    (git clone https://github.com/uhop/dcl.git)
 * decor
 * requirejs (git clone https://github.com/jrburke/requirejs.git)
 * dpointer
 * requirejs-domReady
 * requirejs-dplugins
 * requirejs-test
    
## Installation

_Bower_ release installation:

    $ bower install delite

_Manual_ master installation:

    $ git clone git://github.com/ibm-js/delite.git

Then install dependencies with bower (or manually from github if you prefer to):

	$ cd delite
	$ bower install

## Documentation

See the [here](http://ibm-js.github.io/delite/docs/master/index.html).