// create a reusable Tabulator object
function insertTabulator(data) {
    // insert new dynamic table based on the results of the circle
    table = new Tabulator("#results-table", {
        height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: data, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        selectable: 1,
        columns: [ //Define Table Columns
            {
                title: "Name",
                field: "name",
            }, {
                title: "Distance (miles)",
                field: "distance",
            }, {
                title: "Link",
                field: "link",
                formatter: "link",
                formatterParams: {
                    labelField: "link",
                    urlPrefix: "https://www.google.com/search?q=",
                    target: "_blank",
                }
            }
        ],
        rowClick: function (e, row) { //trigger a response when the row is clicked
            // identify lat and lng
            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const z = map.getZoom();

            // if too far away, zoom in
            if (z < 12) {
                zoomToLocation(lat, lng);
                // if close enough, don't zoom in
            } else {
                zoomToLocation(lat, lng, z);
            }
        },
    });
}