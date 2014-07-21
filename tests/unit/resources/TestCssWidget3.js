define([
	"delite/css!../css/test1.css"
], function () {
	// This module also loads test1.css.
	// It's merely here to test that the CSS data doesn't get reloaded if it's already loaded.
	return null;
});