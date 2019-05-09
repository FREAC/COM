'use strict';
// Colors
const default_fill_color = "#ED9118";
const default_outline_color = "#FFFFFF";
const selected_color = "#2BBED8";
const selected_fill_opacity = 1;

// This sets the marker styles for any of the circleMarker symbols
function markerStyle(fillColor, strokeColor, fillOpacity=0.75) {
    return {
        fillColor: fillColor,
        color: strokeColor,
        fillOpacity: fillOpacity,
        radius: 4,
        weight: 0.8
    };
}

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
        // set json_group as active layer
        activeLayer = json_group;
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


///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////




// Map
const map = new L.Map('map', {
    renderer: L.canvas(),
    center: new L.LatLng(28.3, -83.1),
    minZoom: 7,
    maxZoom: 19,
    zoom: 7,
    maxBounds: [
        [23.5, -88.5],
        [33, -79]
    ]
});

map.on({
    contextmenu: function (event) {
        clearSelection();
        const zoom = map.getZoom();
        if (zoom < 10) {
            geocodePlaceMarkersOnMap(event.latlng, activeLayer);
        } else {
            geocodePlaceMarkersOnMap(event.latlng, activeLayer, zoom);
        }
    }
});

// Base map
L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// Locate Button
const locate = L.control.locate({
    flyTo: true,
    clickBehavior: {inViewNotFollowing: 'setView'},
    strings: {title: "Find my location"},
    drawCircle: false,
    showPopup: false
}).addTo(map);

// ESRI Geocoder
const searchControl = L.esri.Geocoding.geosearch().addTo(map);

// This should clear the table as well
function clearSelection() {
    if (search_marker) {
        map.removeLayer(search_marker);
    }
    if (searchArea) {
        map.removeLayer(searchArea);
    }
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }
}

// Clear button functionality
$('#clear-search').click(function () {
    clearSelection();
});

const radius = $('#radius');
radius.change(function () {
    if (searchArea) {
        const size = milesToMeters(radius.val());
        searchArea.setRadius(size);
        pointsInCircle(searchArea, size, activeLayer)
    }
});

// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

// JQuery Easy Autocomplete: http://easyautocomplete.com
const options = {
    url: "data/COM.json",
    getValue: "Agency",
    list: {
        maxNumberOfElements: 3,
        match: {enabled: true},
        onClickEvent: function() {
            const data = $("#easy-auto").getSelectedItemData();
            zoomToLocation(data.Latitude, data.Longitude);
        }
    },    
    requestDelay: 250,
    placeholder: "Search Providers"
};

$("#easy-auto").easyAutocomplete(options);

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////


// let objects = [];
// $.get("./data/COM.json", function(data) {
//     $.each(data, function (object) {
//         objects.push(data[object]);
//     })
// });


$('#SearchButton').on('click', executeSearchBar);




// // when the event button is clicked, and location found
// // zoom to location and draw circle
// map.on('locationfound', function (event) {
//     locateZoom(event);
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


// $("#checkboxes input[type='checkbox']").change(async function (event) {
//     // when any checkbox inside the div "checkboxes" changes, run this function
//     await filterLocations(event);

//     pointsInCircle(searchArea, milesToMeters($('#radius-selected').val()), activeLayer);
// });



// general function that will take in lat and lon
// then will zoom to and highlight desired feature
function zoomToLocation(lat, lng, z = 12) {
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
}

// This file will house all of the map logic for screen size changes
let infoButton;
// append search bar to the top of the map when on small screen
if (screen.availWidth < 813) {
    document.getElementById('full-page').appendChild(
        document.getElementById('geocoder_box')
    );
    if (infoButton) {
    } else {
        infoButton = L.control.infoButton({
            position: 'topleft',
            html: "<div style='text-align:center;'><p></p><img src='images/fsulogo.png' alt='FSU Logo' width='75' height='75'=><br><br><h4>Florida State University College of Medicine</h4><br><h5>Group Care Search Demo</h5><br><p>This demo counts the number of group care facilities within a radius of a given point and displays them on a map using Leaflet.</p><br><p>To use, enter an address and then enter a radius. Under results will be the number of markers within the given radius. You can also drag the marker on the map; the number will update automatically.</p><br><p>More information regarding the original code is available here. Code was originally used here.</p><br><p>This project is sponsored by:</p><a href='https://www.sagerx.com/' target='_blank'><img alt='Sage Therapeutics' src='images/logo-sagerx.svg'><br><br></div>"
        });

        infoButton.addTo(map);
    }
}

// create a reusable Tabulator object
function insertTabulator(data) {
    table = new Tabulator("#results-table", {
        height: 200,
        data: data,
        layout: "fitColumns",
        selectable: 1,
        columns: [
            {
                title: "Provider",
                field: "agency"
            }
        ],
        rowClick: function (event, row) {
            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const zoom = map.getZoom();
            if (zoom < 12) {
                zoomToLocation(lat, lng);
            } else {
                zoomToLocation(lat, lng, zoom);
            }
        },
    });
}

// search a JSON object for value
function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].Agency === nameKey) {
            return myArray[i];
        }
    }
}

