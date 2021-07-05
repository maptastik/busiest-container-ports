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
    return attributes
}

function createPropSymbols(data, map, attribute, region) {
    let layer = L.geoJson(data, {
        pointToLayer: (feature, latlng) => pointToLayer(feature, latlng, attribute),
        filter: feature => {
            if(region == "") {
                return feature.properties[attribute] != null  
            } else {
                return feature.properties[attribute] != null && feature.properties.REGION == region  
            }
        }
    }).addTo(map);

    return layer;
}

function pointToLayer(feature, latlng, attribute) {

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
    this.content = "<p><b>Port City:</b> " + this.properties.PORT + "</p>" + "<p><b>Container Throughput in " + this.year + ":</b> " + this.teu.toLocaleString() + "K Containers</p>";
    this.bindToLayer = function() {
        this.layer.bindPopup(this.content, {
            offset: new L.Point(0, -radius)
        })
    }
}

function createLegendGraphics(container, legendVals) {
    let svg = "<svg id='attribute-legend'>";
    let circles = ["min", "mean", "max"];
    for (let i = 0; i < circles.length; i++) {

        let radius = calcPropRadius(legendVals[circles[i]]).toString()
        let cy = (59 - radius).toString();
        console.log({radius, cy})
        svg += '<circle class="legend-circle" id=' + circles[i] + ' fill-opacity="0" stroke="#FFEB3B" stroke-width="1" cx="60" cy=' + cy + ' r=' + radius + ' /></circle>'
    }
    svg += "</svg>"
    $(container).append(svg);
}
function createLegendGraphicsLabels(legendVals) {
    let circles = ["max", "mean", "min"];
    for (let i = 0; i < circles.length; i++) {
        let amount = Math.round(legendVals[circles[i]]).toLocaleString();
        console.log(amount)
        $("#teu-legend-label-" + circles[i]).text(amount + " K")
    }
}

function getCircleValues(data, attributes) {
    let min = Infinity;
    let max = -Infinity;

    // Iterate through each attribute value for each feature to check if
    // the attribute value is the min or max value in the dataset
    let features = data.features
    features.forEach(feature => {
        attributes.forEach(attribute => {
            let value = feature.properties[attribute] 
            if (value < min & value != null) {
                min = feature.properties[attribute] 
            }

            if (value > max) {
                max = feature.properties[attribute]
            }
        })
    })

    // Calculate the mean of the min and max
    let mean = (max + min) / 2;

    return {max, min, mean}
}

function getData(map) {
    $.ajax("./data/busiest_container_ports_2004_2019.geojson", {
        dataType: "json",
        success: function (response) {
            const attributes = processData(response)
            const legendCircleValues = getCircleValues(response, attributes)
            createLegendGraphics("#teu-legend-graphic", legendCircleValues)
            createLegendGraphicsLabels(legendCircleValues)
            let teuLayer = createPropSymbols(response, map, attributes[0], region)
            map.fitBounds(teuLayer.getBounds())
            
            // Year change event 
            $(".skip").click(function() {
                map.eachLayer(layer => {
                    if (layer.feature) {
                        map.removeLayer(layer)
                    }
                })

                if ($(this).attr("id") == "year-increase") {
                    index++;
                    index = index > 15 ? 0 : index;
                } else if ($(this).attr("id") == "year-decrease") {
                    index--;
                    index = index < 0 ? 15 : index;
                }

                teuLayer = createPropSymbols(response, map, attributes[index], region)
                map.fitBounds(teuLayer.getBounds(), {
                    maxZoom: 8
                })

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
                teuLayer = createPropSymbols(response, map, attributes[index], region)
                map.fitBounds(teuLayer.getBounds(), {
                    maxZoom: 8
                })
            })
        }
    })
}

$(document).ready(createMap)