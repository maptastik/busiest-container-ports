// METAINFO INTERFACE
const legendToggleEl = document.getElementById("legend-toggle")
const legendEl = document.getElementById("legend-container")

const aboutToggleEl = document.getElementById("about-toggle")
const aboutEl = document.getElementById("about-container")
const closeEls = document.getElementsByClassName("close")

function deactivateClass(cssClass) {
    let elements = document.getElementsByClassName(cssClass)
    for (let i = 0; i<elements.length; i++) {
        elements[i].classList.remove(cssClass)
    }
}

legendToggleEl.addEventListener("click", () => {
    deactivateClass("info-box-visible")
    legendEl.classList.add("info-box-visible")
})

aboutToggleEl.addEventListener("click", () => {
    deactivateClass("info-box-visible")
    aboutEl.classList.add("info-box-visible")
})

for (closeEl of closeEls) {
    closeEl.addEventListener("click", () => deactivateClass("info-box-visible"))
}


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

    
    for (el of [legendEl, aboutEl]) {
        L.DomEvent.disableClickPropagation(el)
    }


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