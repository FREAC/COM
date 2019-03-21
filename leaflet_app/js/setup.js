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

// initial setup function to loop through json that
// assigns marker and add to map
async function setup() {
    selection_group.clearLayers();
    $.get("./js/data/group_care.json", function (json_data) {

        _.each(json_data, function (num) {
            markerLogic(num, json_group)
        }, this);
        map.addLayer(json_group)

    });
}

// run the setup to query the file 

setup();