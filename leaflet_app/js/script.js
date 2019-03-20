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

let selection_marker;

let table;

// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

function getMiles(meters) {
    return meters * 0.000621371192;
}

// This uses the ESRI geocoder
function geocodeAddress(address) {

    const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    const params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    const queryString = params + address;
    $.get(url, queryString, function (data) {
        if (data.candidates.length !== 0) {
            // if the is-invalid class is present, remove it
            if ($('#geocoder-input').hasClass('is-invalid')) {
                $('#geocoder-input').removeClass('is-invalid');
                // hide invalide address message
                $('.invalid-feedback').hide();

            }
            const coords = data.candidates[0].location;
            const location = {
                lng: coords.x,
                lat: coords.y
            };
            geocodePlaceMarkersOnMap(location);
        } else {
            // change color of text to bootstrap is-invalid class to show user that their input was invalid
            $('#geocoder-input').addClass("is-invalid");
            // add invalid address message
            $('.invalid-feedback').show();
        }

    });
}

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

// =$(json).filter(function (i,n){return n.website==='yahoo'});


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
// call initial setup function to add points to map
setup();

function clearSelections() {
    $('.leaflet-control-locate').removeClass("active following")

    // Remove marker if one is already on map
    if (search_marker) {
        map.removeLayer(search_marker);
    }
    if (circle) {
        map.removeLayer(circle);
    }
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }
}

// Base map
let basemap = L.tileLayer.provider('OpenStreetMap.Mapnik');

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

// Add base layer to group
map.addLayer(basemap);

//Add locate control
locate.addTo(map);
map.on('locationfound', function (event) {
    locateZoom(event);
});


//Right-clicking the map triggers the search function
map.on({
    // what happens when right click happens
    contextmenu: function (e) {

        // locate.stop();



        $('.leaflet-control-locate').removeClass("active following")


        // // Remove marker if one is already on map
        // if (search_marker) {
        //     map.removeLayer(search_marker);
        // }
        // if (selection_marker) {
        //     map.removeLayer(selection_marker);

        // }
        clearSelections();
        // disable location if it's currently active

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