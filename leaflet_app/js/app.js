'use strict';

// comment out the next line to re-enable console messages
// console.log = function() {}
//
// ?freac=true to enable console.log

// Colors
// const default_fill_color = "#ED9118";
const default_fill_color = "#35b6b9";    // darker blue
const default_outline_color = "#FFFFFF"; // white
const selected_color = "#2BBED8";        // lighter blue
const selected_fill_opacity = 1;
$(function () {
    $('.mpick').fSelect();
});

$(document).ready(function () {
    console.log('lets get things READY')
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
function createLegend() {    
    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
    
    var div = L.DomUtil.create('div', 'info legend');
    var labels = ['<strong>Categories</strong>'],
    categories = ['Maternal Mental Health Provider','At least one MMH Provider','Not a MMH Provider'];
    
    for (var i = 0; i < categories.length; i++) {
                div.innerHTML += 
                labels.push(
                    '<i class="circle" style="background:' + getColor(categories[i]) + 
                                              ';color:' + getColor(categories[i]) +
                    '">O</i>' +
                (categories[i] ? categories[i] : '+'));
            }
            div.innerHTML = labels.join('<br>');
        return div;
        };
        legend.addTo(map);
    }
function markerStyle(fillColor, strokeColor, fillOpacity = 0.75,cat) {
    // console.log('did cat get here',cat['mhnum'],cat)
    // console.log('did cat get here',cat)
    try {var spec = cat['Specialty'];
    } catch(err){
        console.log('blew looking up specialty ',cat)
        var spec = 'other';
    }
    return {
        // fillColor: fillColor,
        fillColor: fillC(spec),
        color: strokeColor,
        fillOpacity: fillOpacity,
        radius: 4,
        weight: 0.8
    };
}
function fillC(cat){
    // console.log('did we get an attribute ',cat)
    if (cat.includes('Maternal Mental Health')) {
        if (showBase) {
            return '#ff0000' // red
        } else {
            return default_fill_color;
        }
    } else {
        // console.log('returning the default ',cat['Which_cate'])
        return default_fill_color;
    }
}

// current selection
let selection_marker;
// We'll append our markers to this global variable
// we will use this one in the filter because it is NOT clustered -- harder to loop through
const json_group = new L.FeatureGroup({
//const json_group = new L.markerClusterGroup.withList({
//const json_group = new L.markerClusterGroup({
    maxClusterRadius: 0,
        iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<b><p style="font-size:10px">' + cluster.getChildCount() + '</p>',
            className: setClass(cluster),
            iconSize: L.point(15, 15)
        });

    }
});

function setClass(cluster) {
    // set the color of the cluster based on whether or not there is a MMH in the cluster
    // console.log('cluster is ',cluster)
    const num_in_cluster = cluster._childCount
    // console.log('----Found a cluster with ', num_in_cluster,' pieces')
    var each_layer = cluster.getAllChildMarkers()
    // console.log('here should be the whole cluster ',each_layer)
    var useClass = 'clustered_sites'
    for(var i=0; i<num_in_cluster; i++){
        // console.log('----here is the clustered specialty ',i,' ',each_layer[i].data.Specialty)
        if (each_layer[i].data.Specialty.includes('Maternal Mental Health')){
            if (showBase) {
                useClass = 'clustered_sites_with_MMH' 
            } else {
                useClass = 'clustered_sites'
            }
        }
    }
    return useClass
}

// this one is used just on the initial load
const json_group_c = new L.markerClusterGroup({
        maxClusterRadius: 0,
        spiderLegPolylineOptions: {opacity: 0.0},
        spiderfyDistanceMultiplier: 1000000.0,
            iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: '<b><p style="font-size:10px">' + cluster.getChildCount() + '</p>',
                className: setClass(cluster),
                iconSize: L.point(15, 15)
            });
    
        }
    });
