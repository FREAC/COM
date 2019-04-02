// create locate control object
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
    drawMarker: false
});

// when location is found, zoom to the location
function locateZoom(event) {
    // start the locate control
    locate.start();

    // set location of the locate function
    const location = {
        lng: event.longitude,
        lat: event.latitude
    };

    // get current zoom level
    const z = map.getZoom();
    if (z < 10) {
        // geocode, draw circle, and find points within circle at default zoom
        geocodePlaceMarkersOnMap(location);
    } else {
        // geocode, draw circle, and find points within circle at current zoom
        geocodePlaceMarkersOnMap(location, z);
    }

    locate.stop();
    $('.leaflet-control-locate').addClass("active following")

}