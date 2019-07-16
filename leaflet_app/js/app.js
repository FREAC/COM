'use strict';

// Colors
const default_fill_color = "#ED9118";
const default_outline_color = "#FFFFFF";
const selected_color = "#2BBED8";
const selected_fill_opacity = 1;
$(function () {
    $('.mpick').fSelect();
});
$('input[name="insurance"]').amsifySuggestags({
    suggestions: ['Aetna', 'Beacon', 'Beech Street', 'Cigna', 'Coventry', 'First Health', 'Healthy Kids',
        'Magellan', 'Medicare'
    ],
    whiteList: true
});
// $(function(){
// 	$(".mselect").multiselect();
// });
// TODO: Can this be dealt with using Bootstrap components?
$(document).ready(function () {
    $('.geocoder-control').click(function () {
        $("#map").css("width", "100%");
        // if mobile browser true
        if (L.Browser.mobile) {
            console.log('thinks it a mobile device');
            $('.geocoder-control-expanded').css({
                'top': '-70px',
                'left': '40px'
            });
            // when out of focus, default to original position
            $('.geocoder-control-expanded').focusout(function () {
                $('.geocoder-control').css({
                    'top': '',
                    'left': ''
                })
            });
        };
    });
    $('.sidebar').focusin(function () {
        $('#legend').addClass('col-sm-12');
    });
    // insert an empty tabulator table on page load
    insertTabulator([]);
});

// This sets the marker styles for any of the circleMarker symbols
function markerStyle(fillColor, strokeColor, fillOpacity = 0.75) {
    return {
        fillColor: fillColor,
        color: strokeColor,
        fillOpacity: fillOpacity,
        radius: 4,
        weight: 0.8
    };
}

// current selection
let selection_marker;
// We'll append our markers to this global variable
const json_group = new L.FeatureGroup({
//const json_group = new L.markerClusterGroup.withList({
//const json_group = new L.markerClusterGroup({
    maxClusterRadius: 0,
        iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<b>' + cluster.getChildCount() + '</b>',
            className: 'clustered_sites',
            iconSize: L.point(15, 15)
        });

    }
});
    //const json_group = new L.FeatureGroup({
    //const json_group = new L.markerClusterGroup.withList({
const json_group_c = new L.markerClusterGroup({
        maxClusterRadius: 0,
            iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: '<b>' + cluster.getChildCount() + '</b>',
                className: 'clustered_sites',
                iconSize: L.point(15, 15)
            });
    
        }
    });
// on a click of a cluster
json_group_c.on('clusterclick', function (event) {

    // console.log(json_group);
    // console.log(selection_group);


    // declare the empty content variable to append to
    let clusterPopupContent = "";

    async function getChildMarkerContent() {
        await $.each(event.layer.getAllChildMarkers(), function (index, value) {
            // append content 
            // console.log('looping as part of the popup build')
            clusterPopupContent += value._popup._content + '<br><br>';
            return clusterPopupContent
        });
    }

    // get the content of each marker
    getChildMarkerContent().then(
        // assign content to new leaflet popup
        function () {
            // make sure last popup instance is removed
            $('#clusterPopupContent').remove();

            // set content and add to map
            const clusterPopup = L.popup({
                    closeButton: true,
                    maxHeight: 150,
                    maxWidth: 200,
                })
                .setLatLng(event.layer.getLatLng())
                .setContent(clusterPopupContent)
                .openOn(map);
        });
});
//This is our selection group
const selection_group = new L.markerClusterGroup({
    maxClusterRadius: 0,
    iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<b>' + cluster.getChildCount() + '</b>',
            className: 'clustered_sites',
            iconSize: L.point(15, 15)
        });

    }
});
// This is the circle on the map that will be determine how many markers are around
let searchArea;
// this is the icon in the middle of the circle
// let circleIcon;
// Marker in the middle of the circle
let search_marker;
// array to store table in
let table;
let activeLayer;


// initial setup function to loop through json that
// assigns marker and add to map
async function setup() {
    selection_group.clearLayers();
    $.get("./data/COM.json", function (json_data) {
        $.each(json_data, function (object) {
            // console.log(json_data[object]);
            const provider = json_data[object];
            const marker = markerLogic(provider);
            marker.addTo(json_group);
            marker.addTo(json_group_c);
            json_group.addLayer(marker);
        });
        map.addLayer(json_group);
        map.addLayer(json_group_c);
        map.addLayer(selection_group)
        activeLayer = json_group;
    });
}

///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////

const bottomLeft = [24, -88];
const topRight = [32, -79];

