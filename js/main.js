// GLOBALS
let year = 2004; // Year to start with...
let index = 0;
let region = "";

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

function processData(data) {
    let attributes = [];
    let properties = data.features[0].properties;
    for (let attribute in properties) {
        if (attribute.indexOf("TEU") > -1) {
            attributes.push(attribute);
        }
    }
    
    attributes.sort((a, b) => a.split("_")[2] - b.split("_")[2])
    console.log(attributes)
    return attributes
}

function createPropSymbols(data, map, attributes, region) {
    let attribute = attributes[0]
    L.geoJson(data, {
        pointToLayer: (feature, latlng) => pointToLayer(feature, latlng, attributes),
        filter: feature => {
            if(region == "") {
                return feature.properties[attribute] != null  
            } else {
                return feature.properties[attribute] != null && feature.properties.REGION == region  
            }
        }
    }).addTo(map);
}

function pointToLayer(feature, latlng, attributes) {
    let attribute = attributes[0];
    console.log(attribute)

    let geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#18FFFF",
        color: "#FFEB3B",
        weight: 1,
        opacity: 1,
        fillOpacity: 0
    }
    let attValue = Number(feature.properties[attribute])
    geojsonMarkerOptions.radius = calcPropRadius(attValue)
    let layer = L.circleMarker(latlng, geojsonMarkerOptions)
    let popup = new Popup(feature.properties, attribute, layer, geojsonMarkerOptions.radius);
    popup.bindToLayer();

    return layer
}

function calcPropRadius(attValue) {
    let scaleFactor = 0.05;
    let area = attValue * scaleFactor;
    let radius = Math.sqrt(area / Math.PI)

    return radius
}

function Popup(properties, attribute, layer, radius) {
    this.properties = properties;
    this.attribute = attribute;
    this.layer = layer;
    this.year = attribute.split("_")[2];
    this.teu = this.properties[attribute]
    this.content = "<p><b>Port City:</b> " + this.properties.PORT + "</p>" + "<p><b>TEU in " + this.year + ":</b> " + this.teu + " thousand</p>";
    this.bindToLayer = function() {
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0, -radius)
        })
    }
}

function updatePropSymbols(map, attribute) {
    map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            let props = layer.feature.properties;

            let radius = calcPropRadius(props[attribute])
            layer.setRadius(radius)

            let popup = new Popup(props, attribute, layer, radius)
            popup.bindToLayer();
        }
    })
}

function getData(map) {
    $.ajax("./data/busiest_container_ports_2004_2019.geojson", {
        dataType: "json",
        success: function (response) {
            let attributes = processData(response)
            createPropSymbols(response, map, attributes, region)
            
            // Year change event 
            $(".skip").click(function() {
                if ($(this).attr("id") == "year-increase") {
                    index++;
                    index = index > 15 ? 0 : index;
                    updatePropSymbols(map, attributes[index])
                } else if ($(this).attr("id") == "year-decrease") {
                    index--;
                    index = index < 0 ? 15 : index;
                    updatePropSymbols(map, attributes[index])
                }

                year = attributes[index].split("_")[2]
                
                $(".year").text(year);
            })
            
            // Region change event
            $("#region-select").change(function() {
                region = $(this).find(":selected").val();
                map.eachLayer(layer => {
                    if (layer.feature) {
                        map.removeLayer(layer)
                    }
                })
                createPropSymbols(response, map, attributes, region)
            })
        }
    })
}

$(document).ready(createMap)