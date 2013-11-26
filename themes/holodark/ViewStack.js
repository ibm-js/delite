define(function(){ return '\
.duiViewStack {\
  box-sizing: border-box !important;\
  overflow-x: hidden !important;\
  overflow-y: hidden;\
  position: relative !important;\
}\
.duiBasicLayout > .duiViewStack {\
  display: block !important;\
}\
.duiViewStack > * {\
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
