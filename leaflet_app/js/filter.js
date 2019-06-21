// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked
function filterOptions(filterObject) {

    console.log(json_group);


    for (layer in json_group._map._layers) {
        console.log(json_group._map._layers[layer].data);
    }

}



// first get an array ready to hold the filters

async function filterLocations(event) {
    var filter = []
    var restrict2 = undefined
    // console.log('lets see filter now ',filter)
    var restrict2 = $('.mpick')
    // console.log('which have values ', restrict2)
    for (j=0; j<restrict2.length; j++){
        var sv = restrict2[j].name
        // console.log('j ',j, ' name is ',sv)
        var vals = restrict2[j].options
        filter_vals = []
        for (jj=0; jj<vals.length-1; jj++){
            //console.log('looking at each option, ',jj, vals[jj])
            if (vals[jj].selected) {
                console.log('for ', sv, ' the selections are ',vals[jj].innerHTML)
                filter_vals.push(vals[jj].innerHTML)
            }
        }
        if (filter_vals.length > 0) {
            filter.push(sv,filter_vals)
        }
    }
    // console.log('what does the filter look like ',filter)
    // now we need to look through the filter options and reset the json
    // num_filters = (filter.length / 2) ;
    // console.log('number of filters to process ', num_filters)
    // for (j=0; j <= num_filters; j+=2){
    //     console.log('filter ',j,' - ',filter[j],' has these options ', filter[j+1])
    // }

    // console.log('starting to filter locations')
    // // first we need to get all the filters
    // var insurance = $('.insurance').val()
    // console.log('what did we get for insurance ',insurance)
    // var pcat = $('.pcat').val()
    // console.log('what did we get for pcat ', pcat)
    // var clients = $('.clients').val()
    // console.log('what did we get for clients ',clients)
    // var telehealth = $('.telehealth').val()
    // console.log('what did we get for telehealth ',telehealth)
    // var newpatients = $('.newpatients').val()
    // console.log('what did we get for new patients ',newpatients)
    // // assign button ids to variables
    // const acceptMedicare = $('#medicare');
    // const acceptInsurance = $('#insurance');

    // set up cases for checkbox combinations
    // if ((acceptMedicare[0].checked === true) && (acceptInsurance[0].checked === true)) {
        //  await map.removeLayer(json_group);
        //  selection_group.clearLayers();
        //  await map.removeLayer(selection_group);

        // for each feature in our json
        // map.eachLayer(function(layer){     //iterate over map rather than clusters
        //     if (layer.getChildCount){         // if layer is markerCluster
        //      console.log('here is a cluster count ',layer._childCount);  // return count of points within each cluster
        //      console.log('the cluster has ',layer.getAllChildMarkers())
        //      }
        //    });
    var all_layers = json_group._featureGroup._layers
    num_filters = (filter.length / 2) ;
    for (j=0; j <= num_filters; j+=2){
        filter_is = filter[j]
        console.log('STARTING the LOOP for filter ',j,' - ',filter_is,' has these options ', filter[j+1])
        for (layer in all_layers) {
            // current target layer that we're looking at
            const targetLayer = json_group._featureGroup._layers[layer];
            //console.log('did we get the target layer ', targetLayer.data)
            //console.log('how many did the user pick')
            for (m=0; m<filter[j+1].length; m++){
                    try {
                        // THis is for single points
                        //console.log('going to see if ', filter[j+1][m],' is in this record ',targetLayer.data[filter[j]])
                        if ( (targetLayer.data[filter[j]]).includes(filter[j+1][m])) {
                            console.log('FOUND ONE THAT WE NEED ',targetLayer.data[filter[j]])
                            //console.log('make the marker now ', targetLayer.data)
                            targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                            targetLayer.data['Longitude'] = targetLayer._latlng.lng;
                            targetLayer.data['Agency'] = targetLayer.data.Agency;
                            const marker = markerLogic(targetLayer.data);
                            marker.addTo(selection_group);
                        } else {
                            // Need to drop this record because we do NOT need it
                        }
                    }catch {
                        // Gets in here if the thing we are looking at is a cluster rather than a single point
                        const num_in_cluster = targetLayer._childCount
                        console.log('----Found a cluster with ', num_in_cluster,' pieces')
                        each_layer = targetLayer.getAllChildMarkers()
                        console.log('here should be the whole cluster ',each_layer)
                        for(i=0; i<num_in_cluster; i++){
                            console.log('----here is the clustered agency ',i,' ',each_layer[i].data.Insurance, ' | ', 
                                each_layer[i].data.Agency, each_layer[i].data)
                            if ( (each_layer[i].data[filter[j]]).includes(filter[j+1][m])) {
                                console.log('CLUSTER----FOUND ONE THAT WE NEED ',each_layer[i].data[filter[j]])
                                each_layer[i].data['Latitude'] =  each_layer[i]._latlng.lat;
                                each_layer[i].data['Longitude'] = each_layer[i]._latlng.lng;
                                each_layer[i].data['Agency'] =    each_layer[i].data.Agency;
                                const marker =  markerLogic(each_layer[i].data);
                                marker.addTo(selection_group);
                            } else {
                                // This member of the cluster is not needed so it need dropping
                            }
                        }
                    }
            }
        }
        console.log('FINISHED LOOPING FOR FILTER ', filter[j])
        // we now have filtered all data by the given filter.  We need to set the next filter
        // to only work with the remaining records
        all_layers = selection_group._layers
    }
    await map.removeLayer(json_group);
    //selection_group.clearLayers();
    await map.removeLayer(selection_group);
    // Add our selection markers in our JSON file on the map
    map.addLayer(selection_group);

    // configureAutocomplete(selection_group);

    // set active layer
    activeLayer = selection_group;
}