// GLOBALS


// MAP INITIALIZATION
function createMap() {
    const map = L.map("map", {
        center: [0, 0],
        zoom: 2
    });
    const basemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Feature Data
    getData(map);
}

function getData(map) {
    $.ajax("./data/busiest_container_ports_2004_2019.geojson", {
        dataType: "json",
        success: function (response) {
            let featureLayer = L.geoJSON(response);
            featureLayer.addTo(map);
            map.fitBounds(featureLayer.getBounds())      
        }
    })
}

$(document).ready(createMap)