// on a click of a cluster
json_group_c.on('clusterclick', function (event) {
    // declare the empty content variable to append to
    let clusterPopupContent = "";
    console.log('starting the cluster click')
    async function getChildMarkerContent() {
        await $.each(event.layer.getAllChildMarkers(), function (index, value) {
            console.log('looking at each one')
            // append content 
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

//This is our selection group.  We will filter through the json_group and add to this
const selection_group = new L.markerClusterGroup({
    maxClusterRadius: 0,
    spiderLegPolylineOptions: {opacity: 0.0},
    spiderfyDistanceMultiplier: 100000.0,
    iconCreateFunction: function (cluster) {
        return L.divIcon({
            html: '<b><p style="font-size:10px">' + cluster.getChildCount() + '</p>',
            className: setClass(cluster),
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

//Function to grab any command line arguments.
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
    } 
    return urlparameter;
}
function getColor(d) {
    console.log('try to get the color block ',d)
    return d === 'Maternal Mental Health Provider' ? "#de2d26" :    // red
           d === 'At least one MMH Provider' ? "#f7aeab": //light red - orginally light blue"#b3e9e9"
           d === 'Not a MMH Provider'  ? "#35b6b9" : 
                        "#ff7f00";                         // dark blue : orange                   
}
// initial setup function to loop through json that
// assigns marker and add to map
async function setup() {
    selection_group.clearLayers();
    var mhnum = getUrlParam('provider_id')
    console.log('looking for this id ',mhnum)
    $.get("./data/COM.json", function (json_data) {
        $.each(json_data, async function (object) {
            // console.log('this is each object ',json_data[object]['mhnum']);
            json_data[object]['Phone_Numb'] = await formatPhone(json_data[object]['Phone_Numb'])
            json_data[object]['phone_numb'] = await formatPhone(json_data[object]['Phone_Numb'])
            json_data[object]['website']    = await cleanWebsite(json_data[object]['website']);
            //json_data[object]['Website']    = await cleanWebsite(json_data[object]['Website']);
            // console.log(' the new phone is ',phone, data)
            const provider = json_data[object];
            const marker = markerLogic(provider);
            marker.addTo(json_group);
            marker.addTo(json_group_c);
            json_group.addLayer(marker);
            json_group_c.addLayer(marker);
            if (mhnum === json_data[object]['mhnum']) {
                console.log('FFFFFFFFFFFFFFound it', json_data[object])

                const lat = json_data[object]['Latitude'];
                const lon = json_data[object]['Longitude'];
                //  var z = 11;
                //  the_data = layer.data;
                console.log('trying to zoom to ',lat, lon)
                zoomToLocation(lat, lon, 99, json_data[object]) 
            }
        });
        //map.addLayer(json_group);
        map.addLayer(json_group_c);
        map.addLayer(selection_group)
        activeLayer = json_group;
    });
 
}
  
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
// Base map
// L.tileLayer.provider('CartoDB.Voyager').addTo(map);

// load open street maps code
		//OSM tiles attribution and URL
        var osmLink = '<a href="https://openstreetmap.org">OpenStreetMap</a>';
        var osmURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var osmAttrib = '&copy; ' + osmLink;
        
        //Carto tiles attribution and URL
        var cartoLink = '<a href="https://cartodb.com/attributions">CartoDB</a>';
        var cartoURL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
        var cartoAttrib = '&copy; ' + osmLink + ' &copy; ' + cartoLink;
        
        // Use this code for an imagery background
        
        var aerialLink = '<a href="https://www.esri.com/">Esri</a>';
        var aerialURL  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        var aerialAttrib = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

        var osmMap = L.tileLayer(osmURL, {attribution: osmAttrib, maxZoom: 22, maxNativeZoom: 19});
        var cartoMap = L.tileLayer(cartoURL, {attribution: cartoAttrib, maxZoom: 22, maxNativeZoom: 20});
        var aerialMap = L.tileLayer(aerialURL, {attribution: aerialAttrib, maxZoom: 22, maxNativeZoom: 21});
        
        //Base layers definition and addition
        var baseLayers = {
            "CartoDB": cartoMap,
            "Aerial View": aerialMap,
            "OSM Map": osmMap
        };

const bottomLeft = [24, -88];
const topRight = [32, -79];

// Map
const map = new L.Map('map', {
    renderer: L.canvas(),
    // layers: [cartoMap],
    layers: [cartoMap],
    center: new L.LatLng(28.3, -83.1),
    minZoom: 6,
    maxZoom: 22,
    zoom: 7,
    maxBounds: [bottomLeft, topRight]
});

//This will hold the marker for the address zoom
var results = L.layerGroup().addTo(map);

//Add baseLayers to map as control layers
var showBase = getUrlParam('freac')
console.log('what is showBase',showBase)
var showBase = true
if (showBase) {
    // show the show/hide filters button
    var s_h_filter = document.getElementById('showHideFilters')
    s_h_filter.classList.remove('hidden_element')
    L.control.layers(baseLayers).addTo(map);
} else {
    // comment out the next line to re-enable console messages
    console.log = function() {}
}
map.on({
    contextmenu: function (e) {
        // by uncommenting the next line, the user can RIGHT click and draw a circle.
        // there seems to be a problem though if you do multiple right clicks in a row
        //  the points on the map appear to move.
        // map.zoomIn(1);
        querySearchArea(e);
        map.zoomIn(.000001);
    },
    // Turn off mobile locate control after zoom

    locationfound: function (e) {
        // query search area on location found
        // filterLocations(e)
        querySearchArea(e);
        // disable locate when flyTo(); method ends
        map.on('moveend', function () {
            locate.stop();
        });
        
    }
});

// Load the data
setup();
if(showBase){createLegend();}

// ESRI Geocoder 

var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
var mmp = L.esri.Geocoding.featureLayerProvider({
//   url: 'http://freac.maps.arcgis.com/home/webmap/viewer.html?webmap=a6081db80aa24a459de18eddfc26f871/0',
  url: 'https://maps.freac.fsu.edu/arcgis/rest/services/FREAC/mmh_test_service/FeatureServer/0',
  searchFields: 'agency', // Search these fields for text matches
  label: 'Mental Health Agencies', // Group suggestions under this header
  formatSuggestion: function(feature){
    return feature.properties.agency; // format suggestions like this.
  }
});

var geocoder = L.esri.Geocoding.geosearch({
    providers: [arcgisOnline,mmp], // will geocode via ArcGIS Online and providers.
    zoomToResult: false,
    expanded: true,
    useMapBounds: false,
    placeholder: '2. Enter an address or provider name',
    collapseAfterResult: false,
    // collapseAfterResult: true,
    // searchBounds: [bottomLeft, topRight]
}).addTo(map);
geocoder.on('results', async function (result) {
    // if mobile browser true
    if (L.Browser.mobile) {
        $('.geocoder-control').css({
            'top': '',
            'left': ''
        })
    }
    console.log('what are the results from the geocode event ',result.results[0])
    clearSelection();
    result.results[0].properties['phone_numb'] = await formatPhone(result.results[0].properties['phone_numb'])
    if (result.results[0].properties.mhnum || result.results[0].properties.mmhid) {
        // just zoom to the place
        var z = 11;
        zoomToLocation(result.results[0].latlng.lat, result.results[0].latlng.lng, z = 11, result.results[0].properties) 

    } else {
        // This was a regular address zoom
        querySearchArea(result);
        console.log('finished with the query search area ready to scroll ', document.body.scrollHeight)
        window.scrollTo(0,document.body.scrollHeight);
        try {
            results.clearLayers();
        } catch (err) {console.log('could not clear it')}
        // original way we added the marker
        // results.addLayer(L.marker(result.results[0].latlng));
        L.marker(result.results[0].latlng).addTo(results);
    }

});



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
//
// create stuff for the bookmarks
// var bookcontrol = new L.Control.Bookmarks().addTo(map);
// map.fire('bookmark:add', {
//     id: 'bookid', // make sure it's unique,
//     name: 'Bookmark name',
//     latlng: [lat, lng], // important, we're dealing with JSON here,
//     your_key: 'your value'
// });
// check whether on mobile devices
// Commented out based on issue #54
if (!L.Browser.mobile) {
    map.removeControl(locate);
}

function clearSelection({
    provider = true,
    radius = false
} = {}) {

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
    // if (provider) {
    //     $easyAuto.val("");
    // }
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
$('#filter_by').click(async function () {
    console.log('GGGGGGGGGGGGGGGGo get the filter text')
        var filterText = await generateFilterText();
    selection_group.clearLayers();
    map.removeLayer(selection_group);
    filterLocations(event)
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@finished the filterlocations function')

    const r_size = parseInt($radius.val());
    setTimeout (function () {
        pointsInCircle(searchArea, r_size, activeLayer);
    },500)
    console.log('did we eeeeeeeeeeeeeeeeeeeeeever get our text ',filterText)
    $('#filters_used').html(filterText)
    $('#filters_used').removeClass('hidden_element')   
});

// Generate the filters text
async function generateFilterText(){
    console.log('first load the Pretty Options text')
    // var insuranceOptions, practice_aOptions, which_cateOptions, specialtyOptions, servesOptions, telehealthOptions, 
    //     acceptingOptions =  loadPrettyNames()
    var insuranceOptions  = await prettyInsurance();
    var practiceOptions   = await prettyPractic_a();
    var area_servOptions  = await prettyArea_Serv();
    var which_cateOptions = await prettyWhich_cate();
    var specialtyOptions  = await prettySpecialty();
    var servesOptions     = await prettyServes();
    var telehealthOptions = await prettyTelehealth();
    var acceptingOptions  = await prettyAccepting();
    var minorityOptions   = await prettyMinority();
    var minorityTrainingOptions   = await prettyMinorityTraining();
    // console.log('did we get the options loaded ok ', insuranceOptions)
    var theFilters = await getFilters()
    // console.log('FFFFFFINished with the getFilters function')
    var filterText = ''
    if (theFilters.length > 0) {
        // need to put the filter name and values back to proper format (caps and spaces)
        var num_filters = ((theFilters.length / 2)) ;
        console.log('looking at ',num_filters,' filters00000000000')
        for (j=0; j < num_filters*2; j+=2){
            //console.log('filter ',j, ' is ',toTitleCase(theFilters[j]), theFilters[j+1].length)
            var theFilterValues = ''
            for (jj=0; jj<theFilters[j+1].length; jj++){
                // console.log('jj is ', jj, 'value being processed',theFilters[j+1][jj])
                console.log('whats is next ',theFilters[j])
                // need to break back apart each piece and space them by looking them up in the array
                switch (theFilters[j]){
                    case 'Insurance':
                    case '<b>Insurance</b>':
                        theFilters[j] = '<b>Insurance</b>'
                        theFilterValues += insuranceOptions[insuranceOptions.indexOf(theFilters[j+1][jj].toLowerCase().replace(/\s/g,'')) + 1] + ', '
                        break;
                    case 'Practice_a':
                    case '<b>Practice_a</b>':
                        theFilters[j] = '<b>Practice Location</b>';
                        theFilterValues += practiceOptions[practiceOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;
                    case 'Areas_Serv':
                    case '<b>Areas Served</b>':
                        theFilters[j] = '<b>Areas Served</b>';
                        theFilterValues += area_servOptions[area_servOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;
                    case 'Which_cate':
                    case '<b>Practice/Agency Categories</b>':
                        theFilters[j] = '<b>Practice/Agency Categories</b>'
                        theFilterValues += which_cateOptions[which_cateOptions.indexOf(theFilters[j+1][jj]) + 1] + ', '
                        break;
                    case 'Specialty':
                    case '<b>Practice/Agency Specialties</b>':
                        theFilters[j] = '<b>Practice/Agency Specialties</b>';
                        theFilterValues += specialtyOptions[specialtyOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;
                    case 'Serves':
                    case '<b>Client Types</b>':
                        theFilters[j] = '<b>Client Types</b>';
                        theFilterValues += servesOptions[servesOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;
                    case 'telehealth':
                    case '<b>Telehealth?</b>':
                        theFilters[j] = '<b>Telehealth?</b>';
                        theFilterValues += telehealthOptions[telehealthOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;
                    case 'Accepting':
                    case '<b>Accepting New Patients?</b>':
                        theFilters[j] = '<b>Accepting New Patients?</b>';
                        theFilterValues += acceptingOptions[acceptingOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;    
                    case 'Minority':
                    case '<b>PDo you self identify as a provicer of color?</b>':
                        theFilters[j] = '<b>Do you self identify as a provicer of color?</b>';
                        theFilterValues += minorityOptions[minorityOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;   
                    case 'MinorityTraining':
                    case '<b>Do you have training and experience in treating patients / clients of color?</b>':
                        theFilters[j] = '<b>Do you have training and experience in treating patients / clients of color?</b>';
                        theFilterValues += minorityTrainingOptions[minorityTrainingOptions.indexOf(theFilters[j+1][jj]) + 1] + ', ';
                        break;   
                    default:         
                        theFilters[j] = 'NOT SURE';   
                        theFilterValues += theFilters[j+1][jj]  + ', ';
                        break;
                }

            }
            // console.log('befor the slice ',theFilterValues,theFilterValues.length)
            theFilterValues = theFilterValues.slice(0,-2)
            // console.log('finished building the value piece', theFilterValues, theFilterValues.length)
            filterText += theFilters[j] + '<br />' + theFilterValues + '<br /><br />'
        }
    }
    // console.log('completely ddddddone with filtertext')
    return filterText
}

//print button
$("#print-table").on("click",async function(){
    // console.log('What called this ',window.location.href)
    // if first arg is false then the entire table is printed
    // more print documentation here: http://tabulator.info/docs/4.3/print
    // console.log('did we get the filters ',theFilters)
    var filterText =  await generateFilterText();
    console.log('now set the text ',filterText)

    $('#filters_used').html(filterText)
    $('#filters_used').removeClass('hidden_element')    
    table.showColumn("dist")
    table.showColumn("housenumber")
    table.showColumn("street")
    table.showColumn("city")
    table.print(false, true);
    table.hideColumn("dist")
    table.hideColumn("housenumber")
    table.hideColumn("street")
    table.hideColumn("city")
    // $('#filters_used').html('')
    // $('#filters_used').addClass('hidden_element')

});
// reload the page so all filters are reset
$('#reload_page').click(function () {
    // now get the radius before we clear everything
    const r_size = parseInt($radius.val());
    console.log('trying to clear all filters')
    // the next 5 lines clear any pick list
    $('option:selected').prop("selected", false);
    $('.mpick').prev(".fs-dropdown").find(".fs-options .fs-option").each(function () {
        $(this).removeClass('selected', false);
    });
    $('.fs-label').html('Select some options');
    // now put the radius back to where it was
    switch (r_size) {
        case 8047:
                $('#radius>option:eq(1)').prop('selected',true)
            break;
        case 16093:
                $('#radius>option:eq(2)').prop('selected',true)
            break;
        case 40234:
                $('#radius>option:eq(3)').prop('selected',true)
            break;
        case 80467:
                $('#radius>option:eq(4)').prop('selected',true)
            break;
        case 804670:
                $('#radius>option:eq(5)').prop('selected',true)
            break;
    }
    selection_group.clearLayers(); // remove selections
    // now we just need to call the filterLocations with NO filters to reset everything 
    filterLocations(event)
    activeLayer = json_group
    setTimeout (function () {
        pointsInCircle(searchArea, r_size, activeLayer);
    },500)
    //window.location.reload();  // Old way of clearing the page
    // finally wipeout whats in the filter box
    $('#filters_used').html('')
    $('#filters_used').addClass('hidden_element')
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
async function formatPhone(phone){
    // try to format the phone number- send back original if you fail
    var cleaned = ('' + phone).replace(/\D/g, '')
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3]
    } else {
        return phone
    }
}
function createPopup(data) {
    if (data['Unit'] === undefined || data['Unit'] === null  || data['Unit'] === '0') {
        data['Unit'] = ''
    }
    // console.log('lets see the data ',data)
    // this is the popup text if you just touch a point on the screen
    data['n_latitude'] = data['N_Latitude']
    data['n_longitude'] = data['N_Longitude']
    // for possible use in the future
    //    <br><a href="http://www.google.com/maps?layer=c&cbll=${data['N_Latitude']},${data['N_Longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)</a>
    data['Relevance'] = Math.round(data['Relevance'] * 100) / 100;
    // ${data['address']}<br>
    // <font color='red'>${data['Relevance']} | ${data['MatchLevel']} </font><br>
    // console.log('now that it is cleaned ', data['website'])
    // <br><a href="http://staging.bodhtree.com:4200/?provider_id=${data['mhnum']}" target=_blank>Click for provider details
    //                 (Opens in a new tab)</a>

    var content = `<b>${data['Agency']}</b><br>
                <!--    <b>G:</b> ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br> -->
                     ${data['address']} <br>
                <!--    <b>G:</b> ${data['City']}, ${data['State']} ${data['PostalCode']}<br> -->
                     ${data['city']} , ${data['state']} ${data['zip']}<br>
                    ${data['Phone_Numb']}         
                    <br><a href="http://www.google.com/maps?layer=c&cbll=${data['N_Latitude']},${data['N_Longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)</a>
                    <br><a href="https://flmomsmhresources.org/${data['mhnum']}" target=_blank>Click for provider details<br>
                    (Opens in a new tab)</a>            `;
    if (data['website']){
        content = content.concat(`<br><a href="${data['website']}" target=_blank>Provider website (Opens in a new tab)</a>`)
    }
    return L.popup({
        closeButton: true
    }).setContent(content);
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

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

        if (data['Unit'] === undefined || data['Unit'] === null  || data['Unit'] === '0') {
            data['Unit'] = ''
        }
        // ${data['address']}<br> 
        var pop_text = `<b>${data['Agency']}</b><br> 
                    ${data['HouseNumber']} ${data['Street']} ${data['Unit']}<br>
                    ${data['City']}, ${data['State']} ${data['PostalCode']}<br>
                    ${data['Phone_Numb']}  `;
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch(err) {}

}


// general function that will take in lat and lon
// then will zoom to and highlight desired feature
async function zoomToLocation(lat, lng, z = 11, data) {
    // console.log('starting the zoom to location function', data)
    // if a marker is already present on the map, remove it
    if (selection_marker) {
        map.removeLayer(selection_marker);
    }
    if (z === 99) {
        // came from a mhnum zoom request
        map.flyTo(new L.LatLng(lat, lng), 13);
    } else {
        // set view to location
        map.flyTo(new L.LatLng(lat, lng), z);
    }

    // Set marker location
    const marker_location = new L.LatLng(lat, lng);

    // set the selection_marker variable to our location and style
    selection_marker = L.circleMarker(marker_location, markerStyle(selected_color, selected_color, selected_fill_opacity));

    //allow for the user to click the point under the marker
    selection_marker.options.interactive = false;
    // add marker to the map
    map.addLayer(selection_marker);

    try {
        if (z === 99) {
            // we came from a zoom to a specific MHNUM
            // this needs things to be upper case
            if (data['Unit'] === undefined || data['Unit'] === null  || data['Unit'] === '0') {
                data['Unit'] = ''
            }

            // possible use in the future
            // ${data['address']}<br> ${data['relevance']} <br>
            // <br><a href="http://www.google.com/maps?layer=c&cbll=${data['N_Latitude']},${data['N_Longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)</a>
            // <br><a href="http://staging.bodhtree.com:4200/?provider_id=${data['mhnum']}" target=_blank>Click for provider details<br>
            //             (Opens in a new tab)</a>
            data['relevance'] = Math.round(data['relevance'] * 100) / 100;
            var pop_text = `<b>${data['Agency']}</b><br>
                        ${data['address']} <br>
                        ${data['city']}, ${data['state']} ${data['zip']}<br>
                        ${data['Phone_Numb']}
                        <br><a href="http://www.google.com/maps?layer=c&cbll=${data['N_Latitude']},${data['N_Longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)</a>
                        <br><a href="https://flmomsmhresources.org/${data['mhnum']}" target=_blank>Click for provider details<br>
                        (Opens in a new tab)</a>                         `;
            if (data['website']){
                pop_text = pop_text.concat(`<br><a href="${data['website']}" target=_blank>Provider website (Opens in a new tab)</a>`)
            }

        } else {
            if (data['unit'] === undefined || data['unit'] === null  || data['Unit'] === '0') {
                data['unit'] = ''
            }
            // this pop text is from picking an agency from the geocode box or from the results table
            console.log('PPPPPPPPPop text is ',data)
            // possible use in the future
            // ${data['Address']}<br> <font color='red'>${data['Relevance']} ${data['MatchLevel']}</font> <br>
            // <br><a href="http://www.google.com/maps?layer=c&cbll=${data['n_latitude']},${data['n_longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)</a>
            data['Relevance'] = Math.round(data['Relevance'] * 100) / 100;
            // console.log('what is the website unclean',data['website'])
            data['website'] = await cleanWebsite(data['website'])
            console.log('cleaned it is ',data['website'])
            console.log('what is showbase',showBase)
            // <br><a href="http://ing.bodhtree.com:4200/?provider_id=${data['mhnum']}" target=_blank>Click for provider details<br>
            // (Opens in a new tab)</a>

            if (showBase) {
                var pop_text = `<b>${data['agency']}</b><br>
                    ${data['address']}<br>    
                    ${data['city']}, ${data['state']} ${data['postalcode']}<br>
                    ${data['phone_numb']}
                    <br><a href="http://www.google.com/maps?layer=c&cbll=${data['n_latitude']},${data['n_longitude']}&cbp=0,0,0,0,0" target=_blank>Click Google Street View (Opens in a new tab)-</a>
                    <br><a href="https://flmomsmhresources.org/${data['mhnum']}" target=_blank>Click for provider details<br>
                    (Opens in a new tab)</a>            `;
            } else {
                console.log('this is a local user')
                // <br><a href="http://staging.bodhtree.com:4200/?provider_id=${data['mhnum']}" target=_blank>Click for provider details<br>
                // (Opens in a new tab)</a>

                var pop_text = `<b>${data['agency']}</b><br>
                        ${data['housenumber']} ${data['street']} ${data['unit']}<br>
                        ${data['city']}, ${data['state']} ${data['postalcode']}<br>
                        ${data['phone_numb']}  
                        <br><a href="https://flmomsmhresources.org/${data['mhnum']}" target=_blank>Click for provider details<br>
                        (Opens in a new tab)</a>
                                          `;
            }
            if (data['website']){
                pop_text = pop_text.concat(`<br><a href="${data['website']}" target=_blank>Provider website (Opens in a new tab)</a>`)
            }
        }
        var popup = L.popup({
                maxWidth: 200
            })
            .setLatLng(marker_location)
            .setContent(pop_text)
            .openOn(map);
    } catch (err) {}
    //make sure the map is the top most div
    // $('#map').css('z-index', '11');
}

// create a reusable Tabulator object
function insertTabulator(data) {
    table = new Tabulator("#results-table", {
        rowFormatter:function(row){
            var whatMedia = window.styleMedia.type
            // console.log('can I show stuff here ',whatMedia)
            //
            //this conditional format does NOT work but leaving it in for now.
            //
            if (whatMedia === 'print') {
                // console.log('putting on the borders for the table ')
                row.getElement().style.borderWidth = "thin",
                row.getElement().style.borderStyle = "solid"
            }
            var agency = row.getData().Agency;
            if (agency.includes('***')) {
                row.getElement().style.backgroundColor ="#b0e8e8";
                row.getElement().style.color ="#174f4f";
                row.getElement().style.textShadow ="2px 2px 5px red";
                row.getElement().style.fontWeight ="bold";
                return "<span style='font-weight:bold;'>"+ agency + "</span>";
            } else {
                return agency;
            }
        },
        height: 200,
        // width: 400,
        data: data,
        layout: "fitColumns",
        selectable: 1,
        printAsHtml:false,
        printCopyStyle: true,
        printHeader:"<h1>Providers Meeting Your Criteria<h1>",
        printFooter:"<h2>FSU College of Medicine<h2>",
        columns: [{
            title: "Provider",
            field: "agency"
        }, {
            width: 120,
            title: "Phone",
            field: "Phone_Numb",
            cellClick: function (event, row) {
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
            }
        }, {
            title: "Address",
            field: "address",
            visible: true
        },{
            title: "City",
            field: "city",
            visible: false
        },{
            title: "Distance from address (miles)",
            field: "dist",
            visible: false
        }],
        rowClick: function (event, row) {
            // NOTE: New function parameter to pass all of the row information to the zoomtolocation
            //       function so it can handle the popup

            const lat = row.getData().lat;
            const lng = row.getData().lng;
            const zoom = map.getZoom();
            console.log('what kind of data are we sending over ',row._row.data)
            if (zoom < 12) {
                zoomToLocation(lat, lng, zoom, row._row.data);
            } else {
                zoomToLocation(lat, lng, zoom, row._row.data);
            }
        },
    });
}

// This figures out how many points are within our circle
async function pointsInCircle(circle, meters_user_set, groupLayer) {
    console.log('ssssssssssssssssstarting points is a circle ', circle, meters_user_set)
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
        var agencies_in = []
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
                agencies_in.push({ mhnum: layer.data.mhnum  })
                //console.log('layer data looks like this? ', layer.data)
                // We need all of the fields below for the popup from the Results table to work with all 
                // the fields
                //console.log(' show me ALLLLLLLLLLL the data ',layer.data)
                results.push({
                    mhnum: layer.data.mhnum,
                    agency: layer.data.Agency,
                    insurance: layer.data.Insurance,
                    housenumber: layer.data.HouseNumber,
                    street: layer.data.Street,
                    unit: layer.data.Unit,
                    address: layer.data.Address,
                    relevance: layer.data.Relevance,
                    matchlevel: layer.data.MatchLevel,
                    city: layer.data.City,
                    state: layer.data.state,
                    postalcode: layer.data.PostalCode,
                    website: layer.data.website,
                    phone_numb: layer.data.Phone_Numb,
                    phonenumber:layer.data.Phone_Numb,
                    n_latitude:layer.data.n_latitude,
                    n_longitude: layer.data.n_longitude,
                    dist: (distance_from_layer_circle / 1609).toFixed(2),
                    latitude: layer_lat_long.lat,
                    longitude: layer_lat_long.lng
                });
            }
        });
        results.push({
            agency: "*** Remember there may be telehealth providers outside your search area ***",
            phone_numb: "<<<<<<<<< LOOK HERE <<<<<<<<<"
        })

        //Sort the list by increasing distance from point
        results.sort(function (a, b) {
            return a.dist - b.dist;
        });

        // A container to hold the query results
        const tableResults = [];
        console.log('hhhhhhhhhhhow many meet our criteria ',counter_points_in_circle)
        for (let i = 0; i <= counter_points_in_circle; i++) {
            console.log('what does a typical result look like, ', results[i])
            //results[i]['phone_numb'] = await formatPhone(results[i]['phone_numb'])
            tableResults.push({
                id: i,
                mhnum: results[i]['mhnum'],
                Agency: results[i]['agency'],
                Insurance: results[i]['insurance'],
                HouseNumber: results[i]['housenumber'],
                Street: results[i]['street'],
                Address: results[i]['address'],
                City: results[i]['city'],
                State: results[i]['state'],
                Zip: results[i]['zip'],
                PostalCode: results[i]['postalcode'],
                Website: await cleanWebsite(results[i]['website']),
                Phone_Numb: results[i]['phone_numb'],
                lat: results[i]['latitude'],
                lng: results[i]['longitude'],
                n_latitude: results[i]['n_latitude'],
                n_longitude: results[i]['n_longitude'],
                dist: results[i]['dist'],
                Relevance: results[i]['relevance'],
                MatchLevel: results[i]['matchlevel'],


                agency: results[i]['agency'],
                insurance: results[i]['insurance'],
                housenumber: results[i]['housenumber'],
                street: results[i]['street'],
                address: results[i]['address'],
                city: results[i]['city'],
                state: results[i]['state'],
                zip: results[i]['zip'],
                postalcode: results[i]['postalcode'],
                phone_numb: results[i]['phone_numb'],
                website: await cleanWebsite(results[i]['website'])
            });
        }
        // add tabulator object to screen
        console.log('about to reinsert the tabulator')
        insertTabulator(tableResults);
        // now scroll the table into view
        var elmnt = document.getElementById("results");
        elmnt.scrollIntoView();


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
    console.log('STARTING querysearcharea NOWWWWWW')
    clearSelection();
    let r_size;
    if ($radius.val()) {
        r_size = parseInt($radius.val());
    } else {
        r_size = 8047;
        $radius.val(8047);
    }
    console.log('what did rsize end up being ', r_size)
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
    console.log('********** completed querySearchArea')
}


// Assign these properties to each marker in the data
function markerLogic(data, selection_marker) {
    // Create marker for data
    // console.log('what is data now ',data['mhnum'],' -- ',data['Which_cate'],data)
    var categ = data['Which_cate']
    const popup = createPopup(data);
    const marker_location = new L.LatLng(data['Latitude'], data['Longitude']);
    const circle_marker = L.circleMarker(marker_location, markerStyle(default_fill_color, default_outline_color,0.75,data))
        .bindPopup(popup);

    circle_marker.on({
        mouseover: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity,data));
            }
        },
        mouseout: function (event) {
            if (event.target !== selection_marker) {
                event.target.setStyle(markerStyle(default_fill_color, default_outline_color,1.0,data));
            }
        },
        click: function (event) {
            if (selection_marker === undefined) {
                selection_marker = event.target
                event.target.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity,data));
            } else {
                selection_marker.setStyle(markerStyle(default_fill_color, default_outline_color,data));
                selection_marker = event.target;
                selection_marker.setStyle(markerStyle(selected_color, selected_color, selected_fill_opacity,data));
            }
        },
        popupclose: function (event) {
            selection_marker = undefined;
            event.target.setStyle(markerStyle(default_fill_color, default_outline_color,1.0,data));
        },
        contextmenu: function () {}
    });

    // Add a data object for use in the table
    // TODO -- SWH - not sure we need all of these fields - maybe just Agency (5/17/19)
    circle_marker.data = {
        'Agency': data['Agency'],
        'HouseNumber': data['HouseNumber'],
        'Street': data['Street'],
        'Address': data['address'],
        'Relevance': data['Relevance'],
        'MatchLevel': data['MatchLevel'],
        'Unit': data['Unit'],
        'City': data['City'],
        'city': data['city'],
        'State': data['State'],
        'state': data['state'],
        'Zip':   data['Zip'],
        'zip':   data['zip'],
        'PostalCode': data['PostalCode'],
        'Website': data['Website'],
        'website':data['website'],
        'Phone_Numb': data['Phone_Numb'],
        'Specialty': data['Specialty'],
        'Accepting': data['Accepting'],
        'Minority': data['minority'],
        'MinorityTraining': data['minorityTraining'],
        'Insurance': data['Insurance'],
        'Serves': data['Serves'],
        'Which_cate': data['Which_cate'],
        'Practice_a': data['Practice_A'],
        'Areas_Serv': data['Areas_Serv'],
        'telehealth': data['telehealth'],
        'mhnum': data['mhnum'],
        'N_Latitude': data['n_latitude'],
        'N_Longitude': data['n_longitude'],
        'n_latitude': data['n_latitude'],
        'n_longitude': data['n_longitude']

    };

    return circle_marker;
}
async function prettyInsurance() {
    return  ['accepts most insurance plans','accepts most insurance plans','aetna','Aetna',
	'assistanceprovidedforfilingwithinsurance','assistance provided for filing with insurance','beacon','Beacon',
	'beechstreet','Beech Street','bigbendcommunitybasedcare','Big Bend Community Based Care',
	'bigbendprovidernetwork','Big Bend Provider Network','bluecrossblueshield','Blue Cross Blue Shield',
	'capitalhealthplan','Capital Health Plan','cenpatico','Cenpatico',"children'smedical","Children's Medical",
	'cigna','Cigna','compsych','ComPsych','corphealth','Corphealth','coventry','Coventry','eaprefer','EAPrefer',
	'employeeassistanceprogram','Employee Assistance Program','firsthealth','First Health','greatwest','Great West',
	'guardian','Guardian','healthease','HealthEASE','healthykids','Healthy Kids','horizonhealth','Horizon health',
	'humana','Humana','lifesynch/humana','Lifesynch/Humana','magellan','Magellan','magellanbehavioralhealth',
	'Magellan Behavioral Health','medicaid','Medicaid','medicaidhmo','Medicaid HMO','medicalmutual','Medical Mutual',
	'medicare','Medicare','medicareadvantage','Medicare Advantage','medipass','Medipass','mhn','MHN','newdirections',
	'New Directions','nochargeforservices','no charge for services','noinsuranceaccepted-allselfpay',
	'no insurance accepted - all self pay','optum','Optum','out-of-network','out-of-network','phcs','PHCS','prestige',
	'Prestige','psychcare','Psychcare','qualifyingpatientsseenatnocharge','qualifying patients seen at no charge',
	'selfpaybycheckorcash','self pay by check or cash','slidingscalefeesavailable','sliding scale fees available',
	'staywell','Staywell','sunshinehealth','Sunshine Health','tricare','Tricare','unitedbehavioralhealth',
	'United Behavioral Health','unitedhealthcarewellcare','United Healthcare Wellcare','universal/compcare',
	'Universal/CompCare','valueoptions','Valueoptions',"victim'scomp","Victim's Comp",'vista','Vista','wellcare',
	'Wellcare']
}

async function prettyPractic_a() {
    return ['alachua','Alachua','baker','Baker','bay','Bay','bradford','Bradford','brevard','Brevard','broward','Broward',
	'calhoun','Calhoun','charlotte','Charlotte','citrus','Citrus','clay','Clay','collier','Collier','columbia','Columbia','desoto',
	'DeSoto','dixie','Dixie','duval','Duval','escambia','Escambia','flagler','Flagler','franklin','Franklin','gadsden','Gadsden',
	'gilchrist','Gilchrist','glades','Glades','gulf','Gulf','hamilton','Hamilton','hardee','Hardee','hendry','Hendry','hernando',
	'Hernando','highlands','Highlands','hillsborough','Hillsborough','holmes','Holmes','indianriver','Indian River',
	'jackson','Jackson','jefferson','Jefferson','lafayette','Lafayette','lake','Lake','lee','Lee','leon','Leon','levy','Levy','liberty',
	'Liberty','madison','Madison','manatee','Manatee','marion','Marion','martin','Martin','miami-dade','Miami-Dade',
	'monroe','Monroe','nassau','Nassau','okaloosa','Okaloosa','okeechobee','Okeechobee','orange','Orange','osceola',
	'Osceola','palmbeach','Palm Beach','pasco','Pasco','pinellas','Pinellas','polk','Polk','putnam','Putnam','st.johns','St. Johns',
	'st.lucie','St. Lucie','santarosa','Santa Rosa','sarasota','Sarasota','seminole','Seminole','sumter','Sumter','suwannee',
	'Suwannee','taylor','Taylor','union','Union','volusia','Volusia','wakulla','Wakulla','walton','Walton','washington',
	'Washington','telehealthonly','Telehealth Only']
}
async function prettyArea_Serv(){
    return ['alachua','Alachua','baker','Baker','bay','Bay','bradford','Bradford','brevard','Brevard','broward','Broward',
	'calhoun','Calhoun','charlotte','Charlotte','citrus','Citrus','clay','Clay','collier','Collier','columbia','Columbia','desoto',
	'DeSoto','dixie','Dixie','duval','Duval','escambia','Escambia','flagler','Flagler','franklin','Franklin','gadsden','Gadsden',
	'gilchrist','Gilchrist','glades','Glades','gulf','Gulf','hamilton','Hamilton','hardee','Hardee','hendry','Hendry','hernando',
	'Hernando','highlands','Highlands','hillsborough','Hillsborough','holmes','Holmes','indianriver','Indian River',
	'jackson','Jackson','jefferson','Jefferson','lafayette','Lafayette','lake','Lake','lee','Lee','leon','Leon','levy','Levy','liberty',
	'Liberty','madison','Madison','manatee','Manatee','marion','Marion','martin','Martin','miami-dade','Miami-Dade',
	'monroe','Monroe','nassau','Nassau','okaloosa','Okaloosa','okeechobee','Okeechobee','orange','Orange','osceola',
	'Osceola','palmbeach','Palm Beach','pasco','Pasco','pinellas','Pinellas','polk','Polk','putnam','Putnam','st.johns','St. Johns',
	'st.lucie','St. Lucie','santarosa','Santa Rosa','sarasota','Sarasota','seminole','Seminole','sumter','Sumter','suwannee',
	'Suwannee','taylor','Taylor','union','Union','volusia','Volusia','wakulla','Wakulla','walton','Walton','washington',
	'Washington','telehealthonly','Telehealth Only']
}
async function prettyWhich_cate(){
    return ['notselected','Not Selected','certifiedlactationconsultant','Certified Lactation Consultant',
	'doula','Doula','hotline','Hotline','housingsupport','Housing Support','licensedclinicalsocialworker',
	'Licensed Clinical Social Worker','licensedmarriageandfamilytherapist','Licensed Marriage and Family Therapist',
	'licensedmentalhealthcounselor','Licensed Mental Health Counselor','psychiatrist','Psychiatrist',
    'psychologist','Psychologist','supportgroup','Support Group','treatmentcenter','Treatment Center',
    'other','Other']
}
async function prettySpecialty(){
    return ['abuse','Abuse','addictions','Addictions','anxiety','Anxiety','counseling','Counseling','crisiscounseling',
	'Crisis Counseling','depression','Depression','domesticviolence','Domestic Violence','eatingdisorder','Eating Disorder',
	'evaluations','Evaluations','grief','Grief','homelessness','Homelessness','housingassistance','Housing Assistance',
	'inpatient','Inpatient','lgbtq','LGBTQ','marriage/relationship','Marriage / Relationship','maternalmentalhealth',
	'Maternal Mental Health','parenting','Parenting','psychotherapy','Psychotherapy','referrals','Referrals','resource',
	'Resource','suicideprevention','Suicide Prevention','trauma','Trauma']
}
async function prettyServes(){
    return ['individuals','Individuals','adolescents','Adolescents','caregivers','Caregivers','children','Children','couples',
	'Couples','family','Family','geriatrics','Geriatrics','groups','Groups','women','Women']
}
async function prettyTelehealth(){
    return ['notselected','Not Selected','video','Video','phone','Phone','others','Others',
	'Yes (other)']
}
async function prettyAccepting(){
    return ['notselected','Not Selected','yes','Yes','no','No','waitlist','Waitlist']
}
async function prettyMinority(){
    return ['notselected','Not Selected','yes','Yes','no','No']
}
async function prettyMinorityTraining(){
    return ['notselected','Not Selected','yes','Yes','no','No']
}
async function cleanWebsite(website) {
    //console.log('can we clean it ', website)
    if (website){
        // console.log('got one to try')
        if(website.includes('https://') || website.includes('http://')) {
            // console.log('has the http -- returning',website)
            return website;
        } else {
            // console.log('need to append the http -- returning http://',website)
            return website = 'http://' + website;
        }
    } else {
        return ''
    }
}
function handleClick() {
    this.value = (this.value == 'Show Filters' ? 'Hide Filters' : 'Show Filters');
    document.getElementById("showHideFilters").value=this.value;
}
document.getElementById('showHideFilters').onclick=handleClick;