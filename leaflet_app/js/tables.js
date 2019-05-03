// create a reusable Tabulator object
function insertTabulator(data) {
    // insert new dynamic table based on the results of the circle
    table = new Tabulator("#results-table", {
        height: 200, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
        data: data, //assign data to table
        layout: "fitColumns", //fit columns to width of table (optional)
        selectable: 1,
        columns: [
            {
                title: "Provider",
                field: "agency"
            }
        ],
        rowClick: function (e, row) { //trigger a response when the row is clicked

            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const z = map.getZoom();

            // if too far away, zoom in
            if (z < 12) {
                zoomToLocation(lat, lng);
            } else {
                zoomToLocation(lat, lng, z);
            }
        },
    });
}