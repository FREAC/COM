'use strict';

// Colors
const default_fill_color = "#ED9118";
const default_outline_color = "#FFFFFF";
const selected_color = "#2BBED8";
const selected_fill_opacity = 1;

// TODO: Can this be dealt with using Bootstrap components?
$(document).ready(function () {
    $('.geocoder-control').click(function () {
        $("#map").css("width", "100%");
    });
    $('.sidebar').focusin(function () {
        $('#legend').addClass('col-sm-12');
    })
});

// This sets the marker styles for any of the circleMarker symbols
function markerStyle(fillColor, strokeColor, fillOpacity = 0.75) {
    return {
        fillColor: fillColor,
        color: strokeColor,
        fillOpacity: fillOpacity,
        radius: 4,
        weight: 0.8
    };
}

// current selection
let selection_marker;
// We'll append our markers to this global variable
const json_group = new L.FeatureGroup();
//This is our selection group
const selection_group = new L.FeatureGroup();
// This is the circle on the map that will be determine how many markers are around
let searchArea;
// this is the icon in the middle of the circle
// let circleIcon;
// Marker in the middle of the circle
let search_marker;
// array to store table in
let table;
let activeLayer;


// initial setup function to loop through json that
// assigns marker and add to map
async function setup() {
    selection_group.clearLayers();
    $.get("./data/COM.json", function (json_data) {
        $.each(json_data, function (object) {
            const provider = json_data[object];
            const marker = markerLogic(provider);
            marker.addTo(json_group);
            json_group.addLayer(marker);
        });
        map.addLayer(json_group);
        activeLayer = json_group;
    });
}

///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////

const bottomLeft = [24, -88];
const topRight = [32, -79];

// Map
const map = new L.Map('map', {
    renderer: L.canvas(),
    center: new L.LatLng(28.3, -83.1),
    minZoom: 7,
    maxZoom: 19,
    zoom: 7,
    maxBounds: [bottomLeft, topRight]
});

map.on({
    contextmenu: function (e) {
        querySearchArea(e);
    },
    // Turn off mobile locate control after zoom
    locationfound: function() {
        map.on('moveend', function() {
            locate.stop();
        });
    }
});

// Load the data
setup();

// Base map
L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// Locate Button
const locate = L.control.locate({
    flyTo: true,
    clickBehavior: {
        inView: 'stop',
        outOfView: 'stop',
        inViewNotFollowing: 'stop'
    },
    strings: {
        title: "Find my location"
    },
    drawCircle: false,
    showPopup: false
}).addTo(map);

// ESRI Geocoder 
var geocoder = L.esri.Geocoding.geosearch({
    zoomToResult: false,
    useMapBounds: false,
    placeholder: 'Search for an address',
    searchBounds: [bottomLeft, topRight]
}).addTo(map);

geocoder.on('results', function (result) {
    clearSelection();
    querySearchArea(result);
});

function clearSelection({provider=true, radius=false}={}) {
    $('#map').css('z-index', '22')
    if (search_marker) {
        map.removeLayer(search_marker);
    }
    if (searchArea) {
        map.removeLayer(searchArea);
    }
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }
    $('#json_one_results').html('0');
    insertTabulator([]);
    if (provider) {
        $easyAuto.val("");
    }
    if (radius) {
        $radius.val('default');
    }
    searchArea = undefined;
    map.closePopup();
}

// Clear button functionality
$('#clear-search').click(function () {
    clearSelection({radius: true});
});

// Radius dropdown functionality
const $radius = $('#radius');
$radius.change(function () {
    if (searchArea) {
        const r_size = parseInt($radius.val());
        searchArea.setRadius(r_size);
        map.flyToBounds(searchArea.getBounds());
        pointsInCircle(searchArea, r_size, activeLayer);
        $('#map').css('z-index', '2')
    }
});