// Map
const map = new L.Map('map', {
    renderer: L.canvas(),
    center: new L.LatLng(28.3, -83.1),
    minZoom: 7,
    maxZoom: 19,
    zoom: 7,
    maxBounds: [bottomLeft, topRight]
});

map.on({
    contextmenu: function (e) {
        console.log('in the contextmenu part---------------')
        querySearchArea(e);
    },
    // Turn off mobile locate control after zoom

    locationfound: function (e) {
        // query search area on location found
        // console.log('get the filters here too')
        // filterLocations(e)
        // console.log('back from the filter function')
        querySearchArea(e);
        // console.log('done with querysearch')
        // disable locate when flyTo(); method ends
        map.on('moveend', function () {
            // console.log('in the moveend thing')
            locate.stop();
            // console.log('map stopped')
        });
        
    }
});

// Load the data
setup();

// Base map
L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// ESRI Geocoder 

var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
var mmp = L.esri.Geocoding.featureLayerProvider({
  url: 'https://maps.freac.fsu.edu/arcgis/rest/services/FREAC/mmh_test_service/MapServer',
  searchFields: ['agency'], // Search these fields for text matches
  label: 'Mental Health Agencies', // Group suggestions under this header
  formatSuggestion: function(feature){
    return feature.properties.agency; // format suggestions like this.
  }
});

var geocoder = L.esri.Geocoding.geosearch({
    providers: [arcgisOnline,mmp], // will geocode via ArcGIS Online and search the GIS Day feature service.
    // providers: [arcgisOnline], // will geocode via ArcGIS Online and search the GIS Day feature service.
    // providers: [mmp], // will geocode via ArcGIS Online and search the GIS Day feature service.
    zoomToResult: false,
    expanded: true,
    useMapBounds: false,
    placeholder: 'Search for an address',
    searchBounds: [bottomLeft, topRight]
}).addTo(map);

geocoder.on('results', function (result) {
    // if mobile browser true
    if (L.Browser.mobile) {
        $('.geocoder-control').css({
            'top': '',
            'left': ''
        })
    }

    clearSelection();
    console.log('Get the filters here')
    //filterLocations(event)
    querySearchArea(result);
    console.log('finished with the query search area ready to scroll ', document.body.scrollHeight)
    window.scrollTo(0,document.body.scrollHeight);
    console.log('SCROLLLLLLED')
});

// check whether on mobile devices
// Commented out based on issue #54
// if (!L.Browser.mobile) {
//     map.removeControl(locate);
// }


// Locate Button
const locate = L.control.locate({
    flyTo: true,
    keepCurrentZoomLevel: false,
    clickBehavior: {
        inView: 'stop',
        outOfView: 'stop',
        inViewNotFollowing: 'stop'
    },
    strings: {
        title: "Find my location"
    },
    drawCircle: false,
    showPopup: false
}).addTo(map);

function clearSelection({
    provider = true,
    radius = false
} = {}) {
    // $('#map').css('z-index', '22')
    if (search_marker) {
        map.removeLayer(search_marker);
    }
    if (searchArea) {
        map.removeLayer(searchArea);
    }
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }
    $('#json_one_results').html('0');
    insertTabulator([]);
    if (provider) {
        $easyAuto.val("");
    }
    if (radius) {
        $radius.val('default');
    }
    searchArea = undefined;
    map.closePopup();
}

// Clear button functionality
$('#clear-search').click(function () {
    clearSelection({
        radius: true
    });
});

// Filter by my selections
$('#filter_by').click(function () {
    selection_group.clearLayers();
    map.removeLayer(selection_group);
    filterLocations(event)
    console.log('finished the filterlocations function')
});

// reload the page so all filters are reset
$('#reload_page').click(function () {
    console.log('trying to clear all filters')
    window.location.reload();
    console.log('got them cleared with a page reload')
});
// Radius dropdown functionality
const $radius = $('#radius');
$radius.change(function () {
    if (searchArea) {
        const r_size = parseInt($radius.val());
        searchArea.setRadius(r_size);
        map.flyToBounds(searchArea.getBounds());
        pointsInCircle(searchArea, r_size, activeLayer);
        // $('#map').css('z-index', '2')
    }
});

