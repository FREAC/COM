// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked
function filterOptions(filterObject) {

    console.log('TOP of FILTER.JS and the json group looks like this ', json_group);


    for (layer in json_group._map._layers) {
        //console.log('all the data looks like this ',json_group._map._layers[layer].data);
    }

}



// first get an array ready to hold the filters

async function filterLocations(event) {
    var filter = []
    var restrict2 = undefined
    //console.log('lets see filter now ',filter)
    var restrict2 = $('.mpick')
    console.log('which have values ', restrict2)
    for (j=0; j<restrict2.length; j++){
        var sv = restrict2[j].name
        console.log('j ',j, ' name is ',sv)
        var vals = restrict2[j].options
        filter_vals = []
        for (jj=0; jj<vals.length; jj++){
            console.log('looking at each option, ',jj, vals[jj])
            if (vals[jj].selected) {
                console.log('for ', sv, ' the selections are ',vals[jj].innerHTML)
                if (vals[jj].innerHTML === 'not_selected'){
                    // we dont wont this 
                    console.log('skipping this dummy value ', vals[jj])
                    restrict2.splice(j,2)
                } else {
                    filter_vals.push(vals[jj].innerHTML)

                }
            }
        }
        if (filter_vals.length > 0) {
            filter.push(sv,filter_vals)
        }
    }
    console.log('what does the filter look like ',filter)
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
    
    // const selection_group = new L.markerClusterGroup({
    //     maxClusterRadius: 0,
    //     iconCreateFunction: function (cluster) {
    //         return L.divIcon({
    //             html: '<b>' + cluster.getChildCount() + '</b>',
    //             className: 'clustered_sites',
    //             iconSize: L.point(15, 15)
    //         });
    
    //     }
    // });
    console.log(' what does the empty sel group look like ', selection_group)
    //var all_layers = json_group._featureGroup._layers
    // for (junk in all_layers){
    //     console.log(' layer is ',junk)
    // }

    // console.log('BEFORE ANYTHING starts and the all layers looks like ', all_layers)
    //console.log('JSON group is ',json_group._featureGroup)
    num_filters = ((filter.length / 2)) ;
    console.log('how many types of filters will there be ',num_filters)
    for (j=0; j <= num_filters+2; j+=2){
        if (j === 2 && num_filters === 1) {continue}
        console.log("filter number ",j , ' is being processed')
        selection_group.clearLayers()
        filter_is = filter[j]
        console.log('STARTING the LOOP for filter ',j,' - ',filter_is,' has these options ', filter[j+1])
        for (layer in json_group._layers) {
            // current target layer that we're looking at
            const targetLayer = json_group._layers[layer];
            console.log('did we get a NEW target layer ', targetLayer.data)
            //console.log('how many did the user pick')
            var need_it = false;
            var need_it_c = [];
            processing_cluster = false;
            for (m=0; m<filter[j+1].length; m++){
                    try {
                        // be careful not to add the point in twice because it accepts, say, Aetna and Cigna
                        // THis is for single points
                        console.log('going to see if ', filter[j+1][m],' is in this record ',targetLayer.data[filter[j]])
                        if ( (targetLayer.data[filter[j]]).includes(filter[j+1][m])) {
                            console.log('m is ',m,' and length is ', filter[j+1].length-1)
                            console.log('--FOUNDfound one but not written yet')
                            if (! need_it ) {
                                // if (j > 0 ) {
                                //     need_it = true;
                                //     console.log('we need this one but its already saved')
                                //     continue
                                // } 
                                console.log('FOUND ONE THAT WE NEED ',targetLayer.data['Agency'])
                                //console.log('make the marker now ', targetLayer.data)
                                targetLayer.data['Latitude'] = targetLayer._latlng.lat;
                                targetLayer.data['Longitude'] = targetLayer._latlng.lng;
                                targetLayer.data['Agency'] = targetLayer.data.Agency;
                                const marker =  markerLogic(targetLayer.data);
                                marker.addTo(selection_group);
                                need_it = true;
                                //marker.addTo(json_group);
                                //json_group.addLayer(marker);
                                continue
                            }
                        } else {
                            // we dont need this record but only throw it out if this is the second or higher
                            // if (j>0){
                            //     need_it = false
                            //     console.log(' on the 2nd or higher filter and we dont need this ',selection_group)
                            //     //json_group._featureGroup.removeLayer(layer)
                            //     //selection_group.removeLayer(layer)
                            //     console.log('removed after on the 2nd or hihger')
                            //     continue
                            // }
                        }
                    } catch {
                        // Gets in here if the thing we are looking at is a cluster rather than a single point
                        processing_cluster = true
                        const num_in_cluster = targetLayer._childCount
                        console.log('----Found a cluster with ', num_in_cluster,' pieces')
                        each_layer = targetLayer.getAllChildMarkers()
                        console.log('here should be the whole cluster ',each_layer)
                        for(i=0; i<num_in_cluster; i++){
                            console.log('----here is the clustered agency ',i,' ',each_layer[i].data.Insurance, ' | ', 
                                each_layer[i].data.Agency, each_layer[i].data,' || ',filter[j+1][m],'||')

                                if ( (each_layer[i].data[filter[j]]).includes(filter[j+1][m])) {
                                    console.log('CLUSTER----FOUND ONE THAT WE NEED not yet written',
                                    each_layer[i].data['Agency'], ' looking for ', filter[j+1][m])
                                    if (! need_it_c[i] ) {
                                        // if (j > 0 ) {
                                        //     need_it_c = true;
                                        //     console.log('we need this one but its already saved')
                                        //     continue
                                        // } 
                                        each_layer[i].data['Latitude'] =  each_layer[i]._latlng.lat;
                                        each_layer[i].data['Longitude'] = each_layer[i]._latlng.lng;
                                        each_layer[i].data['Agency'] =    each_layer[i].data.Agency;
                                        const marker =  markerLogic(each_layer[i].data);
                                        marker.addTo(selection_group);
                                        need_it_c[i] = true;
                                        console.log('adding ',each_layer[i].data.Agency,' to the json group -- need_it_c element ',i, ' set to true')
                                        //marker.addTo(json_group);
                                        //json_group.addLayer(marker);
                                        continue
                                    }
                                } else {
                                    // This member of the cluster is not needed so it need dropping --SO FAR--
                                    console.log('dont need SO FAR ',filter[j+1][m], 'setting need_it_c to false')
                                    if (need_it_c[i]) {
                                        // dont do anything
                                    } else {
                                        need_it_c[i] = false
                                    }
                                    //if (j>0){
                                        // console.log('we dont need this one from the cluster ')
                                        // need_it_c = false
                                        // json_group._featureGroup.removeLayer(each_layer)
                                        // console.log('could we remove the one layer from the cluster???')
                                    //}
                                } // end of looking at one piece of a cluster

                        } // end of loop looking at pieces of a cluster
                    }
            } // end of loop looking at different selected filter values
            console.log('finished with this record')
            if (processing_cluster) {
                        console.log('what is the target layer ', targetLayer)
                        console.log('how many in this cluster ', need_it_c.length)
                        console.log('do we still have a targetLayer ', targetLayer)
                        needed_at_least_one = false;
                        for (q=0; q < need_it_c.length; q++) {
                                console.log('cluster piece ', q, 'each_layer[q] data ', each_layer[q].data)
                                if (! need_it_c[q]) {
                                    each_layer[q].removeLayer
                                    //layer.removeLayer(q)
                                    //json_group._featureGroup._targetLayer.removeLayer(q)
                                    console.log(' just removed from a cluster piece ',q)
                                } else {
                                    needed_at_least_one = true;
                                }
                        }
                        console.log('MMMMMMMMMMMMMMMM ',json_group._featureGroup);
                        console.log('now that we are through deleting cluster pieces, lets see if there is anything left ', targetLayer._childCount )
                        if (needed_at_least_one){
                            console.log(' needed at least one ')
                        } else {
                            console.log('did not need any piece so delete the whole thing ')
                        json_group._featureGroup.removeLayer(layer)                            
                        }
            } else {
                // processing a regular layer
                //console.log('MMMMMMMMMMMMMMMM SINGLE---',json_group._featureGroup._layers(layer));

                if (!need_it){
                    // if(need_it_c) {continue}
                    console.log('must not need this',j)
                    // if (j===0) {
                        //console.log(' just removed ', json_group._featureGroup._layers[layer].data)
                        // json_group._featureGroup._layers[layer].removeLayer
                        json_group.removeLayer(layer)
                        console.log(' we able to remove this layer ')
                    // }
                } else {console.log('need it is ',need_it)}
            }   
            console.log('end of the m loop')
        } // end of the filters
        console.log('FINISHED LOOPING FOR FILTER ', filter[j])
        console.log('resetting selection group to blank ', j, num_filters)
        if (j === num_filters) { 
            // dont reset
        } else {
            const selection_group = undefined
            console.log('RESET selection group ')
            // const selection_group = new L.markerClusterGroup({
            //     maxClusterRadius: 0,
            //     iconCreateFunction: function (cluster) {
            //         return L.divIcon({
            //             html: '<b>' + cluster.getChildCount() + '</b>',
            //             className: 'clustered_sites',
            //             iconSize: L.point(15, 15)
            //         });
        
            //     }
            // });
            
        }
        // we now have filtered all data by the given filter.  We need to set the next filter
        // to only work with the remaining records
        console.log('how many records did we save ',selection_group.length)
        console.log('what does the json look like after the filter ', selection_group)
        // regenerate the json group so we can start the loop over again with the same structure
        //map.addLayer(selection_group);
        // all_layers = selection_group._featureGroup._layers
        // console.log('did we get passed the group thing ',all_layers)
        // for (junk in all_layers){
        //     console.log(' layer is ',junk)
        // }
        // all_layers = selection_group._layers
    }
    console.log('end of the filtering')
    await map.removeLayer(json_group);
    //selection_group.clearLayers();
    await map.removeLayer(selection_group);
    // Add our selection markers in our JSON file on the map
    console.log('adding the selection group to the map')
    map.addLayer(selection_group);
    // map.addLayer(json_group)

    // configureAutocomplete(selection_group);

    // set active layer
    activeLayer = selection_group;
}