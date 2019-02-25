// We'll append our markers to this global variable
const json_group = new L.FeatureGroup();
// This is the circle on the map that will be determine how many markers are around
let circle;
// Marker in the middle of the circle
let search_marker;

let row_marker

// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

function getMiles(meters) {
    return meters * 0.000621371192;
}

// create a reusable Tabulator object
function insertTabulator(data) {
    // insert new dynamic table based on the results of the circle
    new Tabulator("#results-table", {
        height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: data, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        selectable: 1,
        columns: [ //Define Table Columns
            {
                title: "Name",
                field: "name",
            }, {
                title: "Distance (miles)",
                field: "distance",
            }, {
                title: "Link",
                field: "link",
                formatter: "link",
                formatterParams: {
                    labelField: "link",
                    urlPrefix: "https://www.google.com/search?q=",
                    target: "_blank",
                }
            }
        ],
        rowClick: function (e, row) { //trigger a response when the row is clicked
            // identify lat and lng
            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const z = map.getZoom();

            // if too far away, zoom in
            if (z < 12) {
                zoomToLocation(lat, lng);
                // if close enough, don't zoom in
            } else {
                zoomToLocation(lat, lng, z);
            }
        },
    });
}

// This figures out how many points are within our circle
function pointsInCircle(circle, meters_user_set) {
    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        circle_lat_long = circle.getLatLng();

        // Singular, plural information about our JSON file
        // Which is getting put on the map
        const title_singular = 'provider';
        const title_plural = 'providers';

        let counter_points_in_circle = 0;
        const results = [];

        // Loop through each point in JSON file
        json_group.eachLayer(function (layer) {

            // Lat, long of current point
            layer_lat_long = layer.getLatLng();

            // Distance from our circle marker
            // To current point in meters
            distance_from_layer_circle = layer_lat_long.distanceTo(circle_lat_long);

            // See if meters is within raduis
            // The user has selected
            if (distance_from_layer_circle <= meters_user_set) {
                counter_points_in_circle += 1;
                results.push({
                    name: layer.data.CompanyName,
                    dist: distance_from_layer_circle,
                    latitude: layer_lat_long.lat,
                    longitude: layer_lat_long.lng,
                    countyName: layer.data.CountyName
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
                name: results[i]['name'],
                distance: getMiles(results[i]['dist']),
                lat: results[i]['latitude'],
                lng: results[i]['longitude'],
                link: results[i]['countyName']
            });
        }
        // add tabulator object to screen
        insertTabulator(tableResults);

        // If we have just one result, we'll change the wording
        // So it reflects the category's singular form
        // I.E. facility not facilities
        if (counter_points_in_circle === 1) {
            $('#json_one_title').html(title_singular);
            // If not one, set to plural form of word
        } else {
            $('#json_one_title').html(title_plural);
        }

        // Set number of results on main page
        $('#json_one_results').html(counter_points_in_circle);
    }
    // Close pointsInCircle
};


// This places marker, circle on map
function geocodePlaceMarkersOnMap(location, z = 10) {

    // Center the map on the result
    map.setView(new L.LatLng(location.lat, location.lng), z);

    // Remove circle if one is already on map
    if (circle) {
        map.removeLayer(circle);
    }

    // Create circle around marker with our selected radius
    circle = L.circle([location.lat, location.lng], milesToMeters($('#radius-selected').val()), {
        color: '#2BBED8',
        fillColor: '#2BBED8',
        fillOpacity: 0.1,
        clickable: false,
        interactive: false
    }).addTo(map);

    // Remove marker if one is already on map
    if (search_marker) {
        map.removeLayer(search_marker);
    }

    // Create marker
    search_marker = L.marker([location.lat, location.lng], {
        // Allow user to drag marker
        draggable: true
    });

    // Reset map view on marker drag
    search_marker.on('dragend', function (event) {
        map.setView(event.target.getLatLng());
        circle.setLatLng(event.target.getLatLng());

        // This will determine how many markers are within the circle
        pointsInCircle(circle, milesToMeters($('#radius-selected').val()));

        // Redraw: Leaflet function
        circle.redraw();

        // Clear out address in geocoder
        $('#geocoder-input').val('');
    });

    // Add marker to the map
    search_marker.addTo(map);

    // This will determine how many markers are within the circle
    // Called when points are initially loaded
    pointsInCircle(circle, milesToMeters($('#radius-selected').val()));
}


// Change circle radius when changed on page
function changeCircleRadius(e) {
    // Determine which geocode box is filled
    // And fire click event
    // This will determine how many markers are within the circle
    pointsInCircle(circle, milesToMeters($('#radius-selected').val()))
    // Set radius of circle only if we already have one on the map
    if (circle) {
        circle.setRadius(milesToMeters($('#radius-selected').val()));
    }
}


// This uses the ESRI geocoder
function geocodeAddress(address) {

    const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    const params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    const queryString = params + address;
    console.log(queryString);
    $.get(url, queryString, function (data) {
        console.log(data);
        const coords = data.candidates[0].location;
        const location = {
            lng: coords.x,
            lat: coords.y
        };
        geocodePlaceMarkersOnMap(location);
    });
}

// search a JSON object for value
function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].CompanyNam === nameKey) {
            return myArray[i];
        }
    }
}

