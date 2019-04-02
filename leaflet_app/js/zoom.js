// general function that will take in lat and lon
// then will zoom to and highlight desired feature
function zoomToLocation(lat, lng, z = 12) {
    // if a marker is already present on the map, remove it
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }

    // set view to location
    map.setView(new L.LatLng(lat, lng), z);

    // Set marker location
    const marker_location = new L.LatLng(lat, lng);

    // set the selection_marker variable to our location and style
    selection_marker = L.circleMarker(marker_location, markerStyle(4, "#FF0000", "#FF0000", 1, 1));

    //allow for the user to click the point under the marker
    selection_marker.options.interactive = false;

    // add marker to the map
    map.addLayer(selection_marker);
}