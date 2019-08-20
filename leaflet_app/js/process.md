### remaining tasks

VERY PRIORITY LOW
Going to need some new functionality
if the web address has ?idnum=17 (OR if its turns out to be easier ?aname=agency name) tagged to it, the program (EG: http://127.0.0.1:5500/leaflet_app/?idnum=17) will need to find the record where mhnum = 17 and zoom to it.  Here are two functions used to pull the argument from the address line:
//Function to grab any command line arguments.
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}
THIS IS HOW YOU GRAB THE IDNUM
const arg_idnum = getUrlParam("idnum","undefined");
