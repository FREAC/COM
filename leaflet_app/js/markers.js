// This sets the marker styles for any of the circleMarker symbols 
// inserted in setStyle, so any renderer that uses setStyle can use this function
function markerStyle(fillColor, color, fillOpacity=1, radius=4, weight=1) {
    return {
        fillColor: fillColor,
        color: color,
        fillOpacity: fillOpacity,
        radius: radius,
        weight: weight
    };
}

// This loops through the data in our JSON file
// And puts it on the map
function markerLogic(num, targetLayer) {

    const fill_color = "#ED9118";
    const outline_color = "#FFFFFF";
    const hover_color = "#2BBED8";
    const selected_color = "#FF0000";

    const dataLat = num['Latitude'];
    const dataLong = num['Longitude'];

    const html = `<b>${num['Agency']}</b><br>
                    ${num['HouseNumber']} ${num['Street']} ${num['Unit']}<br>
                    ${num['City']}, ${['State']} ${num['PostalCode']}`;
    
    const popup = L.popup({closeButton: false}).setContent(html);

    // Add to our marker
    const marker_location = new L.LatLng(dataLat, dataLong);
    const layer_marker = L.circleMarker(marker_location, markerStyle(fill_color, outline_color))
        .bindPopup(popup);

    // Build the data
    layer_marker.data = {
        'Agency': num['Agency']
    };

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function (e) {
            // if the moused over marker is not red, 
            // display the mouseover color change
            if (e.target.options.fillColor !== selected_color) { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(hover_color, hover_color));
            }
        },
        // What happens when mouse leaves the marker
        mouseout: function (e) {
            // if the marker is not read, change the color back to original marker color
            // otherwise, leave it be
            if (e.target.options.fillColor !== selected_color) { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(fill_color, outline_color));
            }
        },
        // What happens when the marker is clicked
        click: function (e) {
            // if there is no click marker yet, assign one
            if (selection_marker === undefined) {
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, .8));
            } else { // if there is a click marker already
                // assign old marker back to original color
                selection_marker.setStyle(markerStyle(fill_color, outline_color, .8));

                // assign new marker to red
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, .8));
            }
            // if a tabulator table is already active
            if ($('#results-table').hasClass('tabulator')) {
                // get the data that is inside of it
                const data = table.getData();
                // loop through data to see if clicked feature matches
                for (let i in data) {
                    // if we find a layer match, select it
                    if (e.target.data.Agency === data[i].agency) {
                        // deselect previous row selection
                        table.deselectRow();
                        // select new row selection
                        table.selectRow(i);
                    }
                }
            }
        }
    });
    // add the marker onto the targetLayer
    targetLayer.addLayer(layer_marker);
}