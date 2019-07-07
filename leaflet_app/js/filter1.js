// create filter object to hold all selected elements based on type
let filterObject = {
    "Insurance": undefined,
    "Specialty": undefined,
    "Serves": undefined,
    "telehealth": undefined,
    "new-client": undefined

};

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



$(".mpick").change(function (event) {
    const id = this.id;
    const value = $(this).val();



    const targetFilters = assignSelectToFilterObject(id, value, filterObject);



    // const targetAttribute = grabTargetFilter(filterObject, id, value);
    // console.log(targetAttribute);


});

// on change, print out this and value
// TODO: add selected values to corresponding key:value pairs in filterObject
// $(".mpick").change(function (event) {
//     const value = $(this).val();
//     const typeofValue = typeof (value);
//     const id = $(this).context.id;
//     const name = $(this).context.name;
//     const parent = this.parentElement


//     console.log({
//         "value": value,
//         "this": $(this),
//         "id": id,
//         "typeofvalue": typeofValue,
//         "name": name,
//         "thisnojquery": this,
//         "parent": parent
//     });

//     // find the corresponding id within the filter object
//     for (const key in filterObject) {
//         // if the id of the select and the key of the filter object match
//         if (key === id) {
//             // swap array of values into object at this location
//             filterObject[key.toString()] = value;
//             console.log(value);

//         }
//     }

//     console.log(filterObject);


//     // find objects that contain a matching attribute

//     filterOptions(filterObject, id);

//     // execute filter in leaflet - must expand on this


// });



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

                return intersectionFilter.length > 0 // return if there are more than 0 results
            }
        });

        console.log({
            filteredLayersArray
        });

        return filteredLayersArray;

        // displayFilteredData(filteredLayersArray);
    } else {

        return [];
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