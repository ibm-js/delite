define([
	"dcl/dcl",
	"./register",
	"./Widget",
	"./Container",
	"./Invalidating",
	"./BasicLayout",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"./themes/load!MultiColumns"],
	function(dcl, register, Widget, Container, Invalidating, BasicLayout, lang, dom, domGeom, domClass){
		return register("d-multi-columns", BasicLayout, {
			baseClass: "duiMultiColumns"
		})
});

