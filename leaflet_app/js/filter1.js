// create filter object to hold all selected elements based on type
let filterObject = {
    "Insurance": [],
    "Specialty": [],
    "Serves": [],
    "telehealth": [],
    "new-client": []

};
// hold all data from or logic
const andFilter = {
    "Insurance": [],
    "Specialty": [],
    "Serves": [],
    "telehealth": [],
    "new-client": []
}

const assignSelectToFilterObject = (id, value, filterObject) => {
    for (let key in filterObject) {
        // if the id of the select and the key of the filter object match
        console.log((filterObject[key]));

        if (key === id) {
            // swap array of values into object at this location
            filterObject[key.toString()] = value;
            return filterObject[key];
        }
    }
}

const filteredLayersArray = (activeLayer, filterArr, id) => Object.values(activeLayer._map._layers).filter(layer => {
    if (!layer.data) {
        return false
    } else {
        const currentLayer = layer.data[id]; // current layer in json_group
        // currentLayerArr are target attributes from map (insurance, categories, etc.)
        const currentLayerArr = currentLayer.split(',') // convert comma separated string to arr
        const intersectionFilter = checkFilterPresence(currentLayerArr, filterArr)
        if (intersectionFilter) {
            return intersectionFilter.length > 0 // return if there are more than 0 results
        }
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

function displayFilteredData(layers) {
    // remove current map layers
    map.removeLayer(json_group);
    map.removeLayer(selection_group);
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

const addToSelectGroup = (layers) => {
    selection_group.clearLayers();
    // are there layers? If yes, assign Lat and Long
    layers ? layers.map((layer) => {
        // assign Latitude and Longitude to data
        layer.data['Latitude'] = layer._latlng.lat;
        layer.data['Longitude'] = layer._latlng.lng;

        const data = layer.data;
        const marker = markerLogic(data);
        marker.addTo(selection_group);

    }) : console.log('nothing found');

    return selection_group;
}

const checkIfAndFilterEmpty = (andFilter) => {

    for (var key in andFilter) {
        if (selection_group._layers.hasOwnProperty(key)) // is not empty
            return false;
    }
    return true; // is empty
}

$(".mpick").change(async function (event) {
    const id = this.id;
    const value = $(this).val();

    // true if empty; false if not empty
    const selectionCheck = checkIfAndFilterEmpty(andFilter);
    console.log(selectionCheck);




    const targetFilters = await assignSelectToFilterObject(id, value, filterObject);
    console.log({
        targetFilters
    });

    const filteredLayers = await filteredLayersArray(json_group, targetFilters, id);
    console.log({
        filteredLayers
    });

    const selectionGroup = await addToSelectGroup(filteredLayers);

    // add layers to andFilter object
    // andFilter[id] = filteredLayers;

    console.log({
        selection_group
    });

    // const andFilterLayers = andLogic(andFilter);
});


// // this performs dynamic filtering when the user wants to limit their search
// function filterOptions(filterObject, key) {
//     // array of options we are wanting to find in the json_group data
//     const filterArr = filterObject[key];

//     // check to see whether there are checked selections
//     const isChecked = (filterObject, key, filterArr) => filterObject[key] && filterArr.length > 0 && filterArr !== null

//     // compare arrays and check for matching attributes
//     const checkFilterPresence = (currentLayerArr) => {
//         const matchingPoints = [];
//         if (currentLayerArr.length > 0) {
//             for (let item of currentLayerArr) {
//                 if (filterArr.includes(item.toLowerCase().replace(/\s/g, ''))) {
//                     matchingPoints.push(item);
//                 }
//             }
//             return matchingPoints;
//         }
//     }

//     if (isChecked(filterObject, key, filterArr)) {

//         map.addLayer(json_group);
//         activeLayer = json_group;

//         const filteredLayersArray = Object.values(activeLayer._map._layers).filter(layer => {
//             if (!layer.data) {
//                 return false
//             } else {

//                 const currentLayer = layer.data[key]; // current layer in json_group
//                 console.log(currentLayer);

//                 // currentLayerArr are target attributes from map (insurance, categories, etc.)
//                 const currentLayerArr = currentLayer.split(',') // convert comma separated string to arr
//                 const intersectionFilter = checkFilterPresence(currentLayerArr)

//                 return intersectionFilter.length > 0 // return if there are more than 0 results
//             }
//         });

//         console.log({
//             filteredLayersArray
//         });

//         return filteredLayersArray;

//         // displayFilteredData(filteredLayersArray);
//     } else {

//         // return [];
//         // re-insert (original) json_group
//         map.removeLayer(selection_group);
//         map.addLayer(json_group);
//         activeLayer = json_group;
//     }
// }

// function displayFilteredData(layers) {
//     // remove current map layers
//     map.removeLayer(json_group);
//     selection_group.clearLayers();
//     // for each object in the subset

//     // are there layers? If yes, assign Lat and Long
//     layers ? layers.map((layer) => {
//         // assign Latitude and Longitude to data
//         layer.data['Latitude'] = layer._latlng.lat;
//         layer.data['Longitude'] = layer._latlng.lng;

//         const data = layer.data;
//         const marker = markerLogic(data);
//         marker.addTo(selection_group);

//     }) : console.log('nothing found');

//     map.addLayer(selection_group);
//     activeLayer = selection_group;

// }