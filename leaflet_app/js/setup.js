// We'll append our markers to this global variable
const json_group = new L.FeatureGroup();
//This is our selection group
const selection_group = new L.FeatureGroup();
// This is the circle on the map that will be determine how many markers are around
let circle;
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
    $.get("./js/data/group_care.json", function (json_data) {

        _.each(json_data, function (num) {
            markerLogic(num, json_group)
        }, this);
        map.addLayer(json_group)
        //instantiate autocomplete for initial data
        setAutocomplete(json_data);

    });
}

// return activelayer
function checkActiveLayer() {
    if (_.isEmpty(selection_group._layers) === false) {
        console.log('json-group is active');

        return json_group;
    } else {
        console.log('selection-group is active');

        return selection_group;
    }
}

// clear all current selections on map
function clearSelections() {

    // make so the locate no longer appears active
    $('.leaflet-control-locate').removeClass("active following")

    if (search_marker) { // Remove marker if one is already on map

        map.removeLayer(search_marker);
    }
    if (circle) { // Remove marker if one is already on map
        map.removeLayer(circle);
    }
    if (selection_marker) { // Remove selection if one is already on map

        map.removeLayer(selection_marker);
    }
}

// run the setup to query the file 

setup();