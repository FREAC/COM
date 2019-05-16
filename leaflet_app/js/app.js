'use strict';

// Colors
const default_fill_color = "#ED9118";
const default_outline_color = "#FFFFFF";
const selected_color = "#2BBED8";
const selected_fill_opacity = 1;

$(document).ready(function () {
    $('.geocoder-control').click(function () {
        $("#map").css("width", "100%");
    });
    $('.sidebar').focusin(function () {
        $('#legend').addClass('col-sm-12');
        $("#map").css("z-index", "-1");
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

// current selection (red dot)
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
        map.addLayer(json_group)
        activeLayer = json_group;
    });
}

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
    zoom: 1,
    maxBounds: [
        [24.5, -87.75],
        [31.1, -80]
    ]
});

// comment out the following block of code to NOT allow right clicks on the map to draw the search radius

map.on({
    contextmenu: function (event) {
        querySearchArea(event.latlng, activeLayer,map.getZoom());
    }
});

// End of right click zoom

// Load the data
setup();

// Base map
L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// Locate Button
const locate = L.control.locate({
    flyTo: true,
    clickBehavior: {
        inViewNotFollowing: 'setView'
    },
    strings: {
        title: "Find my location"
    },
    drawCircle: false,
    showPopup: false
}).addTo(map);
// Florida Lat Long boundaries
var lowerLeft  = L.latLng(24.5, -87.75);
var upperRight = L.latLng(31.1, -80);
var FLbounds   = L.latLngBounds(lowerLeft, upperRight);
// ESRI Geocoder
const options2 = {
    zoomToResult: true,
    useMapBounds: false,
    searchBounds: FLbounds 
};    
var searchControl = L.esri.Geocoding.geosearch(options2).addTo(map);
// create an empty layer group to store the results and add it to the map
var results = L.layerGroup().addTo(map);
searchControl.on('results', function(data){
   results.clearLayers();
   for (var i = data.results.length - 1; i >= 0; i--) {
      results.addLayer(L.marker(data.results[i].latlng));
    }
    querySearchArea(data.results[0].latlng, activeLayer);
 });

searchControl.on("results", function (data) {
    console.log(data);
    clearSelection();
    // create marker in place
    const location = {
        lat: data.latlng.lat,
        lng: data.latlng.lng
    };
    let selectedAddress = L.circleMarker([data.latlng.lat, data.latlng.lng]);
    selectedAddress.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity)).addTo(map);
    querySearchArea(location, activeLayer, 13);
});

// TODO This should clear the table as well
function clearSelection() {
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
}

// Clear button functionality
$('#clear-search').click(function () {
    var tableResults = []
    insertTabulator(tableResults);
    $('#json_one_results').html('0');
    clearSelection();
});

const radius = $('#radius');
radius.change(function () {
    if (searchArea) {
        const size = milesToMeters(radius.val());
        searchArea.setRadius(size);
        pointsInCircle(searchArea, size, activeLayer);
        $('#map').css('z-index', '2')
    }
});


// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

function createPopup(data) {
    const content = `<b>${data['Agency']}</b><br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
    return L.popup({
        closeButton: false
    }).setContent(content);
}

// JQuery Easy Autocomplete: http://easyautocomplete.com
const options = {
    url: "data/COM.json",
    getValue: "Agency",
    list: {
        maxNumberOfElements: 3,
        match: {
            enabled: true
        },
        onClickEvent: function () {
            clearSelection();
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


// function getMarker(agency) {
//     for (const i in providers) {
//         const provider = providers[i].data.Agency;
//         if (provider === agency) {
//             providers[i].openPopup();
//         }
//     }
// }

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
    map.fire('click', {
        latlng: marker_location
    });

    $('#map').css('z-index', '11');

    var popup = L.popup()
        .setLatLng(marker_location)
        .setContent(event.toElement.innerHTML)
        .openOn(map);
}
// // This file will house all of the map logic for screen size changes
// let infoButton;
// // append search bar to the top of the map when on small screen
// if (screen.availWidth < 813) {
//     document.getElementById('full-page').appendChild(
//         document.getElementById('geocoder_box')
//     );
//     if (infoButton) {
//     } else {
//         infoButton = L.control.infoButton({
//             position: 'topleft',
//             html: "<div style='text-align:center;'><p></p><img src='images/fsulogo.png' alt='FSU Logo' width='75' height='75'=><br><br><h4>Florida State University College of Medicine</h4><br><h5>Group Care Search Demo</h5><br><p>This demo counts the number of group care facilities within a radius of a given point and displays them on a map using Leaflet.</p><br><p>To use, enter an address and then enter a radius. Under results will be the number of markers within the given radius. You can also drag the marker on the map; the number will update automatically.</p><br><p>More information regarding the original code is available here. Code was originally used here.</p><br><p>This project is sponsored by:</p><a href='https://www.sagerx.com/' target='_blank'><img alt='Sage Therapeutics' src='images/logo-sagerx.svg'><br><br></div>"
//         });

//         infoButton.addTo(map);
//     }
// }

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
        }],
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
}

// This places marker, circle on map
function querySearchArea(location, activeLayer = json_group, z = 5) {
    clearSelection();

    // Center the map on the result
    map.setView(new L.LatLng(location.lat, location.lng), z);

    searchArea = L.circle([location.lat, location.lng], milesToMeters(radius.val()), {
        color: selected_color,
        fillColor: selected_color,
        fillOpacity: 0.1,
        clickable: false,
        interactive: false
    }).addTo(map);

    // This will determine how many markers are within the circle
    // Called when points are initially loaded
    pointsInCircle(searchArea, milesToMeters(radius.val()), activeLayer);
}


// Assign these properties to each marker in the data
function markerLogic(data) {

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
        }
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
    });

    // Add a data object for use in the table
    circle_marker.data = {
        'Agency': data['Agency']
    };

    return circle_marker;
}