document.addEventListener("DOMContentLoaded", function() {
    drawMap();
    drawTreemap();
});


function drawMap() {
    const width = 960;
    const height = 620;
    const svg = d3.select("#map")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", function() {
            svg.attr("transform", d3.event.transform)
        }))
        .append("g");;

    const projection = d3.geoMercator()
        .center([8.1336, 46.484])
        .scale(8800)
        .translate([width / 2, height / 2])
        .precision(.1);

    const geo_path = d3.geoPath().projection(projection);

    d3.json('/assets/data/ch-cantons-lakes.json').then(topodata_ch => {
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
        d3.json('/assets/data/RoadTrafficAccidentLocations_converted_as1.json').then(accident_data => {
            drawAccidentsOnMap(svg, accident_data.features, projection);
            drawBarChart(accident_data);
        });
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

    // map data by street type
    const bardata = d3.nest()
        .key(function(d) {
            return d.properties.RoadType_de;
        })
        .rollup(function(d) {
            return d.length;
        }).entries(data.features);

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
}

function drawAccidentsOnMap(svg, data, projection) {
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("transform", function(d) {
            return "translate(" + projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) + ")";
        })
        .attr("r", "1px")
        .attr("fill", function(d) {
            if (d.properties.SeverityCategory == "as1") {
                return "red";
            }
            if (d.properties.SeverityCategory == "as2") {
                return "orange";
            }
        });
}