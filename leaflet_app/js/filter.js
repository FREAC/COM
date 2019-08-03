// create filter object to hold all selected elements based on type
let filterObject = {
    "Insurance": undefined,
    "Specialty": undefined,
    "Serves": undefined,
    "telehealth": undefined,
    "new-client": undefined,
    "Which_cate": undefined,
    "Areas_Serv": undefined,
    "Practice_a": undefined
};
// hold all returned data from orFilters selections
const andFilter = {
    "Insurance": undefined,
    "Specialty": undefined,
    "Serves": undefined,
    "telehealth": undefined,
    "new-client": undefined,
    "Which_cate": undefined,
    "Areas_Serv": undefined,
    "Practice_a": undefined
}

const assignSelectToFilterObject = (id, value, filterObject) => {
    if (value) {
        filterObject[id] = value;
    } else {
        filterObject[id] = undefined;
    }
    return filterObject[id];
}

// maybe set active layer to feed into filterLayersArray
// function instead of Object.values(activeLayer._layers)
const setActiveLayer = (map) => {
    mapContainer = [];
    map.eachLayer((layer) => {
        if (layer.data) {}
    })

}

const filteredLayersArray = (allLayers, filterArr, id) => allLayers.filter(layer => {
    if (!layer.data) { // if there's no data, false
        return false
    } else { // if there IS data
        // console.log(layer);

        const currentLayer = layer.data[id]; // current layer in json_group
        // currentLayerArr are target attributes from map (insurance, categories, etc.)
        // console.log(layer);
        
        const currentLayerArr = currentLayer.split(',') // convert comma separated string to arr
        const intersectionFilter = checkFilterPresence(currentLayerArr, filterArr)
        if (intersectionFilter) {
            if (intersectionFilter.length === 0 || !intersectionFilter.length) {

            }
            return intersectionFilter.length > 0 // return if there are more than 0 results
        }
        activeLayer = selection_group;
    }
});

// compare arrays and check for matching attributes
const checkFilterPresence = (currentLayerArr, filterArr) => {
    const matchingPoints = [];
    if (currentLayerArr.length > 0 && filterArr) {
        try {
            for (let item of currentLayerArr) {
                if (filterArr.includes(item.toLowerCase().replace(/\s/g, ''))) {
                    matchingPoints.push(item);
                }
            }
        } catch (error) {
            console.error(error);
        }
        return matchingPoints;
    }
}

const checkIfAndFilterEmpty = async (andFilter, id) => {
    // return true if we only perform or logic; false if we perform and logic
    const andFilterTruthArr = Object.keys(andFilter).map(key => {
        // if (key !== id && andFilter[key] !== undefined && andFilter[key].length > 0) {
        if (key !== id && andFilter[key] !== undefined) {
            return false;
        } else {
            return true;
        }
    });

    const checkTruth = (item) => item === true;
    // if empty return true; if not empty return false
    const andFilterEmpty = await andFilterTruthArr.every(checkTruth);
    return andFilterEmpty;
}

const orFilters = (filterObject) => {
    Object.keys(filterObject).map(async (item) => {
        // perform OR filter
        if (filterObject[item] !== undefined) {
            const filteredLayers = await filteredLayersArray(allLayers, filterObject[item], item);
            // add results to andFilter
            return andFilter[item] = filteredLayers;
        } else {
            andFilter[item] = undefined;
        }
    });
    return andFilter;
}

$(".mpick").change(async function (event) {

    const id = this.id; //id of select box
    const value = $(this).val(); // the selection value

    // check to see if we need to perform AND logic
    const andFilterCheck = await checkIfAndFilterEmpty(andFilter, this.id);
    console.log({isandfilterempty : andFilterCheck});
    // currently selected filters
    const orFilterSelections = await assignSelectToFilterObject(id, value, filterObject);
    console.log(andFilter);

    if (andFilterCheck) { // if true, there are no other filters to compare to; only and filter will be executed

        if (value !== null) {
            const filteredLayers = await filteredLayersArray(allLayers, orFilterSelections, id);
            console.log(filteredLayers);
            
            // add layers to andFilter object
            if (filteredLayers.length === 0) {
                box.show('No data found');
            }
            andFilter[this.id] = filteredLayers; // 
            console.log(filteredLayers);
            // checking to see if we get clusters back
            displayFilteredData(filteredLayers);
            searchByRadiusSize(); // update search results table
        } else {
            // if there are no selections, add the whole json_group back
            map.addLayer(json_group);
            searchByRadiusSize(); // update search results table
        }


    } else { // perform and operation
        // assign or filters to andFilter object
        const orResults = await orFilters(filterObject);
        console.log(orResults);
        const andFilter = (arr1, arr2) => arr1.filter(value => arr2.includes(value));
        const intersectionArray = (andAccumulator) => {
            let accum = undefined;
            for (let i = 0; i < Object.keys(andAccumulator).length; i++) {
                const key = Object.keys(andAccumulator)[i]
                if (andAccumulator[key] !== undefined && andAccumulator[key].length > 0) {
                    accum = accum === undefined ? // if a result of none is found then [] is returned not undefined.
                        andAccumulator[key] :
                        andFilter(accum, andAccumulator[key])
                }
            }
            return accum
        }
        const andResults = intersectionArray(orResults);
        console.log(andResults);
        displayFilteredData(andResults);
        searchByRadiusSize(); // update search results table
    }
});

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

    }) : console.log('no data found');
    map.addLayer(selection_group);
}