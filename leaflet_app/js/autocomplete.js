function setAutocomplete(json_data) { // Options for the autocomplete plugin
    const options = {
        // url: "./js/data/group_care.json",
        data: json_data,
        // set multiple fields as searchable values by adding them to properties
        getValue: function (element) {
            return $(element).prop("CompanyNam"); // (how to add more fields)+ "<br>" + $(element).prop("CompleteSt");
        },
        list: {
            match: {
                enabled: true
            },
            onClickEvent: function () {
                // when suggestion clicked, add company name to the search bar
                var newValue = jQuery("#geocoder-input").getSelectedItemData().CompanyNam;
                jQuery("#geocoder-input").val(newValue);
                executeSearchBar();
            },
            onChooseEvent: function () {
                console.log('hi!');

                var newValue = $("#geocoder-input").getSelectedItemData().CompanyNam;

                if (newValue) {
                    console.log('hello my old friend');
                    // $("#geocoder-input").val(newValue).trigger("change");
                    executeSearchBar();

                } else {
                    console.log('no result found');
                    // change color of text to bootstrap is-invalid class to show user that their input was invalid
                    $('#geocoder-input').addClass("invalid-feedback");
                    // add invalid address message
                    $('.invalid-feedback').show();
                }
            }
        }
    };

    //event for when the autocomplete is happening
    $('#geocoder-input').easyAutocomplete(options);
}

// refactor the feature group to make an array of features from the group layer
function configureAutocomplete(featureGroup) {
    let layers = featureGroup._layers;

    const data_group = [];

    for (let point in layers) {
        data_group.push(layers[point].data);

    }

    console.log(data_group);
    setAutocomplete(data_group);
}