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