define(function(){ return '\
.d-readonly *,\
.d-disabled *,\
.d-readonly,\
.d-disabled {\
  cursor: default;\
}\
.d-reset {\
  margin: 0;\
  border: 0;\
  padding: 0;\
  font: inherit;\
  line-height: normal;\
  color: inherit;\
}\
.d-inline {\
  display: inline-block;\
  border: 0;\
  padding: 0;\
  vertical-align: middle;\
}\
html,\
body {\
  width: 100%;\
  margin: 0;\
  padding: 0;\
}\
body {\
  overflow-x: hidden;\
  -webkit-text-size-adjust: none;\
  font-family: Helvetica;\
  font-size: 17px;\
  color: #ffffff;\
  background-color: #000000;\
}\
'; } );
