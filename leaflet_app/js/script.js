// We'll append our markers to this global variable
var json_group = new L.FeatureGroup();
// This is the circle on the map that will be determine how many markers are around
var circle;
// Marker in the middle of the circle
var search_marker;


// Convert miles to meters to set radius of circle
function milesToMeters(miles) {
    return miles * 1069.344;
};

// This figures out how many points are within our circle
function pointsInCircle(circle, meters_user_set) {
    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        circle_lat_long = circle.getLatLng();

        // Singular, plural information about our JSON file
        // Which is getting put on the map
        var title_singular = 'provider';
        var title_plural = 'providers';

        var counter_points_in_circle = 0;
        var results = [];

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
                    name: layer._popup._content,
                    dist: distance_from_layer_circle
                });
            }
        });

        //Sort the list by increasing distance from point
        results.sort(function (a, b) {
            return a.dist - b.dist;
        });

        var table = document.getElementById('results-table')
        table.innerHTML = '';
        for (var i = 0; i < counter_points_in_circle; i++) {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            var text = document.createTextNode(results[i].name);

            td.appendChild(text);
            tr.appendChild(td);
            table.appendChild(tr);
        }

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
        clickable: false
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

    var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    var params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    var queryString = params + address;
    $.get(url, queryString, function (data) {
        console.log(data);
        var coords = data.candidates[0].location;
        var location = {
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
    console.log(event);
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
    var dataLat = num['Latitude'];
    var dataLong = num['Longitude'];

    // Add to our marker
    var marker_location = new L.LatLng(dataLat, dataLong);

    var layer_marker = L.circleMarker(marker_location, markerStyle(4, "#ED9118", "#FFFFFF", 1, .8))
        .bindPopup(num['CompanyNam']);

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function (e) {
            var layer_marker = e.target;
            layer_marker.setStyle(markerStyle(4, "#2BBED8", "#2BBED8", 1, 1));

        },
        // What happens when mouse leaves the marker
        mouseout: function (e) {
            var layer_marker = e.target;
            layer_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));

        }
    });
    json_group.addLayer(layer_marker);
    // Close for loop
}, this);

var search_marker;

// Base map
let basemap = L.tileLayer.provider('OpenStreetMap.Mapnik');

// Map
var map = new L.Map('map', {
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
    var z = map.getZoom();
    if (z < 10) {
        geocodePlaceMarkersOnMap(e.latlng);
    } else {
        geocodePlaceMarkersOnMap(e.latlng, z);
    }
});

// append search bar to the top of the map when on small screen
if (screen.availWidth < 766) {
    document.getElementById('full-page').appendChild(
        document.getElementById('geocoder_box')
    );
    if (infoButton) {
        console.log(infoButton);
    } else {
        console.log('happened');
        var infoButton = L.control.infoButton({
            position: 'topleft',
            html: "<div style='text-align:center;'><p></p><img src='images/fsulogo.png' alt='FSU Logo' width='75' height='75'=><br><br><h4>Florida State University College of Medicine</h4><br><h5>Group Care Search Demo</h5><br><p>This demo counts the number of group care facilities within a radius of a given point and displays them on a map using Leaflet.</p><br><p>To use, enter an address and then enter a radius. Under results will be the number of markers within the given radius. You can also drag the marker on the map; the number will update automatically.</p><br><p>More information regarding the original code is available here. Code was originally used here.</p><br><p>This project is sponsored by:</p><a href='https://www.sagerx.com/' target='_blank'><img alt='Sage Therapeutics' src='images/logo-sagerx.svg'><br><br></div>"
        });

        infoButton.addTo(map);
    }

}
// else if (screen.availWidth >= 766) {
//     //the search box goes back to its original places
//     document.getElementById('search-box').appendChild(
//         document.getElementById('geocoder-box')
//     );
// }