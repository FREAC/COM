// We'll append our markers to this global variable
const json_group = new L.FeatureGroup();
//This is our selection group
const selection_group = new L.FeatureGroup();
// This is the circle on the map that will be determine how many markers are around
let searchArea;
// this is the icon in the middle of the circle
let circleIcon;
// Marker in the middle of the circle
let search_marker;
// current selection (red dot)
let selection_marker;
// array to store table in
let table;
let activeLayer;

// initial setup function to loop through json that
// assigns marker and add to map
async function setup() {
    selection_group.clearLayers();
    $.get("./data/COM.json", function (json_data) {
        _.each(json_data, function (num) {
            markerLogic(num, json_group)
        }, this);
        map.addLayer(json_group)
        activeLayer = json_group;
        //instantiate autocomplete for initial data
        setAutocomplete(json_data);
    });
}

// return activelayer
function checkActiveLayer() {
    if (_.isEmpty(selection_group._layers) === false) {
        return json_group;
    } else {
        return selection_group;
    }
}



// functions to handle the styling of invalid or valid inputs to the search bar
function isInvalid() {
    if (!$('#geocoder-input').hasClass("is-invalid")) {
        // change color of text to bootstrap is-invalid class to show user that their input was invalid
        $('#geocoder-input').addClass("is-invalid");
        // add invalid address message
        $('.invalid-feedback').show();
    }
}

function isNotInvalid() {
    // if the is-invalid class is present, remove it
    if ($('#geocoder-input').hasClass('is-invalid')) {
        $('#geocoder-input').removeClass('is-invalid');
        // hide invalide address message
        $('.invalid-feedback').hide();
    }
}

// run the setup to query the file 
setup();