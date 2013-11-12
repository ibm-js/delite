define(function(){ return '\
.duiToolBarButtonHasArrow-styles {\
  width: 27px;\
  height: 27px;\
  border-radius: 20px;\
  border: 2px solid #ffffff;\
  padding: 0px;\
  margin: 0px;\
  margin-top: 8px;\
  margin-bottom: 8px;\
  background-image: url("images/dark/back.png");\
  background-position: 50% 50%;\
  background-size: 27px 27px;\
  background-repeat: no-repeat;\
}\
.duiViewStack {\
  box-sizing: border-box !important;\
  overflow-x: hidden !important;\
  position: relative !important;\
}\
.duiViewStack div {\
  position: absolute !important;\
  box-sizing: border-box !important;\
  width: 100% !important;\
  height: 100% !important;\
}\
.duiViewStackSlideAnim {\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.duiViewStackLeftTranslated {\
  -webkit-transform: translate3d(-100%, 0px, 0px);\
  transform: translate3d(-100%, 0px, 0px);\
}\
.duiViewStackRightTranslated {\
  -webkit-transform: translate3d(100%, 0px, 0px);\
  transform: translate3d(100%, 0px, 0px);\
}\
.duiViewStackNotTranslated {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
'; } );
