document.addEventListener("DOMContentLoaded", function() {
    drawMap();
});


function drawMap() {
    const width = 960;
    const height = 620;
    const svg = d3.select(".target")
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

    d3.json('/assets/data/ch-cantons-lakes.json').then(function(topodata_ch) {
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
        d3.json('/assets/data/RoadTrafficAccidentLocations.json').then(function(accident_data) {
            svg.selectAll("circle")
                .data(accident_data.features)
                .enter()
                .append("circle")
                .attr("transform", function(d) {
                    return "translate(" + projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) + ")";
                })
                .attr("r", function(d) {
                    if (d.properties.SeverityCategory == "as1") {
                        return "2px";
                    } else {
                        return "1px";
                    }
                })
                .attr("fill", function(d) {
                    if (d.properties.SeverityCategory == "as1") {
                        return "red";
                    }
                    if (d.properties.SeverityCategory == "as2") {
                        return "orange";
                    }
                    if (d.properties.SeverityCategory == "as3") {
                        return "green";
                    }
                });
        });
    });
}