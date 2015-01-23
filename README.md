# delite [![Build Status](https://travis-ci.org/ibm-js/delite.png?branch=master)](https://travis-ci.org/ibm-js/delite)

This project provides a UI Widget framework working both on desktop and mobile platforms.

One goal of the project is to
[converge the dijit and dojox/mobile widgets](https://docs.google.com/document/d/1_kgrX25ylxuhtZCRrqAoABMaSdgxjAQgpyd0Ap4xvZU)
into a single set of components.

Another is to build on emerging web standards, in particular
[custom elements](http://www.html5rocks.com/en/tutorials/webcomponents/customelements/).

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

## Installation

_Bower_ release installation:

    $ bower install delite

_Manual_ master installation:

    $ git clone git://github.com/ibm-js/delite.git

Then install dependencies with bower (or manually from github if you prefer to):

	$ cd delite
	$ bower install

## Documentation

See the [introductory blog post](http://ibm-js.github.io/2014/07/18/delite-and-deliteful.html) to get started.

Then see the [delite website](http://ibm-js.github.io/delite/) including the
[documentation section](http://ibm-js.github.io/delite/docs/master/index.html).