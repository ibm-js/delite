define(function () {
	/* jshint multistr: true */
	/* jshint -W015 */
	/* jshint -W033 */
	return "\
.d-dnd-item {\
  padding: 2px;\
  -webkit-touch-callout: none;\
  -webkit-user-select: none;\
  border-color: rgba(0, 0, 0, 0);\
  -webkit-transition-duration: 0.25s;\
  -moz-transition-duration: 0.25s;\
  transition-duration: 0.25s;\
  -webkit-transition-property: background-color, border-color;\
  -moz-transition-property: background-color, border-color;\
  transition-property: background-color, border-color;\
}\
.d-dnd-horizontal .d-dnd-item {\
  display: inline-block;\
}\
.d-dnd-item-before,\
.d-dnd-item-after {\
  border: 0px solid #369;\
  border-color: #759dc0;\
}\
.d-dnd-item-before {\
  border-width: 2px 0 0 0;\
  padding: 0 2px 2px 2px;\
}\
.d-dnd-item-after {\
  border-width: 0 0 2px 0;\
  padding: 2px 2px 0 2px;\
}\
.d-dnd-horizontal .d-dnd-item-before {\
  border-width: 0 0 0 2px;\
  padding: 2px 2px 2px 0;\
}\
.d-dnd-horizontal .d-dnd-item-after {\
  border-width: 0 2px 0 0;\
  padding: 2px 0 2px 2px;\
}\
.d-dnd-item-over {\
  cursor: pointer;\
  background-color: #abd6ff;\
  background-image: -webkit-linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%);\
  background-image: linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%);\
  padding: 1px;\
  border: solid 1px #759dc0;\
  color: #000000;\
}\
.d-dnd-item-anchor,\
.d-dnd-item-selected {\
  background-color: #cfe5fa;\
  background-image: -webkit-linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%);\
  background-image: linear-gradient(rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%);\
  padding: 1px;\
  border: solid 1px #759dc0;\
  color: #000000;\
}\
table.d-dnd-avatar {\
  border: 1px solid #b5bcc7;\
  border-collapse: collapse;\
  background-color: #ffffff;\
  -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);\
  -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);\
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);\
}\
.d-dnd-avatar-header td {\
  height: 20px;\
  padding-left: 21px;\
}\
.d-dnd-move .d-dnd-avatar-header,\
.d-dnd-copy .d-dnd-avatar-header {\
  background-image: url(\"images/dnd.png\");\
  background-repeat: no-repeat;\
  background-position: 2px -122px;\
}\
.d-dnd-avatarItem td {\
  padding: 5px;\
}\
.d-dnd-move .d-dnd-avatar-header {\
  background-color: #f58383;\
  background-position: 2px -103px;\
}\
.d-dnd-copy .d-dnd-avatar-header {\
  background-color: #f58383;\
  background-position: 2px -68px;\
}\
.d-dnd-move .d-dnd-avatar-candrop .d-dnd-avatar-header {\
  background-color: #97e68d;\
  background-position: 2px -33px;\
}\
.d-dnd-copy .d-dnd-avatar-candrop .d-dnd-avatar-header {\
  background-color: #97e68d;\
  background-position: 2px 2px;\
}\
[dir=rtl] .d-dnd-horizontal .d-dnd-item-before {\
  border-width: 0 2px 0 0;\
  padding: 2px 0 2px 2px;\
}\
[dir=rtl] .d-dnd-horizontal .d-dnd-item-after {\
  border-width: 0 0 0 2px;\
  padding: 2px 2px 2px 0;\
}";
});
