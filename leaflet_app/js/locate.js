// Add locate functionality
const locate = L.control.locate({
    strings: {
        title: "Location"
    },
    clickBehavior: {
        inView: 'stop',
        outOfView: 'setView',
        inViewNotFollowing: 'inView'
    },
    drawCircle: false,
    markerStyle: markerStyle(4, "#2BBED8", "#2BBED8", 1, 1)
}).addTo(map);

map.on('locationfound', function (e) {
    console.log(e);
})