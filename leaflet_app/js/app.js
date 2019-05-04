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

// when enter button clicked, geocodeAddresses
// $('geocoder-input').keypress(function (event) {
//     if (event.keyCode === 13) {
//         console.log('is this going to refresh')
//         event.preventDefault();
//         event.stopPropagation();
//         // executeSearchBar();
//     }
// });

$("form").submit(function (e) {
    // prevent refresh
    e.preventDefault();

    // if the search bar is not empty, execute a search
    if ($("#geocoder-input").val() !== '') {
        executeSearchBar();
        return;
    } else { // immediately call the input invalid if nothing is in the search bar
        isInvalid();
    }
});

// $('#geocoder-input').change(function (event) {
//     event.preventDefault();
//     // executeSearchBar();
//     console.log("helloooooo");

// });

// when submit button clicked, search names and addresses
$('#ESRI-Search').on('click', executeSearchBar);

// when search radius changes, chang circle size and re-query
$('#radius-selected').change(function () {

    changeCircleRadius();
});

$("#checkboxes input[type='checkbox']").change(async function (event) {
    // when any checkbox inside the div "checkboxes" changes, run this function
    await filterLocations(event);

    pointsInCircle(circle, milesToMeters($('#radius-selected').val()), activeLayer);
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
            geocodePlaceMarkersOnMap(e.latlng, activeLayer);
        } else {
            geocodePlaceMarkersOnMap(e.latlng, z, activeLayer);
        }


    },
    // if the popup closes, remove the associated marker
    popupclose: function (e) {
        if (selection_marker !== undefined) {
            selection_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));
        }
    }
});