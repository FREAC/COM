// This uses the ESRI geocoder
function geocodeAddress(address) {

    const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    const params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    const queryString = params + address;
    $.get(url, queryString, function (data) {
        if (data.candidates.length !== 0) {
            // results were found!
            isNotInvalid();

            // pick the top candidate of the geocode match
            const coords = data.candidates[0].location;
            const location = {
                lng: coords.x,
                lat: coords.y
            };
            geocodePlaceMarkersOnMap(location);
        } else {
            // set invalid classes
            isInvalid();
        }

    });
}