define(function(){ return '\
.d-scrollable {\
  display: block;\
  /* enable momentum: */\
  -webkit-overflow-scrolling: touch;\
  /* enable hardware acceleration: */\
  -webkit-transform: translate3d(0, 0, 0);\
}\
.d-scrollable-h-clipping {\
  overflow-x: hidden;\
}\
.d-scrollable-v-clipping {\
  overflow-y: hidden;\
}\
.d-scrollable-h {\
  overflow-x: scroll;\
}\
.d-scrollable-v {\
  overflow-y: scroll;\
}\
'; } );
