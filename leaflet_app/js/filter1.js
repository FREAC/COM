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

const filteredLayersArray = (activeLayer, filterArr, id) => Object.values(activeLayer._featureGroup._layers).filter(layer => {

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
// const filteredLayersArray2 = (activeLayer, filterArr, id) => Object.values(activeLayer).filter(layer => {
//     console.log('start of the filteredlayersarray2 routine ', layer)
//     if (!layer.data) {
//         return false
//     } else {
//         const currentLayer = layer.data[id]; // current layer in json_group
//         console.log('currentlayer set to ', currentLayer)
//         // currentLayerArr are target attributes from map (insurance, categories, etc.)
//         const intersectionFilter = checkFilterPresence(currentLayerArr, filterArr)
//         const currentLayerArr = currentLayer.split(',') // convert comma separated string to arr
//         if (intersectionFilter) {
//             return intersectionFilter.length > 0 // return if there are more than 0 results
//         }
//     }
// });
// compare arrays and check for matching attributes
const checkFilterPresence = (currentLayerArr, filterArr) => {
    const matchingPoints = [];
    // console.log('whats in filterrr ', filterArr)
    if (currentLayerArr.length > 0 && filterArr) {
        try {
            for (let item of currentLayerArr) {
                if (filterArr.includes(item.toLowerCase().replace(/\s/g, ''))) {
                    // console.log('FOUND one to keep ', item)
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
    // selection_group.clearLayers();

    // are there layers? If yes, assign Lat and Long
    layers ? layers.map((layer) => {
        console.log({
            layer
        });

        // assign Latitude and Longitude to data
        layer.data['Latitude'] = layer._latlng.lat;
        layer.data['Longitude'] = layer._latlng.lng;

        const data = layer.data;
        const marker = markerLogic(data);

        marker.addTo(selection_group);

    }) : console.log('nothing found');
    console.log({
        selection_group
    });

    map.removeLayer(json_group);


    return selection_group;
}

const checkIfAndFilterNotEmpty = (andFilter, id) => {

    const andFilterTruthArr = Object.keys(andFilter).map(key => {
        if (key !== id && andFilter[key].length > 0) {
            return false;
        } else {
            return true;
        }
    });
    // if empty return true; if not empty return false
    andFilterNotEmpty = andFilterTruthArr.every(element => {
        element === true;
    });

    console.log({
        andFilterTruthArr,
        andFilterNotEmpty
    });

    return andFilterNotEmpty;
}

$(".mpick").change(async function (event) {
    console.log(json_group);

    // console.log('something has been picked ', andFilter['Insurance'])
    const id = this.id;
    const value = $(this).val();


    // put selections into filterObject
    const targetFilters = await assignSelectToFilterObject(id, value, filterObject);

    const andFilterCheck = checkIfAndFilterNotEmpty(andFilter, this.id);
    console.log('what is the and filter checked ', andFilterCheck);

    if (andFilterCheck === false) { // there are no other filters to compare to
        // let selectionGroup;
        // console.log('fresh query and unfiltered json_group looks like this ', json_group)
        const filteredLayers = await filteredLayersArray(json_group, targetFilters, id);
        console.log('filtered the FIRST time ', filteredLayers)
        selectionGroup = await addToSelectGroup(filteredLayers);
        console.log(selectionGroup);


        // add layers to andFilter object
        andFilter[this.id] = filteredLayers;

    } else { // compare selection to what has already been queried
        // console.log('new thing being selected -- selection group looks like this ', selection_group)
        // const filteredLayers = await filteredLayersArray2(selection_group, targetFilters, id);
        console.log({
            msg: "andfilter check was false",
            andFilterCheck
        });

        const filteredLayers = await filteredLayersArray(selection_group, targetFilters, id);
        console.log('filtered the SECOND time ', filteredLayers)
        filteredLayers.map(layer => {
            console.log(layer.data.Agency);

        });

        selectionGroup = await addToSelectGroup(filteredLayers);

        // add layers to andFilter object
        andFilter[this.id] = filteredLayers;


    }

    // console.log({
    //     selectionGroup
    // });

    console.log({
        selection_group
    });

    //const andFilterLayers = andLogic(andFilter);
});


// this performs dynamic filtering when the user wants to limit their search
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