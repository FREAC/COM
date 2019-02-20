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
            console.log(layer);
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

        const tableResults = [];

        for (let i = 0; i < counter_points_in_circle; i++) {

            tableResults[i] = {
                id: i,
                name: results[i].name,
                distance: getMiles(results[i].dist),
                lat: results[i].latitude,
                lng: results[i].longitude,
                link: results[i].countyName
            }
        }

        // insert new dynamic table based on the results of the circle
        new Tabulator("#results-table", {
            height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
            data: tableResults, //assign data to table
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
                        labelField:"link",
                        urlPrefix:"https://www.google.com/search?q=",
                        target:"_blank",
                    }
                }
            ],
            rowClick: function (e, row) { //trigger a response when the row is clicked
                // identify lat and lng
                const lat = row.getData().lat;
                const lng = row.getData().lng;

                // set the view to the lat,lng point of the row that was clicked
                map.setView(new L.LatLng(lat, lng), 12);

                // if a marker is already present on the map, remove it
                if (row_marker) {
                    map.removeLayer(row_marker);
                }
                // Set market location
                const marker_location = new L.LatLng(lat, lng);

                // set the row_marker variable to our location and style
                row_marker = L.circleMarker(marker_location, markerStyle(4, "#FF0000", "#FF0000", 1, 1));

                // add marker to the map
                map.addLayer(row_marker);

            },
        });

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

// when submit button clicked, geocodeAddresses
$('#ESRI-Search').on('click', function () {
    geocodeAddress($('#geocoder-input').val());
});

// when enter button clicked, geocodeAddresses
$('#geocoder-input').keypress(function (event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        geocodeAddress($('#geocoder-input').val());
    }
});

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

_.each(json_data, function (num) {
    const dataLat = num['Latitude'];
    const dataLong = num['Longitude'];

    // Add to our marker
    const marker_location = new L.LatLng(dataLat, dataLong);



    const layer_marker = L.circleMarker(marker_location, markerStyle(4, "#ED9118", "#FFFFFF", 1, .8))
        .bindPopup(num['CompanyNam']);

    layer_marker.data = {'CompanyName':num['CompanyNam'], 'CountyName':num['CountyName']};

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

        }
    });
    json_group.addLayer(layer_marker);
    // Close for loop
}, this);

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
    const z = map.getZoom();
    if (z < 10) {
        geocodePlaceMarkersOnMap(e.latlng);
    } else {
        geocodePlaceMarkersOnMap(e.latlng, z);
    }
});