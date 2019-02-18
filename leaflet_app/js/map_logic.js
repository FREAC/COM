// This file will house all of the map logic for screen size changes

// append search bar to the top of the map when on small screen
if (screen.availWidth < 766) {
    document.getElementById('full-page').appendChild(
        document.getElementById('geocoder_box')
    );
    if (infoButton) {
        console.log(infoButton);
    } else {
        console.log('happened');
        var infoButton = L.control.infoButton({
            position: 'topleft',
            html: "<div style='text-align:center;'><p></p><img src='images/fsulogo.png' alt='FSU Logo' width='75' height='75'=><br><br><h4>Florida State University College of Medicine</h4><br><h5>Group Care Search Demo</h5><br><p>This demo counts the number of group care facilities within a radius of a given point and displays them on a map using Leaflet.</p><br><p>To use, enter an address and then enter a radius. Under results will be the number of markers within the given radius. You can also drag the marker on the map; the number will update automatically.</p><br><p>More information regarding the original code is available here. Code was originally used here.</p><br><p>This project is sponsored by:</p><a href='https://www.sagerx.com/' target='_blank'><img alt='Sage Therapeutics' src='images/logo-sagerx.svg'><br><br></div>"
        });

        infoButton.addTo(map);
    }

}