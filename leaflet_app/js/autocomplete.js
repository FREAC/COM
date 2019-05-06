function setAutocomplete(json_data) { // Options for the autocomplete plugin
    const options = {
        // url: "./js/data/group_care.json",
        data: json_data,
        // set multiple fields as searchable values by adding them to properties
        getValue: function (element) {
            return $(element).prop("Agency"); // (how to add more fields)+ "<br>" + $(element).prop("CompleteSt");
        },
        list: {
            match: {
                enabled: true
            },
            onClickEvent: function () {
                // when suggestion clicked, add company name to the search bar
                var newValue = jQuery("#geocoder-input").getSelectedItemData().Agency;
                jQuery("#geocoder-input").val(newValue);
                executeSearchBar();
            },
            onChooseEvent: function () {
                var newValue = $("#geocoder-input").getSelectedItemData().Agency;

                if (newValue) {
                    // results were found!
                    isNotInvalid();

                    // $("#geocoder-input").val(newValue).trigger("change");
                    executeSearchBar();

                } else {
                    // results were not found
                    isInvalid();
                }
            }
        }
    };

    // event for when the autocomplete is happening
    $('#geocoder-input').easyAutocomplete(options);
}

// refactor the feature group to make an array of features from the group layer
function configureAutocomplete(featureGroup) {
    // get into "layers" (features object)
    let layers = featureGroup._layers;

    const data_group = [];

    for (let point in layers) {
        // push each point data (location) to data group array
        data_group.push(layers[point].data);
    }

    // run the autocomplete on this group
    setAutocomplete(data_group);
}