async function executeSearchBar() {
    const val = document.getElementById("geocoder-input").value;
    let results;

    // Remove marker if one is already on map
    if (search_marker) {
        map.removeLayer(search_marker);
    }

    // Get json data and search it
    const json_data = await $.get("./data/COM.json", function (json_data) {
        results = search(val, json_data);
    });

    // If there are any results returned from the search,
    // Add it to the tableResults object array
    if (results !== undefined) {
        // the results are not invalid!
        isNotInvalid();

        const tableResults = [{
            id: 1,
            name: results['Agency'],
            distance: 0,
            lat: results['Latitude'],
            lng: results['Longitude'],
            link: results['Agency'],
        }]

        // Insert tabulator object 
        insertTabulator(tableResults);
        // Zoom to location of company
        const z = map.getZoom();
        if (z < 12) {
            zoomToLocation(results['Latitude'], results['Longitude']);
        } else {
            zoomToLocation(results['Latitude'], results['Longitude'], z);
        }
    } else {
        geocodeAddress($('#geocoder-input').val());
    }
}



// when location is found, zoom to the location
function locateZoom(event) {
    // start the locate control
    locate.start();

    // set location of the locate function
    const location = {
        lng: event.longitude,
        lat: event.latitude
    };

    // get current zoom level
    const z = map.getZoom();
    if (z < 10) {
        // geocode, draw circle, and find points within circle at default zoom
        geocodePlaceMarkersOnMap(location);
    } else {
        // geocode, draw circle, and find points within circle at current zoom
        geocodePlaceMarkersOnMap(location, z);
    }

    locate.stop();
    $('.leaflet-control-locate').addClass("active following")

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

            // Lat, long of current point
            const layer_lat_long = layer.getLatLng();

            // Distance from our circle marker
            // To current point in meters
            const distance_from_layer_circle = layer_lat_long.distanceTo(circle_lat_long);

            // See if meters is within raduis
            // The user has selected
            if (distance_from_layer_circle <= meters_user_set) {
                counter_points_in_circle += 1;
                results.push({
                    agency: layer.data.Agency,
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
        for (let i = 0; i < counter_points_in_circle; i++) {
            tableResults.push({
                id: i,
                agency: results[i]['agency'],
                lat: results[i]['latitude'],
                lng: results[i]['longitude']
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
};

// This places marker, circle on map
function geocodePlaceMarkersOnMap(location, activeLayer = json_group, z = 10) {
    // Clear any current selections that are on the map
    clearSelection();

    // Center the map on the result
    map.setView(new L.LatLng(location.lat, location.lng), z);

    // Create circle around marker with our selected radius
    searchArea = L.circle([location.lat, location.lng], milesToMeters(radius.val()), {
        color: selected_color,
        fillColor: selected_color,
        fillOpacity: 0.1,
        clickable: false,
        interactive: false
    }).addTo(map);

    //custom icon to go inside the circle
    circleIcon = L.icon({
        iconUrl: './css/lib/images/circleIcon.png',
        iconSize: [8, 8],
    });

    // Create marker
    search_marker = L.marker([location.lat, location.lng], {
        // Allow user to drag marker
        draggable: true,
        icon: circleIcon
    });

    // Reset map view on marker drag
    search_marker.on('dragend', function (event) {
        map.setView(event.target.getLatLng());
        searchArea.setLatLng(event.target.getLatLng());

        // This will determine how many markers are within the circle
        pointsInCircle(searchArea, milesToMeters(radius.val()), activeLayer);

        // Redraw: Leaflet function
        searchArea.redraw();

        // Clear out address in geocoder
        $('#geocoder-input').val('');
    });

    // Add marker to the map
    search_marker.addTo(map);

    // This will determine how many markers are within the circle
    // Called when points are initially loaded
    pointsInCircle(searchArea, milesToMeters(radius.val()), activeLayer);
}







// Assign these properties to each marker in the data
function markerLogic(num, targetLayer) {
    // Popup template
    const html = `<b>${num['Agency']}</b><br>
                    ${num['HouseNumber']} ${num['Street']} ${num['Unit']}<br>
                    ${num['City']}, ${num['State']} ${num['PostalCode']}`;
    const popup = L.popup({closeButton: false}).setContent(html);
    // Create marker for point
    const marker_location = new L.LatLng(num['Latitude'], num['Longitude']);
    const circle_marker = L.circleMarker(marker_location, markerStyle(default_fill_color, default_outline_color))
        .bindPopup(popup);
    // Add data object
    circle_marker.data = {
        'Agency': num['Agency']
    };
    // Add events
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
            // }
            // if a tabulator table is already active
            // if ($('#results-table').hasClass('tabulator')) {
            //     // get the data that is inside of it
            //     const data = table.getData();
            //     // loop through data to see if clicked feature matches
            //     for (let i in data) {
            //         // if we find a layer match, select it
            //         if (event.target.data.Agency === data[i].agency) {
            //             // deselect previous row selection
            //             table.deselectRow();
            //             // select new row selection
            //             table.selectRow(i);
            //         }
            //     }
            // }
        popupclose: function (event) {
            selection_marker = undefined;
            event.target.setStyle(markerStyle(default_fill_color, default_outline_color));
        }
    });
    targetLayer.addLayer(circle_marker);
}