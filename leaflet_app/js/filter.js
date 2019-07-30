// this performs dynamic filtering when the user wants to limit their search
// set up event handler to watch when any checkboxes are checked
function filterOptions(filterObject) {
    selection_group.clearLayers()
    //console.log('TOP of FILTER.JS and the json group looks like this ', json_group);
    //for (layer in json_group._map._layers) {
        //console.log('all the data looks like this ',json_group._map._layers[layer].data);
    //}
}
// first get an array ready to hold the filters

async function filterLocations(event) {

    var filter = []
    const restrict2 = $('.mpick')
    num_filters_to_look_at = restrict2.length
    console.log('which have values ', restrict2)
    console.log(' how many args are there ',restrict2.length)
    for (j=0; j<num_filters_to_look_at; j++){
        console.log('restrict2 ',j, ' is ',restrict2[j].name)
    }

    for (j=0; j<num_filters_to_look_at; j++){
        var sv = restrict2[j].name
        //console.log('j ',j, ' name is ',sv)
        var vals = restrict2[j].options
        filter_vals = []
        for (jj=0; jj<vals.length; jj++){
            //console.log('looking at each option, ',jj, vals[jj])
            if (vals[jj].selected) {
                //console.log('for ', sv, ' the selections are ',vals[jj].value)
                if (vals[jj].value === 'not_selected'){
                    // we dont wont this 
                    //restrict2.splice(j,2)
                } else {
                    //filter_vals.push(vals[jj].innerHTML)
                    filter_vals.push(vals[jj].value)
                }
            }
        }
        if (filter_vals.length > 0) {
            filter.push(sv,filter_vals)
        }
    }
    console.log('what does the filter look like ',filter)
        // for each feature in our json
        // map.eachLayer(function(layer){     //iterate over map rather than clusters
        //     if (layer.getChildCount){         // if layer is markerCluster
        //      console.log('here is a cluster count ',layer._childCount);  // return count of points within each cluster
        //      console.log('the cluster has ',layer.getAllChildMarkers())
        //      }
        //    });
    console.log(' what does the empty sel group look like ', selection_group)
    //console.log('JSON group is ',json_group._featureGroup)
    num_filters = ((filter.length / 2)) ;
    console.log('how many types of filters will there be ',num_filters)
    for (layer in json_group._layers) {
        //console.log('before the re-load ',json_group._layers[layer].data);
                    json_group.removeLayer(layer)
    }
    await $.get("./data/COM.json", function (json_data) {
        $.each(json_data, function (object) {
            // console.log(json_data[object]);
            const provider = json_data[object];
            const marker = markerLogic(provider);
            //console.log('######adding a new item to json_group ',marker)
            marker.addTo(json_group);
            json_group.addLayer(marker);
            //selection_group.addLayer(marker)
        });
    });
    // uncomment this if we change the way Accepting New Patients work.  For now it is always being sent over
    // if (num_filters === 0){
    //     num_filters = -2;
    //     for (layer in json_group._layers) {
    //         // console.log('adding this layer',layer)
    //         selection_group.addLayer(json_group._layers[layer])
    //     }
    // }
    for (j=0; j <= num_filters+1; j+=2){
        if (j === 2 && num_filters === 1) {continue}
        console.log("filter number ",j , ' is being processed')
        selection_group.clearLayers()
        filter_is = filter[j]
        console.log('STARTING the LOOP for filter ',j,' - ',filter_is,' has these options ', filter[j+1])
        for (layer in json_group._layers) {
            // current target layer that we're looking at
            const targetLayer = json_group._layers[layer];
            console.log('did we get a NEW target layer ', targetLayer.data)
            var need_it = false;
            var need_it_c = [];
            processing_cluster = false;
            for (m=0; m<filter[j+1].length; m++){
                    try {
                        // be careful not to add the point in twice because it accepts, say, Aetna and Cigna
                        // THis is for single points
                        console.log('going to see if ', filter[j+1][m],' is in this record ',targetLayer.data[filter[j]])
                        recordArr = targetLayer.data[filter[j]].split(",")
                        for (k=0; k<recordArr.length; k++){
                            console.log('testing ', filter[j+1][m],' is == to ',recordArr[k],k)
                            if ( recordArr[k].toLowerCase().replace(/\s/g,'') === filter[j+1][m]) {
                                console.log('m is ',m,' and length is ', filter[j+1].length-1)
                                console.log('--FOUNDfound one but not written yet')
                                if (! need_it ) {
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
                                // we dont need this record 
                            }
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
                                        // need_it_c = false
                                        // json_group._featureGroup.removeLayer(each_layer)
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
                    console.log('must not need this',j)
                    json_group.removeLayer(layer)
                    console.log(' we able to remove this layer ')
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

        console.log('how many records did we save ',selection_group._map)

        console.log('what does the json look like after the filter ', selection_group)
    }
    console.log('end of the filtering')
    await map.removeLayer(json_group);
    await map.removeLayer(json_group_c);
    //selection_group.clearLayers();
    await map.removeLayer(selection_group);
    // Add our selection markers in our JSON file on the map
    console.log('adding the selection group to the map')
    await map.addLayer(selection_group);
    console.log('was able to add selection group to map')
    let i = 0;
    selection_group.eachLayer(function(){ 
        i += 1; 
        console.log('here is each layer', layer.data)
    });
    console.log('Map has', i, 'layers.');
    if (i === 0){
        alert('No agencies meet your criteria')
    }
    // set active layer
    activeLayer = selection_group;
    selection_group.on('clusterclick', function (event) {
        // declare the empty content variable to append to
        let clusterPopupContent = "";
        console.log('starting the cluster click selection_group ',event)
        async function getChildMarkerContent() {
            console.log('ready')
            await $.each(event.layer.getAllChildMarkers(), function (index, value) {
                console.log('looking at each one selection_group ', value)
                // append content 
                // console.log('looping as part of the popup build')
                clusterPopupContent += value._popup._content + '<br><br>';
                return clusterPopupContent
            });
        }
        // get the content of each marker
        getChildMarkerContent().then(
            // assign content to new leaflet popup
            function () {
                // make sure last popup instance is removed
                $('#clusterPopupContent').remove();
                // set content and add to map
                const clusterPopup = L.popup({
                        closeButton: true,
                        maxHeight: 150,
                        maxWidth: 200,
                    })
                    .setLatLng(event.layer.getLatLng())
                    .setContent(clusterPopupContent)
                    .openOn(map);
            });
        // this is here because 2nd - n identifies dont work without it....
        console.log('try to zoom in justq a hair')
        map.zoomIn(.00001)
    });
}