document.addEventListener("DOMContentLoaded", function() {
    drawElement();

    var slider = document.getElementById('timeSlider');
    noUiSlider.create(slider, {
        start: [0, 24],
        step: 1,
        connect: true,
        range: {
            'min': 0,
            'max': 24
        }
    });

    const endTime = document.getElementById('endTime');
    const startTime = document.getElementById('startTime');
    slider.noUiSlider.on('set', function(values, handle) {
        const time = values[handle].replace('.', ':');
        if (handle == 1) {
            endTime.innerHTML = time;
        } else {
            startTime.innerHTML = time;
        }

        drawFeatures();
    });
});

function clearStreetType() {
    document.getElementById('streettype').innerHTML = "";
    document.getElementById('streettypebutton').style.display = "none";
    drawFeatures();
}

var selected_barchart_filter;
const width = 960;
const height = 620;
const projection = d3.geoMercator()
    .center([8.1336, 46.484])
    .scale(8800)
    .translate([width / 2, height / 2])
    .precision(.1);

function drawElement() {
    const svg = d3.select("#map")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", function() {
            d3.select("#map").attr("transform", d3.event.transform);
        }))
        .append("g");
    const geo_path = d3.geoPath().projection(projection);

    d3.json('assets/data/ch-cantons-lakes.json').then(topodata_ch => {
        //draw basic map
        svg.append("path")
            .datum(topojson.mesh(topodata_ch))
            .attr("fill", "none")
            .attr("stroke", "#777")
            .attr("stroke-width", 0.5)
            .attr("stroke-linejoin", "round")
            .attr("d", geo_path);

        // draw see
        svg.selectAll("path")
            .data(topojson.feature(topodata_ch, topodata_ch.objects.lakes).features)
            .enter()
            .append("path")
            .attr("d", geo_path)
            .style("fill", "#002366");

        // draw features
        drawFeatures();
    });
}

function drawFeatures() {
    const svg = d3.select("#map");
    svg.selectAll("circle").remove();

    const typesvg = d3.select("#strassentyp");
    typesvg.selectAll("*").remove();

    d3.json('assets/data/RoadTrafficAccidentLocations_converted_as1.json').then(accident_data => {
        const slider = document.getElementById('timeSlider');
        const maxH = Number(slider.noUiSlider.get()[0].replace(':00', ''));
        const minH = Number(slider.noUiSlider.get()[1].replace(':00', ''));


        const pedestrian = document.getElementById('pedestrian').checked ? "true" : "false";
        const bicycle = document.getElementById('bicycle').checked ? "true" : "false";
        const motorcycle = document.getElementById('motorcycle').checked ? "true" : "false";
        const car = document.getElementById('car').checked;

        const street = document.getElementById('streettype').innerHTML;

        const filtered = accident_data.features.filter(function(d) {
            const h = Number(d.properties.Hour);
            return h <= minH && h >= maxH &&
                (d.properties.RoadType_de == street || street == "") &&
                (d.properties.InvolvingPedestrian == pedestrian || car == true) &&
                (d.properties.InvolvingBicycle == bicycle || car == true) &&
                (d.properties.InvolvingMotorcycle == motorcycle || car == true);
        });

        drawAccidentsOnMap(filtered);
        drawBarChart(filtered);
    });
}

function drawBarChart(data) {
    // set the dimensions and margins of the graph
    const margin = {
            top: 30,
            right: 30,
            bottom: 70,
            left: 60
        },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svgStrassenType = d3.select("#strassentyp")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const color = {
        "Hauptstrasse": "#ff6e54",
        "Nebenstrasse": "#ffa600",
        "Autobahn": "#dd5182",
        "andere": "#955196",
        "Autostrasse": "#003f5c",
        "Nebenanlage": "#444e86"
    };

    const color_lighter = {
        "Hauptstrasse": "#fe9987",
        "Nebenstrasse": "#fec04c",
        "Autobahn": "#e785a7",
        "andere": "#b980ba",
        "Autostrasse": "#0094d9",
        "Nebenanlage": "#6f7ab6"
    };


    // map data by street type
    const bardata = d3.nest()
        .key(function(d) {
            return d.properties.RoadType_de;
        })
        .rollup(function(d) {
            return d.length;
        }).entries(data);

    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(bardata.map(function(d) {
            return d.key;
        }))
        .padding(0.2);
    svgStrassenType.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    const y = d3.scaleLinear()
        .domain([0, 1000])
        .range([height, 0]);
    svgStrassenType.append("g")
        .call(d3.axisLeft(y));

    // Bars for dayyys my dude
    svgStrassenType.selectAll("bar")
        .data(bardata)
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return x(d.key);
        })
        .attr("y", function(d) {
            return y(d.value);
        })
        .attr("width", x.bandwidth())
        .attr("height", function(d) {
            return height - y(d.value);
        })
        .attr("fill", function(d) {
            return color[d.key];
        })
        .on("mouseenter", function(d) {
            d3.select(this).attr("fill", color_lighter[d.key]);
        })
        .on("mouseleave", function(d) {
            d3.select(this).attr("fill", color[d.key]);
        })
        .on("click", function(d) {
            document.getElementById('streettypebutton').style.display = "block";
            document.getElementById('streettype').innerHTML = d.key;
            drawFeatures();
        });

    // draw lables
    svgStrassenType.selectAll(".text")
        .data(bardata)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (function(d) {
            spacer = 10;
            if (d.value < 10) {
                spacer = 18;
            } else if (d.value < 100) {
                spacer = 15;
            }
            return x(d.key) + spacer;
        }))
        .attr("y", function(d) {
            return y(d.value) - 20;
        })
        .attr("dy", ".75em")
        .attr("fill", function(d) {
            return color[d.key];
        })
        .text(function(d) {
            return d.value;
        });
}

function drawAccidentsOnMap(data) {
    const svg = d3.select("#map");
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("transform", function(d) {
            return "translate(" + projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) + ")";
        })
        .attr("r", "1px")
        .attr("fill", "red");
}
