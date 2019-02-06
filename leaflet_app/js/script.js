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
function pointsInCircle(circle, meters_user_set ) {
    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        circle_lat_long = circle.getLatLng();

        // Singular, plural information about our JSON file
        // Which is getting put on the map
        var title_singular = 'provider';
        var title_plural = 'providers';

        var selected_provider = $('#dropdown_select').val();
        var counter_points_in_circle = 0;

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
            }
        });

        // If we have just one result, we'll change the wording
        // So it reflects the category's singular form
        // I.E. facility not facilities
        if (counter_points_in_circle === 1) {
            $('#json_one_title').html( title_singular );
        // If not one, set to plural form of word
        } else {
            $('#json_one_title').html( title_plural );
        }
        
        // Set number of results on main page
        $('#json_one_results').html( counter_points_in_circle );
    }
// Close pointsInCircle
};


// This places marker, circle on map
function geocodePlaceMarkersOnMap(location) {

    // Center the map on the result
    map.setView(new L.LatLng(location.lat, location.lng), 10);

    // Remove circle if one is already on map
    if(circle) {
        map.removeLayer(circle);
    }
    
    // Create circle around marker with our selected radius
    circle = L.circle([location.lat, location.lng], milesToMeters( $('#radius-selected').val() ), {
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
        draggable: true,
        icon: search_icon
    });

    // Reset map view on marker drag
    search_marker.on('dragend', function(event) {
        map.setView( event.target.getLatLng() ); 
        circle.setLatLng( event.target.getLatLng() );

        // This will determine how many markers are within the circle
        pointsInCircle( circle, milesToMeters( $('#radius-selected').val() ) );

        // Redraw: Leaflet function
        circle.redraw();

        // Clear out address in geocoder
        $('#geocoder-input').val('');
    });

    // Add marker to the map
    search_marker.addTo(map);

    // This will determine how many markers are within the circle
    // Called when points are initially loaded
    pointsInCircle( circle, milesToMeters( $('#radius-selected').val() ) );
}


// Change circle radius when changed on page
function changeCircleRadius(e) {
    // Determine which geocode box is filled
    // And fire click event
    // This will determine how many markers are within the circle
    pointsInCircle(circle, milesToMeters( $('#radius-selected').val() ) )
    // Set radius of circle only if we already have one on the map
    if (circle) {
        circle.setRadius( milesToMeters( $('#radius-selected').val() ) );
    }
}


// This uses the ESRI geocoder
function geocodeAddress(address) {

    var url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates'; 
    var params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    var queryString = params + address;
    $.get(url, queryString, function(data) {
        var coords = data.candidates[0].location;
        var location = {
            lng: coords.x,
            lat: coords.y
        };
        geocodePlaceMarkersOnMap(location);
    });
}

$('#ESRI-Search').on('click', function() {
    geocodeAddress($('#geocoder-input').val());
});

$('select').change(function() {
    changeCircleRadius();
});

// This loops through the data in our JSON file
// And puts it on the map
_.each(json_data, function(num) {
    var dataLat = num['Latitude'];
    var dataLong = num['Longitude'];

    // Add to our marker
    var marker_location = new L.LatLng(dataLat, dataLong);

    // Options for our circle marker
    var layer_marker = L.circleMarker(marker_location, {
        radius: 4,
        fillColor: "#ED9118",
        color: "#FFFFFF",
        weight: 1,
        fillOpacity: 0.8
    }).bindPopup(num['CompanyNam']);

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function(e) {
            var layer_marker = e.target;
            layer_marker.setStyle({
                radius: 6,
                fillColor: "#2BBED8",
                color: "#2BBED8",
                weight: 1,
                fillOpacity: 1
            });
        },
        // What happens when mouse leaves the marker
        mouseout: function(e) {
            var layer_marker = e.target;
            layer_marker.setStyle({
                radius: 4,
                fillColor: "#ED9118",
                color: "#FFFFFF",
                weight: 1,
                fillOpacity: 0.8
            });
        }
    });
    json_group.addLayer(layer_marker);
// Close for loop
}, this);

var search_marker;
var search_icon = L.AwesomeMarkers.icon({
    icon: 'icon-circle',
    color: 'blue'
});


/* $('#geocoder').geocodify({
    onSelect: function (result) {
        // Extract the location from the geocoder result
        var location = result.geometry.location;

        // Call function and place markers, circle on map
        geocodePlaceMarkersOnMap(location);
    },
    initialText: 'Zip code, city, etc...',
    regionBias: 'US',
    // Lat, long information for Cedar Valley enter here
    viewportBias: new google.maps.LatLngBounds(
        new google.maps.LatLng(40.217754, -96.459961),
        new google.maps.LatLng(43.749935, -90.175781)
    ),
    width: 300,
    height: 26,
    fontSize: '14px',
    filterResults: function (results) {
        var filteredResults = [];
        $.each(results, function (i, val) {
            var location = val.geometry.location;
            if (location.lat() > minY && location.lat() < maxY) {
                if (location.lng() > minX && location.lng() < maxX) {
                    filteredResults.push(val);
                }
            }
        });
        return filteredResults;
    }
}); */


// Base map
var layer = new L.StamenTileLayer('toner-background');
var map = new L.Map('map', {
    center: new L.LatLng(28.3,-83.1),
    minZoom: 7,
    maxZoom: 13,
    zoom: 7,
    maxBounds: [[23.5,-88.5],[33,-79]]
});
// Add base layer to group
map.addLayer(layer);
// Add our markers in our JSON file on the map
map.addLayer(json_group);

//Right-clicking the map triggers the search function
map.on('contextmenu', function(e) {
    geocodePlaceMarkersOnMap(e.latlng);
});