function createPopup(data) {
    const content = `<b>${data['Agency']}</b><br> ${data['Unit']}<br> ${data['Insurance']}<br> 
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
    return L.popup({
        closeButton: false
    }).setContent(content);
}

// JQuery Easy Autocomplete: http://easyautocomplete.com
const $easyAuto = $('#easy-auto');
$easyAuto.easyAutocomplete({
    url: "data/COM.json",
    getValue: "Agency",
    list: {
        maxNumberOfElements: 3,
        match: {
            enabled: true
        },
        onChooseEvent: function () {
            clearSelection({
                provider: false,
                radius: true
            });
            const data = $easyAuto.getSelectedItemData();
            var zzoom = undefined;
            // $('#map').css('z-index', '11');
            zoomToLocation(data.Latitude, data.Longitude, zzoom, data);
        }
    },
    requestDelay: 250,
    placeholder: 'Know the provider?  Type the name here'
});

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////


/// Alert for checkbox change

// $("input[type='checkbox']").change(async function (event) {

//     // perform a filter based on which checkboxes are checked
//     filterLocations(event);
// });

// create filter object to hold all selected elements based on type
const filterObject = {
    insurance: [],
    specialty: undefined,
    serves: undefined,
    telehealth: undefined,
    new_client: undefined,
};

// on change, print out this and value
// TODO: add selected values to corresponding key:value pairs in filterObject
$(".mpick").change(function (event) {
    const value = $(this).val();
    const typeofValue = typeof (value);
    const id = $(this).context.id;

    console.log({
        "value": value,
        "this": $(this),
        "id": id,
        "typeofvalue": typeofValue
    });

    // find the corresponding id within the filter object
    for (const key in filterObject) {
        console.log('here is what is in the filterObject ',key);

        // if the id of the select and the key of the filter object match
        if (key === id) {

            // swap array of values into object at this location\
            filterObject[key.toString()] = value;
        }
    }

    // find objects that contain a matching attribute

    //filterOptions(filterObject);
    // execute filter in leaflet - must expand on this


});



// function that will configure a popup for housing info
function configurePopup(data) {
    try {

        if (data['Unit'] === undefined || data['Unit'] === null) {
            data['Unit'] = ''
        }

        var pop_text = `<b>${data['Agency']}</b><br> ${data['Insurance']}<br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch {}

}


// general function that will take in lat and lon
// then will zoom to and highlight desired feature
function zoomToLocation(lat, lng, z = 11, data) {
    // if a marker is already present on the map, remove it
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }

    // set view to location
    map.flyTo(new L.LatLng(lat, lng), z);

    // Set marker location
    const marker_location = new L.LatLng(lat, lng);

    // set the selection_marker variable to our location and style
    selection_marker = L.circleMarker(marker_location, markerStyle(selected_color, selected_color, selected_fill_opacity));

    //allow for the user to click the point under the marker
    selection_marker.options.interactive = false;
    // add marker to the map
    map.addLayer(selection_marker);

    try {

        if (data['Unit'] === undefined || data['Unit'] === null) {
            data['Unit'] = ''
        }

        var pop_text = `<b>${data['Agency']}</b><br> ${data['Insurance']}<br>
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}`;
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch {}
    //make sure the map is the top most div
    // $('#map').css('z-index', '11');
}

// create a reusable Tabulator object
function insertTabulator(data) {
    table = new Tabulator("#results-table", {
        height: 200,
        data: data,
        layout: "fitColumns",
        selectable: 1,
        columns: [{
            title: "Provider",
            field: "agency"
        }, {
            title: "Zip code",
            field: "PostalCode"
        }],
        rowClick: function (event, row) {
            // NOTE: New function parameter to pass all of the row information to the zoomtolocation
            //       function so it can handle the popup

            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const zoom = map.getZoom();
            if (zoom < 12) {
                zoomToLocation(lat, lng, zoom, row._row.data);
            } else {
                zoomToLocation(lat, lng, zoom, row._row.data);
            }
        },
    });
}

