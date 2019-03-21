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

// when enter button clicked, geocodeAddresses
$('#geocoder-input').keypress(function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        geocodeAddress($('#geocoder-input').val());
    }
});

// when search radius changes, chang circle size and re-query
$('#radius-selected').change(function () {
    changeCircleRadius();
});

// Map
const map = new L.Map('map', {
    renderer: L.canvas(),
    center: new L.LatLng(28.3, -83.1),
    minZoom: 7,
    maxZoom: 13,
    zoom: 7,
    maxBounds: [
        [23.5, -88.5],
        [33, -79]
    ]
});

// Base map
let basemap = L.tileLayer.provider('OpenStreetMap.Mapnik');

// Add base layer to group
map.addLayer(basemap);

//Add locate control
locate.addTo(map);

// when the event button is clicked, and location found
// zoom to location and draw circle
map.on('locationfound', function (event) {
    locateZoom(event);
});


//Right-clicking the map triggers the search function
map.on({
    // what happens when right click happens
    contextmenu: function (e) {

        // remove the locate class to make it look inactive
        $('.leaflet-control-locate').removeClass("active following")

        // clear any current selections
        clearSelections();
        // disable location if it's currently active

        // draw circle where right click happened
        const z = map.getZoom();
        if (z < 10) {
            geocodePlaceMarkersOnMap(e.latlng);
        } else {
            geocodePlaceMarkersOnMap(e.latlng, z);
        }


    },
    // if the popup closes, remove the associated marker
    popupclose: function (e) {
        if (selection_marker !== undefined) {
            selection_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));
        }
    }
});