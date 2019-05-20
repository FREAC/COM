const geocoderInput = document.getElementById('geocoder-input-test');
const geocoderSelect = document.getElementById('geocoder-select');


$('#geocoder-input-test').keyup(function (e) {

    console.log(geocoderInput.value);
    if (geocoderInput.value.length() > 0) {
        // call esri suggestion

    }

});