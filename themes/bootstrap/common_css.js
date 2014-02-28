define(function(){ return '\
.d-reset {\
  margin: 0;\
  border: 0;\
  padding: 0;\
  font: inherit;\
  line-height: normal;\
  color: inherit;\
}\
.dj_a11y .d-reset {\
  -moz-appearance: none;\
}\
.d-inline {\
  display: inline-block;\
  border: 0;\
  padding: 0;\
  vertical-align: middle;\
}\
table.d-inline {\
  display: inline-table;\
  box-sizing: content-box;\
  -moz-box-sizing: content-box;\
}\
.d-hidden {\
  display: none !important;\
}\
.d-visible {\
  display: block !important;\
  position: relative;\
}\
.d-offscreen {\
  position: absolute !important;\
  left: -10000px !important;\
  top: -10000px !important;\
}\
.d-background-iframe {\
  position: absolute;\
  left: 0;\
  top: 0;\
  width: 100%;\
  height: 100%;\
  z-index: -1;\
  border: 0;\
  padding: 0;\
  margin: 0;\
}\
.d-container {\
  overflow: hidden;\
}\
.dj_a11y .d-icon,\
.dj_a11y div.d-arrow-button-inner,\
.dj_a11y span.d-arrow-button-inner,\
.dj_a11y img.d-arrow-button-inner {\
  display: none;\
}\
.dj_a11y .d-a11y-side-arrow {\
  display: inline !important;\
  cursor: pointer;\
}\
.d-layout-container {\
  position: relative;\
  display: block;\
  overflow: hidden;\
}\
.d-align-top,\
.d-align-bottom,\
.d-align-left,\
.d-align-right {\
  position: absolute;\
  overflow: hidden;\
}\
body .d-align-client {\
  position: absolute;\
}\
.d-noicon {\
  display: none;\
}\
.d-readonly *,\
.d-disabled *,\
.d-readonly,\
.d-disabled {\
  cursor: default;\
}\
.dj_gecko .d-arrow-button-inner INPUT,\
.dj_gecko INPUT.d-arrow-button-inner {\
  -moz-user-focus: ignore;\
}\
.d-popup {\
  position: absolute;\
  background-color: transparent;\
  margin: 0;\
  border: 0;\
  padding: 0;\
  -webkit-overflow-scrolling: touch;\
  -webkit-box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);\
  -moz-box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);\
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);\
}\
.d-tooltip-dialog-popup {\
  -webkit-box-shadow: none;\
  -moz-box-shadow: none;\
  box-shadow: none;\
}\
.d-combobox-highlight-match {\
  background-color: #abd6ff;\
}\
.d-focused-label {\
  outline: 1px dotted #494949;\
}\
html.mobile,\
.mobile body {\
  width: 100%;\
  margin: 0;\
  padding: 0;\
}\
.mobile body {\
  overflow-x: hidden;\
  -webkit-text-size-adjust: none;\
  font-family: Helvetica;\
  font-size: 17px;\
  color: #000000;\
}\
.d-background {\
  background-color: #c0c0c0;\
}\
.d-color-blue {\
  color: #ffffff;\
  background-color: #048bf4;\
  background-image: -webkit-gradient(linear, left top, left bottom, from(#48adfc), to(#048bf4));\
  background-image: linear-gradient(to bottom, #48adfc 0%, #048bf4 100%);\
}\
.d-color-blue-45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#048bf4), to(#48adfc));\
  background-image: linear-gradient(to right bottom, #048bf4 0%, #48adfc 100%);\
}\
.d-default-color {\
  color: #000000;\
  background-color: #a4a4a4;\
  background-image: -webkit-gradient(linear, left top, left bottom, from(#e2e2e2), to(#a4a4a4));\
  background-image: linear-gradient(to bottom, #e2e2e2 0%, #a4a4a4 100%);\
}\
.d-default-color-45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#e2e2e2), to(#a4a4a4));\
  background-image: linear-gradient(to right bottom, #e2e2e2 0%, #a4a4a4 100%);\
}\
.d-default-color-sel {\
  color: #ffffff;\
  background-color: #999999;\
  background-image: -webkit-gradient(linear, left top, left bottom, from(#bbbbbb), to(#999999));\
  background-image: linear-gradient(to bottom, #bbbbbb 0%, #999999 100%);\
}\
.d-default-color-sel-45 {\
  background-image: -webkit-gradient(linear, left top, right bottom, from(#bbbbbb), to(#999999));\
  background-image: linear-gradient(to right bottom, #bbbbbb 0%, #999999 100%);\
}\
.d-sprite-icon {\
  position: absolute;\
}\
.d-sprite-icon-parent {\
  position: relative;\
  font-size: 1px;\
}\
.d-image-icon {\
  vertical-align: top;\
}\
'; } );
