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
            selection_marker.setStyle(markerStyle("#ED9118", "#FFFFFF", .8));
        }
    }
});

// when the event button is clicked, and location found
// zoom to location and draw circle
map.on('locationfound', function (event) {
    locateZoom(event);
});

// Base map
L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// Locate Button
L.control.locate({
    strings: {
        title: "Find my location"
    },
    drawCircle: false,
    drawMarker: false
}).addTo(map);


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
    selection_marker = L.circleMarker(marker_location, markerStyle("#FF0000", "#FF0000"));

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
    // insert new dynamic table based on the results of the circle
    table = new Tabulator("#results-table", {
        height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: data, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        selectable: 1,
        columns: [
            {
                title: "Provider",
                field: "agency"
            }
        ],
        rowClick: function (e, row) { //trigger a response when the row is clicked

            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const z = map.getZoom();

            // if too far away, zoom in
            if (z < 12) {
                zoomToLocation(lat, lng);
            } else {
                zoomToLocation(lat, lng, z);
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
            // If it's too far away, zoom in
            zoomToLocation(results['Latitude'], results['Longitude']);
            // otherwise, stay at current zoom
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

// This uses the ESRI geocoder
function geocodeAddress(address) {

    const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    const params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    const queryString = params + address;
    $.get(url, queryString, function (data) {
        if (data.candidates.length !== 0) {
            // results were found!
            isNotInvalid();
            // pick the top candidate of the geocode match
            const coords = data.candidates[0].location;
            const location = {
                lng: coords.x,
                lat: coords.y
            };
            geocodePlaceMarkersOnMap(location);
        } else {
            // set invalid classes
            isInvalid();
        }
    });
}

// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

// This figures out how many points are within our circle
function pointsInCircle(circle, meters_user_set, groupLayer) {
    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        circle_lat_long = circle.getLatLng();

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
            layer_lat_long = layer.getLatLng();

            // Distance from our circle marker
            // To current point in meters
            distance_from_layer_circle = layer_lat_long.distanceTo(circle_lat_long);

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
function geocodePlaceMarkersOnMap(location, z = 10, activeLayer = json_group) {
    // Clear any current selections that are on the map
    clearSelections();

    // Center the map on the result
    map.setView(new L.LatLng(location.lat, location.lng), z);

    // Create circle around marker with our selected radius
    circle = L.circle([location.lat, location.lng], milesToMeters($('#radius-selected').val()), {
        color: '#2BBED8',
        fillColor: '#2BBED8',
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
        circle.setLatLng(event.target.getLatLng());

        // This will determine how many markers are within the circle
        pointsInCircle(circle, milesToMeters($('#radius-selected').val()), activeLayer);

        // Redraw: Leaflet function
        circle.redraw();

        // Clear out address in geocoder
        $('#geocoder-input').val('');
    });

    // Add marker to the map
    search_marker.addTo(map);

    // This will determine how many markers are within the circle
    // Called when points are initially loaded
    pointsInCircle(circle, milesToMeters($('#radius-selected').val()), activeLayer);
}

// Change circle radius when changed on page
function changeCircleRadius(e) {
    // Determine which geocode box is filled
    // And fire click event
    // This will determine how many markers are within the circle
    pointsInCircle(circle, milesToMeters($('#radius-selected').val()), activeLayer)
    // Set radius of circle only if we already have one on the map
    if (circle) {
        circle.setRadius(milesToMeters($('#radius-selected').val()));
    }
}

// This sets the marker styles for any of the circleMarker symbols 
// inserted in setStyle, so any renderer that uses setStyle can use this function
function markerStyle(fillColor, color, fillOpacity=1, radius=4, weight=1) {
    return {
        fillColor: fillColor,
        color: color,
        fillOpacity: fillOpacity,
        radius: radius,
        weight: weight
    };
}

// This loops through the data in our JSON file
// And puts it on the map
function markerLogic(num, targetLayer) {

    const fill_color = "#ED9118";
    const outline_color = "#FFFFFF";
    const hover_color = "#2BBED8";
    const selected_color = "#FF0000";

    const dataLat = num['Latitude'];
    const dataLong = num['Longitude'];

    const html = `<b>${num['Agency']}</b><br>
                    ${num['HouseNumber']} ${num['Street']} ${num['Unit']}<br>
                    ${num['City']}, ${['State']} ${num['PostalCode']}`;
    
    const popup = L.popup({closeButton: false}).setContent(html);

    // Add to our marker
    const marker_location = new L.LatLng(dataLat, dataLong);
    const layer_marker = L.circleMarker(marker_location, markerStyle(fill_color, outline_color))
        .bindPopup(popup);

    // Build the data
    layer_marker.data = {
        'Agency': num['Agency']
    };

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function (e) {
            // if the moused over marker is not red, 
            // display the mouseover color change
            if (e.target.options.fillColor !== selected_color) { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(hover_color, hover_color));
            }
        },
        // What happens when mouse leaves the marker
        mouseout: function (e) {
            // if the marker is not read, change the color back to original marker color
            // otherwise, leave it be
            if (e.target.options.fillColor !== selected_color) { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(fill_color, outline_color));
            }
        },
        // What happens when the marker is clicked
        click: function (e) {
            // if there is no click marker yet, assign one
            if (selection_marker === undefined) {
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, .8));
            } else { // if there is a click marker already
                // assign old marker back to original color
                selection_marker.setStyle(markerStyle(fill_color, outline_color, .8));

                // assign new marker to red
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, .8));
            }
            // if a tabulator table is already active
            if ($('#results-table').hasClass('tabulator')) {
                // get the data that is inside of it
                const data = table.getData();
                // loop through data to see if clicked feature matches
                for (let i in data) {
                    // if we find a layer match, select it
                    if (e.target.data.Agency === data[i].agency) {
                        // deselect previous row selection
                        table.deselectRow();
                        // select new row selection
                        table.selectRow(i);
                    }
                }
            }
        }
    });
    // add the marker onto the targetLayer
    targetLayer.addLayer(layer_marker);
}