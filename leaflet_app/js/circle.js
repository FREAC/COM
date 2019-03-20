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

        // counter for number of points in circle
        let counter_points_in_circle = 0;

        // hold the initial results for points inside circle radius
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