// Options for the autocomplete plugin
const options = {
    url: "./js/data/group_care.json",
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
            var newvalue = jQuery("#geocoder-input").getSelectedItemData().CompanyNam;
            jQuery("#geocoder-input").val(newvalue);
        }
    }
};

//event for when the autocomplete is happening
$('#geocoder-input').easyAutocomplete(options);