// This figures out how many points are within our circle
function pointsInCircle(circle, meters_user_set, groupLayer) {

    if (circle !== undefined) {
        // Only run if we have an address entered
        // Lat, long of circle
        const circle_lat_long = circle.getLatLng();

        // Singular, plural information about our JSON file
        // Which is getting put on the map
        const title_singular = 'provider';
        const title_plural = 'providers';

        // counter for number of points in circle
        let counter_points_in_circle = 0;

        // hold the initial results for points inside circle radius
        const results = [];

        // Loop through each point in JSON file
        groupLayer.eachLayer(function (layer) {
            //console.log('I think this is a provider ', layer)
            // Lat, long of current point
            const layer_lat_long = layer.getLatLng();

            // Distance from our circle marker
            // To current point in meters
            const distance_from_layer_circle = layer_lat_long.distanceTo(circle_lat_long);

            // See if meters is within raduis
            // The user has selected
            if (distance_from_layer_circle <= meters_user_set) {
                counter_points_in_circle += 1;
                //console.log('layer data looks like this? ', layer.data)
                // We need all of the fields below for the popup from the Results table to work with all 
                // the fields
                //console.log(' show me ALLLLLLLLLLL the data ',layer.data)
                results.push({
                    agency: layer.data.Agency,
                    insurance: layer.data.Insurance,
                    housenumber: layer.data.HouseNumber,
                    street: layer.data.Street,
                    city: layer.data.City,
                    state: layer.data.State,
                    postalcode: layer.data.PostalCode,
                    dist: distance_from_layer_circle,
                    latitude: layer_lat_long.lat,
                    longitude: layer_lat_long.lng
                });
            }
        });

        //Sort the list by increasing distance from point
        results.sort(function (a, b) {
            return a.dist - b.dist;
        });

        // A container to hold the query results
        const tableResults = [];

        // for every point in circle, add a tableResults object
        // the table needs lower case fields (currently we only show agency but may want to
        // show others in the future so I put them all in) but the popup relies on capitalized fields
        // TODO - fix this so we only have one case

        for (let i = 0; i < counter_points_in_circle; i++) {
            //console.log('what does a typical result look like, ', results[i])
            tableResults.push({
                id: i,
                Agency: results[i]['agency'],
                Insurance: results[i]['insurance'],
                HouseNumber: results[i]['housenumber'],
                Street: results[i]['street'],
                City: results[i]['city'],
                State: results[i]['state'],
                PostalCode: results[i]['postalcode'],
                lat: results[i]['latitude'],
                lng: results[i]['longitude'],

                agency: results[i]['agency'],
                insurance: results[i]['insurance'],
                housenumber: results[i]['housenumber'],
                street: results[i]['street'],
                city: results[i]['city'],
                state: results[i]['state'],
                postalcode: results[i]['postalcode']
            });
        }
        // add tabulator object to screen
        insertTabulator(tableResults);


        // If we have just one result, we'll change the wording
        // So it reflects the category's singular form
        // I.E. facility not facilities
        if (counter_points_in_circle === 1) {
            $('#json_one_title').html(title_singular);
        } else {
            $('#json_one_title').html(title_plural);
        }

        // Set number of results on main page
        $('#json_one_results').html(counter_points_in_circle);
    }
}

// This both places a circle on the map AND counts the # of points in that circle
function querySearchArea(location) {
    //console.log('STARTING querysearcharea NOWWWWWW')
    clearSelection();
    let r_size;
    if ($radius.val()) {
        r_size = parseInt($radius.val());
    } else {
        r_size = 5347;
        $radius.val(5347);
    }
    searchArea = L.circle(location.latlng, r_size, {
        color: selected_color,
        fillColor: selected_color,
        fillOpacity: 0.1,
        clickable: false,
        interactive: false
    }).addTo(map);

    map.flyToBounds(searchArea.getBounds());
    //filterLocations(event)
    pointsInCircle(searchArea, r_size, activeLayer);
}


// Assign these properties to each marker in the data
function markerLogic(data, selection_marker) {
    // Create marker for data
    const popup = createPopup(data);
    const marker_location = new L.LatLng(data['Latitude'], data['Longitude']);
    const circle_marker = L.circleMarker(marker_location, markerStyle(default_fill_color, default_outline_color))
        .bindPopup(popup);

    circle_marker.on({
        mouseover: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            }
        },
        mouseout: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(default_fill_color, default_outline_color));
            }
        },
        click: function (event) {
            if (selection_marker === undefined) {
                selection_marker = event.target
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            } else {
                selection_marker.setStyle(markerStyle(default_fill_color, default_outline_color));
                selection_marker = event.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity));
            }
        },
        popupclose: function (event) {
            selection_marker = undefined;
            event.target.setStyle(markerStyle(default_fill_color, default_outline_color));
        },
        contextmenu: function () {}
    });

    // Add a data object for use in the table
    // TODO -- SWH - not sure we need all of these fields - maybe just Agency (5/17/19)
    circle_marker.data = {
        'Agency': data['Agency'],
        'HouseNumber': data['HouseNumber'],
        'Street': data['Street'],
        'Unit': data['Unit'],
        'City': data['City'],
        'State': data['State'],
        'PostalCode': data['PostalCode'],
        'Specialty': data['Specialty'],
        'Accepting': data['Accepting'],
        'Insurance': data['Insurance'],
        'Serves': data['Serves'],
        'Which_cate': data['Which_cate'],
        'Practice_a': data['Practice_A'],
        'Areas_Serv': data['Areas_Serv']

    };

    return circle_marker;
}