function createPopup(data) {
    const content = `<b>${data['Agency']}</b><br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
    return L.popup({
        closeButton: false
    }).setContent(content);
}

// JQuery Easy Autocomplete: http://easyautocomplete.com
const $easyAuto = $('#easy-auto');
$easyAuto.easyAutocomplete({
    url: "data/COM.json",
    getValue: "Agency",
    list: {
        maxNumberOfElements: 3,
        match: {
            enabled: true
        },
        onChooseEvent: function () {
            clearSelection({provider: false, radius: true});
            const data = $easyAuto.getSelectedItemData();
            var zzoom = undefined;
            // $('#map').css('z-index', '11');

            zoomToLocation(data.Latitude, data.Longitude, zzoom, data);
        }
    },
    requestDelay: 250,
    placeholder: "Search for a provider"
});

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////


/// Alert for checkbox change

$("input[type='checkbox']").change(async function (event) {

    // perform a filter based on which checkboxes are checked
    filterLocations(event);
});

// function that will configure a popup for housing info
function configurePopup(data) {

    try {
        
        if (data['Unit'] === undefined || data['Unit'] === null) {
            data['Unit'] = ''
        }
        
        var pop_text = `<b>${data['Agency']}</b><br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch {}

}


// general function that will take in lat and lon
// then will zoom to and highlight desired feature
function zoomToLocation(lat, lng, z = 11, data) {
    // if a marker is already present on the map, remove it
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }

    // set view to location
    map.flyTo(new L.LatLng(lat, lng), z);

    // Set marker location
    const marker_location = new L.LatLng(lat, lng);

    // set the selection_marker variable to our location and style
    selection_marker = L.circleMarker(marker_location, markerStyle(selected_color, selected_color, selected_fill_opacity));

    //allow for the user to click the point under the marker
    selection_marker.options.interactive = false;
    // add marker to the map
    map.addLayer(selection_marker);

    try {
        
        if (data['Unit'] === undefined || data['Unit'] === null) {
            data['Unit'] = ''
        }
        
        var pop_text = `<b>${data['Agency']}</b><br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch {}
    //make sure the map is the top most div
    $('#map').css('z-index', '11');
}

// create a reusable Tabulator object
function insertTabulator(data) {
    table = new Tabulator("#results-table", {
        height: 200,
        data: data,
        layout: "fitColumns",
        selectable: 1,
        columns: [{
            title: "Provider",
            field: "agency"
        }, {
            title: "Zip code",
            field: "PostalCode"
        }],
        rowClick: function (event, row) {
            // NOTE: New function parameter to pass all of the row information to the zoomtolocation
            //       function so it can handle the popup

            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const zoom = map.getZoom();
            if (zoom < 12) {
                zzoom = undefined
                zoomToLocation(lat, lng, zoom, row._row.data);
            } else {
                zoomToLocation(lat, lng, zoom, row._row.data);
            }
        },
    });
}


// This figures out how many points are within our circle
function pointsInCircle(circle, meters_user_set, groupLayer) {

    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        const circle_lat_long = circle.getLatLng();

        // Singular, plural information about our JSON file
        // Which is getting put on the map
        const title_singular = 'provider';
        const title_plural = 'providers';

        // counter for number of points in circle
        let counter_points_in_circle = 0;

        // hold the initial results for points inside circle radius
        const results = [];

        // Loop through each point in JSON file
        groupLayer.eachLayer(function (layer) {
            //console.log('I think this is a provider ', layer)
            // Lat, long of current point
            const layer_lat_long = layer.getLatLng();

            // Distance from our circle marker
            // To current point in meters
            const distance_from_layer_circle = layer_lat_long.distanceTo(circle_lat_long);

            // See if meters is within raduis
            // The user has selected
            if (distance_from_layer_circle <= meters_user_set) {
                counter_points_in_circle += 1;
                //console.log('layer data looks like this? ', layer.data)
                // We need all of the fields below for the popup from the Results table to work with all 
                // the fields
                results.push({
                    agency: layer.data.Agency,
                    housenumber: layer.data.HouseNumber,
                    street: layer.data.Street,
                    city: layer.data.City,
                    state: layer.data.State,
                    postalcode: layer.data.PostalCode,
                    dist: distance_from_layer_circle,
                    latitude: layer_lat_long.lat,
                    longitude: layer_lat_long.lng
                });
            }
        });

        //Sort the list by increasing distance from point
        results.sort(function (a, b) {
            return a.dist - b.dist;
        });

        // A container to hold the query results
        const tableResults = [];

        // for every point in circle, add a tableResults object
        // the table needs lower case fields (currently we only show agency but may want to
        // show others in the future so I put them all in) but the popup relies on capitalized fields
        // TODO - fix this so we only have one case

        for (let i = 0; i < counter_points_in_circle; i++) {
            //console.log('what does a typical result look like, ', results[i])
            tableResults.push({
                id: i,
                Agency: results[i]['agency'],
                HouseNumber: results[i]['housenumber'],
                Street: results[i]['street'],
                City: results[i]['city'],
                State: results[i]['state'],
                PostalCode: results[i]['postalcode'],
                lat: results[i]['latitude'],
                lng: results[i]['longitude'],

                agency: results[i]['agency'],
                housenumber: results[i]['housenumber'],
                street: results[i]['street'],
                city: results[i]['city'],
                state: results[i]['state'],
                postalcode: results[i]['postalcode']
            });
        }
        // add tabulator object to screen
        insertTabulator(tableResults);

        // If we have just one result, we'll change the wording
        // So it reflects the category's singular form
        // I.E. facility not facilities
        if (counter_points_in_circle === 1) {
            $('#json_one_title').html(title_singular);
        } else {
            $('#json_one_title').html(title_plural);
        }

        // Set number of results on main page
        $('#json_one_results').html(counter_points_in_circle);
    }
}

// This both places a circle on the map AND counts the # of points in that circle
function querySearchArea(location) {

    clearSelection();
    let r_size;
    if ($radius.val()) {
        r_size = parseInt($radius.val());
    } else {
        r_size = 5347;
        $radius.val(5347);
    }
    searchArea = L.circle(location.latlng, r_size, {
        color: selected_color,
        fillColor: selected_color,
        fillOpacity: 0.1,
        clickable: false,
        interactive: false
    }).addTo(map);

    map.flyToBounds(searchArea.getBounds());
    pointsInCircle(searchArea, r_size, activeLayer);
}


// Assign these properties to each marker in the data
function markerLogic(data, selection_marker) {

    // Create marker for data
    const popup = createPopup(data);
    const marker_location = new L.LatLng(data['Latitude'], data['Longitude']);
    const circle_marker = L.circleMarker(marker_location, markerStyle(default_fill_color, default_outline_color))
        .bindPopup(popup);

    circle_marker.on({
        mouseover: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            }
        },
        mouseout: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(default_fill_color, default_outline_color));
            }
        },
        click: function (event) {
            if (selection_marker === undefined) {
                selection_marker = event.target;
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            } else {
                selection_marker.setStyle(markerStyle(default_fill_color, default_outline_color));
                selection_marker = event.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            }
        },
        popupclose: function (event) {
            selection_marker = undefined;
            event.target.setStyle(markerStyle(default_fill_color, default_outline_color));
        },
        contextmenu: function() {}
    });

    // Add a data object for use in the table
    // TODO -- SWH - not sure we need all of these fields - maybe just Agency (5/17/19)
    circle_marker.data = {
        'Agency': data['Agency'],
        'HouseNumber': data['HouseNumber'],
        'Street': data['Street'],
        'Unit': data['Unit'],
        'City': data['City'],
        'State': data['State'],
        'PostalCode': data['PostalCode']
    };

    return circle_marker;
}