// general function that will take in lat and lon
// then will zoom to and highlight desired feature
function zoomToLocation(lat, lng, z = 12) {
    // if a marker is already present on the map, remove it
    if (row_marker) {
        map.removeLayer(row_marker);
    }

    // set view to location
    map.setView(new L.LatLng(lat, lng), z);

    // Set marker location
    const marker_location = new L.LatLng(lat, lng);

    // set the row_marker variable to our location and style
    row_marker = L.circleMarker(marker_location, markerStyle(4, "#FF0000", "#FF0000", 1, 1));

    //allow for the user to click the point under the marker
    row_marker.options.interactive = false;

    // add marker to the map
    map.addLayer(row_marker);
}

// when submit button clicked, search names and addresses
$('#ESRI-Search').on('click', async function () {
    const val = document.getElementById("geocoder-input").value;
    let results;

    // Remove marker if one is already on map
    if (search_marker) {
        map.removeLayer(search_marker);
    }

    // Get json data and search it
    const json_data = await $.get("./js/data/group_care.json", function (json_data) {
        results = search(val, json_data);
    });

    // If there are any results returned from the search,
    // Add it to the tableResults object array
    if (results !== undefined) {

        const tableResults = [{
            id: 1,
            name: results['CompanyNam'],
            distance: 0,
            lat: results['Latitude'],
            lng: results['Longitude'],
            link: results['CountyName'],
        }]

        // Insert tabulator object 
        insertTabulator(tableResults);
        // Zoom to location of company
        const z = map.getZoom();
        if (z < 12) {
            // If it's too far away, zoom in
            zoomToLocation(results['Latitude'], results['Longitude']);
            // otherwise, stay at current zoom
        } else {
            zoomToLocation(results['Latitude'], results['Longitude'], z);
        }
    } else {
        geocodeAddress($('#geocoder-input').val());

    }


});

// $('#name-search').on('click', async function () {

//     let result;
//     const val = document.getElementById("geocoder-input").value;
//     const json_data = await $.get("./js/data/group_care.json", function (json_data) {
//         result = search(val, json_data);
//     });

//     // zoom to location of company

//     const z = map.getZoom();
//     if (z < 12) {
//         zoomToLocation(result['Latitude'], result['Longitude']);

//     } else {
//         zoomToLocation(result['Latitude'], result['Longitude'], z);
//     }
// });

// Options for the autocomplete plugin
var options = {
    url: "./js/data/group_care.json",
    // set multiple fields as searchable values by adding them to properties
    getValue: function (element) {
        return $(element).prop("CompanyNam") + "<br>" + $(element).prop("CompleteSt");
    },
    list: {
        match: {
            enabled: true
        },
        onClickEvent: function () {
            // when suggestion clicked, add company name to the search bar
            var newvalue = jQuery("#geocoder-input").getSelectedItemData().CompanyNam;
            jQuery("#geocoder-input").val(newvalue);
        }
    }
};

//event for when the autocomplete is happening
$('#geocoder-input').easyAutocomplete(options);

// when enter button clicked, geocodeAddresses
$('#geocoder-input').keypress(function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        geocodeAddress($('#geocoder-input').val());
    }
});

// when search radius changes, chang circle size and re-query
$('select').change(function () {
    changeCircleRadius();
});

// This sets the marker styles for any of the circleMarker symbols 
// inserted in setStyle, so any renderer that uses setStyle can use this function
function markerStyle(radius, fillColor, color, weight, fillOpacity) {
    return {
        radius: radius,
        fillColor: fillColor,
        color: color,
        weight: weight,
        fillOpacity: fillOpacity
    };
}

// This loops through the data in our JSON file
// And puts it on the map

$.get("./js/data/group_care.json", function (json_data) {

    _.each(json_data, function (num) {
        const dataLat = num['Latitude'];
        const dataLong = num['Longitude'];

        // Add to our marker
        const marker_location = new L.LatLng(dataLat, dataLong);
        const layer_marker = L.circleMarker(marker_location, markerStyle(4, "#ED9118", "#FFFFFF", 1, num['CountyCode'] / 100))
            .bindPopup(num['CompanyNam']);

        // Build the data
        layer_marker.data = {
            'CompanyName': num['CompanyNam'],
            'CountyName': num['CountyName'],
            'CountyCode': num['CountyCode'],
            'CountyNum': num['CountyNumb']
        };

        // Add events to marker
        layer_marker.on({
            // What happens when mouse hovers markers
            mouseover: function (e) {
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(4, "#2BBED8", "#2BBED8", 1, 1));

            },
            // What happens when mouse leaves the marker
            mouseout: function (e) {
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));

            },
            // What happens when the marker is clicked
            click: function (e) {
                // on marker click, add data to table
                const tableResults = [{
                    id: 1,
                    name: e.sourceTarget.data['CompanyName'],
                    distance: 0,
                    lat: e.latlng['lat'],
                    lng: e.latlng['lng'],
                    link: e.sourceTarget.data['CountyName'],
                }]

                insertTabulator(tableResults)
            }
        });
        json_group.addLayer(layer_marker);
        // Close for loop
    }, this);
});

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
// Add our markers in our JSON file on the map
map.addLayer(json_group);

//Right-clicking the map triggers the search function
map.on('contextmenu', function (e) {
    // Remove marker if one is already on map
    if (search_marker) {
        map.removeLayer(search_marker);
    }
    const z = map.getZoom();
    if (z < 10) {
        geocodePlaceMarkersOnMap(e.latlng);
    } else {
        geocodePlaceMarkersOnMap(e.latlng, z);
    }
});