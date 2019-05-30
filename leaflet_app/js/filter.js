// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked

async function filterLocationsTest(event) {
    const acceptMedicare = $('#medicare');
    const acceptInsurance = $('#insurance');

    console.log(acceptMedicare);
    console.log(acceptInsurance);

    // TODO: add filter functionality based on previous filter locations function

}

async function filterLocations(event) {

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
            targetLayer.data['Agency'] = targetLayer.data.agency;

            // if EITHER meets the condition, add it to the map
            if ((targetLayer.data.ProgramSub === "Public School") && (targetLayer.data.ProgramSub === "Private School")) {
                markerLogic(targetLayer.data, selection_group);
            }
        }
        // Add our selection markers in our JSON file on the map
        map.addLayer(selection_group);

        configureAutocomplete(selection_group);

        // set active layer
        activeLayer = selection_group;

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
                targetLayer.data['Agency'] = targetLayer.data.agency;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.ProgramSub === "Private School") {
                    markerLogic(targetLayer.data, selection_group);
                }
            }
            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);

            configureAutocomplete(selection_group);

            // set active layer
            activeLayer = selection_group;

        } else if (publicSchool[0].checked === true) {

            // for each feature in our json
            for (layer in json_group._layers) {
                const targetLayer = json_group._layers[layer];

                // extract latitude and longitude
                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                targetLayer.data['Longitude'] = targetLayer._latlng.lng;
                targetLayer.data['Agency'] = targetLayer.data.agency;

                // if the feature has a matching attribute, add it to the map
                if (targetLayer.data.ProgramSub === "Public School") {
                    markerLogic(targetLayer.data, selection_group);
                }
            }

            // Add our selection markers in our JSON file on the map
            map.addLayer(selection_group);

            configureAutocomplete(selection_group);

            // set active layer
            activeLayer = selection_group;
        }
    } else {
        // clear the selection layer
        selection_group.clearLayers();
        // add the full layer back to the map
        map.addLayer(json_group);

        configureAutocomplete(json_group);

        // set active layer
        activeLayer = json_group;
    }
}