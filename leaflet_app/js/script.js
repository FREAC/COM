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

// create a reusable Tabulator object
function insertTabulator(data) {
    // insert new dynamic table based on the results of the circle
    table = new Tabulator("#results-table", {
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

// Options for the autocomplete plugin
var options = {
    url: "./js/data/group_care.json",
    // set multiple fields as searchable values by adding them to properties
    getValue: function (element) {
        return $(element).prop("CompanyNam"); // (how to add more fields)+ "<br>" + $(element).prop("CompleteSt");
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
$('#radius-selected').change(function () {
    changeCircleRadius();
});

// =$(json).filter(function (i,n){return n.website==='yahoo'});


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

// assign opacity (to a marker)
function assignOpacity(num) {
    return num / 100;
}

// This loops through the data in our JSON file
// And puts it on the map
function markerLogic(num, targetLayer) {
    const dataLat = num['Latitude'];
    const dataLong = num['Longitude'];

    // set the popup content
    const popup = L.popup()
        .setContent(
            `
        <p><strong>Company Name: </strong> ${num['CompanyNam']}</p>
        <p><strong>Company Link: </strong><a href='https://www.google.com/search?q= + ${num['CountyName']}' target="_blank">${num['CountyName']}</a></p>
        `
        );

    // Add to our marker
    const marker_location = new L.LatLng(dataLat, dataLong);
    const layer_marker = L.circleMarker(marker_location, markerStyle(4, "#ED9118", "#FFFFFF", 1, assignOpacity(num['CountyCode'])))
        .bindPopup(popup);

    // Build the data
    layer_marker.data = {
        'CompanyName': num['CompanyNam'],
        'CountyName': num['CountyName'],
        'CountyCode': num['CountyCode'],
        'CountyNum': num['CountyNumb'],
        'Category': num['ProgramSub']
    };

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function (e) {
            // if the moused over marker is not red, 
            // display the mouseover color change
            if (e.target.options.fillColor !== "#FF0000") { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(4, "#2BBED8", "#2BBED8", 1, 1));
            }

        },
        // What happens when mouse leaves the marker
        mouseout: function (e) {
            // if the marker is not read, change the color back to original marker color
            // otherwise, leave it be
            if (e.target.options.fillColor !== "#FF0000") { // marker is not already red (clicked)
                const layer_marker = e.target;

                const opacityVar = e.target.data.CountyCode;
                layer_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, assignOpacity(opacityVar)));

            }
        },
        // What happens when the marker is clicked
        click: function (e) {
            // if there is no click marker yet, assign one
            if (selection_marker === undefined) {
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(4, "#FF0000", "#FF0000", 1, .8));
            } else { // if there is a click marker already
                // assign old marker back to original color
                selection_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));

                // assign new marker to red
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(4, "#FF0000", "#FF0000", 1, .8));
            }
            // if a tabulator table is already active
            if ($('#results-table').hasClass('tabulator')) {
                // get the data that is inside of it
                const data = table.getData();
                // loop through data to see if clicked feature matches
                for (let i in data) {
                    // if we find a layer match, select it
                    if (e.target.data.CompanyName === data[i].name) {
                        // deselect previous row selection
                        table.deselectRow();
                        // select new row selection
                        table.selectRow(i);
                    }
                }
            }
        }
    });
    targetLayer.addLayer(layer_marker);

    // Close for loop
}

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

// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked
$("#checkboxes input[type='checkbox']").change(async function (event) {

    // assign button ids to variables
    const privateSchool = $('#privateSchool');
    const publicSchool = $('#publicSchool');

    // set up cases for checkbox combinations
    if ((privateSchool[0].checked === true) && (publicSchool[0].checked === true)) {
        await map.removeLayer(json_group);
        selection_group.clearLayers();
        await map.removeLayer(selection_group);

        // for each feature in our json
        for (layer in json_group._layers) {
            // current target layer that we're looking at
            const targetLayer = json_group._layers[layer];

            // extract latitude and longitude
            targetLayer.data['Latitude'] = targetLayer._latlng.lat;
            targetLayer.data['Longitude'] = targetLayer._latlng.lng;
            // if EITHER meets the condition, add it to the map
            if ((targetLayer.data.Category === "Public School") || (targetLayer.data.Category === "Private School")) {
                markerLogic(targetLayer.data, selection_group);
            }

        }
        // Add our selection markers in our JSON file on the map
        map.addLayer(selection_group);

        // if only one of the checkboxes is checked,
        // target only that checkbox
    } else if ((privateSchool[0].checked === true) || (publicSchool[0].checked == true)) {

        // remove/clear both layers from map
        await map.removeLayer(json_group);
        selection_group.clearLayers();
        if (privateSchool[0].checked === true) {
            // for each feature in our json
            for (layer in json_group._layers) {
                const targetLayer = json_group._layers[layer];

                // extract latitude and longitude
                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                targetLayer.data['Longitude'] = targetLayer._latlng.lng;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.Category === "Private School") {
                    markerLogic(targetLayer.data, selection_group);
                }

            }
            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);

        } else if (publicSchool[0].checked === true) {

            // for each feature in our json
            for (layer in json_group._layers) {
                const targetLayer = json_group._layers[layer];

                // extract latitude and longitude
                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                targetLayer.data['Longitude'] = targetLayer._latlng.lng;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.Category === "Public School") {
                    markerLogic(targetLayer.data, selection_group);
                }

            }
            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);
        }

    } else {
        // clear the selection layer
        selection_group.clearLayers();
        // add the full layer back to the map
        map.addLayer(json_group);
    }
});

function clearSelections() {
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