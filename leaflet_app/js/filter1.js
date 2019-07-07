// this performs dynamic filtering when the user wants to limit their search
function filterOptions(filterObject, key) {
    // array of options we are wanting to find in the json_group data
    const filterArr = filterObject[key];

    // check to see whether there are checked selections
    const isChecked = (filterObject, key, filterArr) => filterObject[key] && filterArr.length > 0 && filterArr !== null

    // compare arrays and check for matching attributes
    const checkFilterPresence = (currentLayerArr) => {
        const matchingPoints = [];
        if (currentLayerArr.length > 0) {
            for (let item of currentLayerArr) {
                if (filterArr.includes(item.toLowerCase().replace(/\s/g, ''))) {
                    matchingPoints.push(item);
                }
            }
            console.log({
                matchingPoints
            });

            return matchingPoints;
        }
    }

    if (isChecked(filterObject, key, filterArr)) {
        map.addLayer(json_group);
        activeLayer = json_group;

        const filteredLayersArray = Object.values(activeLayer._map._layers).filter(layer => {
            if (!layer.data) {
                return false
            } else {

                const currentLayer = layer.data[key]; // current layer in json_group
                console.log(currentLayer);

                // currentLayerArr are target attributes from map (insurance, categories, etc.)
                const currentLayerArr = currentLayer.split(',') // convert comma separated string to arr
                const intersectionFilter = checkFilterPresence(currentLayerArr)
                console.log({
                    intersectionFilter
                });

                return intersectionFilter.length > 0 // return if there are more than 0 results
            }
        });

        console.log({
            filteredLayersArray
        });

        displayFilteredData(filteredLayersArray);
    } else {
        // re-insert (original) json_group
        map.removeLayer(selection_group);
        map.addLayer(json_group);
        activeLayer = json_group;
    }
}

function displayFilteredData(layers) {
    // remove current map layers
    map.removeLayer(json_group);
    selection_group.clearLayers();
    // for each object in the subset

    // are there layers? If yes, assign Lat and Long
    layers ? layers.map((layer) => {
        // assign Latitude and Longitude to data
        layer.data['Latitude'] = layer._latlng.lat;
        layer.data['Longitude'] = layer._latlng.lng;

        const data = layer.data;
        const marker = markerLogic(data);
        marker.addTo(selection_group);

    }) : console.log('nothing found');

    map.addLayer(selection_group);
    activeLayer = selection_group;

}