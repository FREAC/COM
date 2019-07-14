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
        if (key === id) {
            // swap array of values into object at this location
            filterObject[key.toString()] = value;
            return filterObject[key];
        }
    }
}

const filteredLayersArray = (activeLayer, filterArr, id) => Object.values(activeLayer).filter(layer => {

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
    console.log({
        selection_group
    });

    map.removeLayer(json_group);


    return selection_group;
}

const checkIfAndFilterEmpty = async (andFilter, id) => {

    const andFilterTruthArr = Object.keys(andFilter).map(key => {
        if (key !== id && andFilter[key].length > 0) {
            return false;
        } else {
            return true;
        }
    });

    const checkTruth = (item) => item === true;
    // if empty return true; if not empty return false
    const andFilterNotEmpty = await andFilterTruthArr.every(checkTruth);
    return andFilterNotEmpty;
}

$(".mpick").change(async function (event) {
    console.log(json_group);

    // console.log('something has been picked ', andFilter['Insurance'])
    const id = this.id;
    const value = $(this).val();

    console.log({
        id,
        value
    });

    // put selections into filterObject
    const targetFilters = await assignSelectToFilterObject(id, value, filterObject);

    const orFilterCheck = await checkIfAndFilterEmpty(andFilter, this.id)

    const filteredLayers = await filteredLayersArray(json_group._layers, targetFilters, id);
    console.log('filtered the FIRST time ', filteredLayers)
    selectionGroup = await addToSelectGroup(filteredLayers);

    // add layers to andFilter object
    andFilter[this.id] = filteredLayers;

    /* 
    let filterObject = { // copied from above
        "Insurance": [],
        "Specialty": [],
        "Serves": [],
        "telehealth": [],
        "new-client": []

    };
    // hold all data from or logic
    const andFilter = { // copied from above
        "Insurance": [],
        "Specialty": [],
        "Serves": [],
        "telehealth": [],
        "new-client": []
    }
    let andAccumulator = { // estimate/example
        "Insurance": undefined,
        "Specialty": undefined,
        "Serves": undefined,
        "telehealth": undefined,
        "new-client": undefined
    }
    const accumulateFilers = (bigData, andFilter, andAccumulator) =>
    {
        for(let i = 0;i < andFilter, i++){
            const key = Object.keys(andFilter[i])
            if(andFilter[key] !== undefined){
                andAccumulator[key] = filterThisStuff(bigData, andFilter[key])
            }
        }
        return andAccumulator
    }
    */

    // var andFilter = (array1, array2) => array1.filter(value.data => array2.includes(value.data))
    // let andAccumulator = {
    //   "Insurance": [1, 2, 3],
    //   "Specialty": [1, 2, 3],
    //   "Serves": [2, 3],
    //   "telehealth": [1, 2, 3],
    //   "new-client": []
    // }

    // const intersectionArray = (andAccumulator) => {
    //   let accum = undefined
    //   for(let i = 0; i < Object.keys(andAccumulator).length; i++){

    //     const key = Object.keys(andAccumulator)[i]
    //     if(andAccumulator[key] !== undefined && andAccumulator[key].length > 0){
    //       accum = accum === undefined ? // if a result of none is found then [] is returned not undefined.
    //           andAccumulator[key] : 
    //           andFilter(accum, andAccumulator[key]) 
    //       }
    //       // console.log({accum})
    //   }
    //   return accum
    // }
    // console.log(intersectionArray(andAccumulator))



    andAccumulator = accumulateFilers(andFilter, andAccumulator)
    if (!orFilterCheck) { // compare selection to what has already been queried
        /*
        const accumulateFilers = (andFilter, andAccumulator) =>
        {
            for(let i = 0;i < andAccumulator, i++){
                const key = Object.keys(andAccumulator[i])
                if(
                    andAccumulator[key]
                ){
                    
                }
            }
            return andAccumulator
        }
        */
        intersectionFilter(andAccumulator, andFilter)
        const filterKeys = Object.keys(filterObject).map(key => {
            console.log(filterObject[key]);
        });

        console.log(filterKeys);




        const filteredLayers = await filteredLayersArray(selection_group._featureGroup._layers, targetFilters, id);
        console.log('filtered the SECOND time ', filteredLayers)
        filteredLayers.map(layer => {
            console.log(layer.data.Agency);

        });

        // add layers to andFilter object
        andFilter[this.id] = filteredLayers;
        console.log({
            andFilter
        });


        selectionGroup = await addToSelectGroup(filteredLayers);
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