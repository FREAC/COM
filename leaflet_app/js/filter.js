// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked

async function filterLocations(event) {

    // assign button ids to variables
    const acceptMedicare = $('#medicare');
    const acceptInsurance = $('#insurance');

    // set up cases for checkbox combinations
    if ((acceptMedicare[0].checked === true) && (acceptInsurance[0].checked === true)) {
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
            targetLayer.data['Agency'] = targetLayer.data.agency;

            // if EITHER meets the condition, add it to the map
            if ((targetLayer.data.City === "Tallahassee") && (targetLayer.data.PostalCode === "32308")) {
                markerLogic(targetLayer.data, selection_group);
            }
        }
        // Add our selection markers in our JSON file on the map
        map.addLayer(selection_group);

        // configureAutocomplete(selection_group);

        // set active layer
        activeLayer = selection_group;

        // if only one of the checkboxes is checked,
        // target only that checkbox
    } else if ((acceptMedicare[0].checked === true) || (acceptInsurance[0].checked == true)) {

        // remove/clear both layers from map
        await map.removeLayer(json_group);
        selection_group.clearLayers();
        if (acceptMedicare[0].checked === true) {

            // for each feature in our json
            for (layer in json_group._layers) {
                const targetLayer = json_group._layers[layer];


                // extract latitude and longitude
                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                targetLayer.data['Longitude'] = targetLayer._latlng.lng;
                targetLayer.data['Agency'] = targetLayer.data.Agency;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.PostalCode === "32308") {
                    // markerLogic(targetLayer.data, selection_group);
                    const marker = markerLogic(targetLayer.data);
                    marker.addTo(selection_group);
                }
            }
            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);

            // configureAutocomplete(selection_group);

            // set active layer
            activeLayer = selection_group;

        } else if (acceptInsurance[0].checked === true) {

            // for each feature in our json
            for (layer in json_group._layers) {
                const targetLayer = json_group._layers[layer];

                // extract latitude and longitude
                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                targetLayer.data['Longitude'] = targetLayer._latlng.lng;
                targetLayer.data['Agency'] = targetLayer.data.agency;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.City === "Tallahassee") {
                    const marker = markerLogic(targetLayer.data);
                    marker.addTo(selection_group);
                }
            }

            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);

            // configureAutocomplete(selection_group);

            // set active layer
            activeLayer = selection_group;
        }
    } else {

        // clear the selection layer
        selection_group.clearLayers();
        // add the full layer back to the map
        map.addLayer(json_group);

        // configureAutocomplete(json_group);

        // set active layer
        activeLayer = json_group;
    }
}