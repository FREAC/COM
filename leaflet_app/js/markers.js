// assign opacity (to a marker)
function assignOpacity(num) {
    return num / 100;
}

// This sets the marker styles for any of the circleMarker symbols 
// inserted in setStyle, so any renderer that uses setStyle can use this function
function markerStyle(radius, fillColor, color, weight, fillOpacity) {
    return {
        radius: radius,
        fillColor: fillColor,
        color: color,
        weight: weight,
        fillOpacity: fillOpacity
    };
}

// This loops through the data in our JSON file
// And puts it on the map
function markerLogic(num, targetLayer) {
    const dataLat = num['Latitude'];
    const dataLong = num['Longitude'];

    // set the popup content
    const popup = L.popup()
        .setContent(
            `
        <p><strong>Company Name: </strong> ${num['CompanyNam']}</p>
        <p><strong>Company Link: </strong><a href='https://www.google.com/search?q= + ${num['CountyName']}' target="_blank">${num['CountyName']}</a></p>
        `
        );

    // Add to our marker
    const marker_location = new L.LatLng(dataLat, dataLong);
    const layer_marker = L.circleMarker(marker_location, markerStyle(4, "#ED9118", "#FFFFFF", 1, assignOpacity(num['CountyCode'])))
        .bindPopup(popup);

    // Build the data
    layer_marker.data = {
        'CompanyNam': num['CompanyNam'],
        'CountyName': num['CountyName'],
        'CountyCode': num['CountyCode'],
        'CountyNumb': num['CountyNumb'],
        'ProgramSub': num['ProgramSub']
    };

    // Add events to marker
    layer_marker.on({
        // What happens when mouse hovers markers
        mouseover: function (e) {
            // if the moused over marker is not red, 
            // display the mouseover color change
            if (e.target.options.fillColor !== "#FF0000") { // marker is not already red (clicked)
                const layer_marker = e.target;
                layer_marker.setStyle(markerStyle(4, "#2BBED8", "#2BBED8", 1, 1));
            }

        },
        // What happens when mouse leaves the marker
        mouseout: function (e) {
            // if the marker is not read, change the color back to original marker color
            // otherwise, leave it be
            if (e.target.options.fillColor !== "#FF0000") { // marker is not already red (clicked)
                const layer_marker = e.target;

                const opacityVar = e.target.data.CountyCode;
                layer_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, assignOpacity(opacityVar)));

            }
        },
        // What happens when the marker is clicked
        click: function (e) {
            // if there is no click marker yet, assign one
            if (selection_marker === undefined) {
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(4, "#FF0000", "#FF0000", 1, .8));
            } else { // if there is a click marker already
                // assign old marker back to original color
                selection_marker.setStyle(markerStyle(4, "#ED9118", "#FFFFFF", 1, .8));

                // assign new marker to red
                selection_marker = e.target;
                selection_marker.setStyle(markerStyle(4, "#FF0000", "#FF0000", 1, .8));
            }
            // if a tabulator table is already active
            if ($('#results-table').hasClass('tabulator')) {
                // get the data that is inside of it
                const data = table.getData();
                // loop through data to see if clicked feature matches
                for (let i in data) {
                    // if we find a layer match, select it
                    if (e.target.data.CompanyNam === data[i].name) {
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

    // Close for loop
}