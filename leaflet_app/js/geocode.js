
// This uses the ESRI geocoder
function geocodeAddress(address) {

    const url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    const params = 'f=json&sourceCountry=USA&searchExtent=-88.5,33,-79,23.5&outFields=location&SingleLine=';
    const queryString = params + address;
    $.get(url, queryString, function (data) {
        if (data.candidates.length !== 0) {
            // if the is-invalid class is present, remove it
            if ($('#geocoder-input').hasClass('is-invalid')) {
                $('#geocoder-input').removeClass('is-invalid');
                // hide invalide address message
                $('.invalid-feedback').hide();

            }
            const coords = data.candidates[0].location;
            const location = {
                lng: coords.x,
                lat: coords.y
            };
            geocodePlaceMarkersOnMap(location);
        } else {
            // change color of text to bootstrap is-invalid class to show user that their input was invalid
            $('#geocoder-input').addClass("is-invalid");
            // add invalid address message
            $('.invalid-feedback').show();
        }

    });
}