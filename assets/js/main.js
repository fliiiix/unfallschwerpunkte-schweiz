document.addEventListener("DOMContentLoaded", function() {
    drawMap();
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
        .append("g");

    const projection = d3.geoMercator()
        .center([8.1336, 46.484])
        .scale(8800)
        .translate([width / 2, height / 2])
        .precision(.1);

    const geo_path = d3.geoPath().projection(projection);

    var locations = d3.select('#points');

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
            /*svg//.selectAll("custom:circle")
                .call(custom)
                .data(accident_data.features)
                //.enter()
                .append("custom:circle")
                //.attr("transform", function(d) {
                //    return "translate(" + projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) + ")";
                //})
                .attr("x", function(d) {return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[0];})
                .attr("y", function(d) {return projection([d.geometry.coordinates[0], d.geometry.coordinates[1]])[1];})
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
                });*/

            /*accident_data.features.forEach(function(data){
                proj = projection([data.geometry.coordinates[0], data.geometry.coordinates[1]]);
                console.log(proj)
                //context.strokeStyle = element.getAttribute("strokeStyle");
                context.fillStyle = "#ff2626";
                context.beginPath();
                context.arc(proj[0], proj[1], 2, 0, 2 * Math.PI, true);
                context.fill();
            });*/

            var dataBinding = locations.selectAll("points.arc")
                .data(accident_data.features)
                .enter()
                .append("points")
                .classed("arc", true)
                .attr("x", function(d) {
                    return projection([d.y, d.x])[0]
                })
                .attr("y", function(d) {
                    return projection([d.y, d.x])[1]
                })
                .attr("radius", 8)
                .attr("fillStyle", "#ff0000")
            drawCanvas();

        });
    });
}

function drawCanvas() {
    const width = 960;
    const height = 620;
    var chart = d3.select('canvas')
        .attr("class", "layer")
        .attr('width', width)
        .attr('height', height);

    var context = chart.node().getContext('2d');
    var locations = d3.select('#points');
    var elements = locations.selectAll("points.arc");
    elements.each(function(d) {
        var node = d3.select(this);

        context.beginPath();
        context.arc(node.attr("x"), node.attr("y"), node.attr("radius"), 0, 2 * Math.PI);
        context.fillStyle = node.attr("fillStyle");
        context.fill();
        context.closePath();
    })
}

/*function custom(selection) {
    selection.each(function() {
        var root = this,
            canvas = root.parentNode.appendChild(document.createElement("canvas")),
            context = canvas.getContext("2d");

        canvas.style.position = "absolute";
        canvas.style.top = root.offsetTop + "px";
        canvas.style.left = root.offsetLeft + "px";

        // It'd be nice to use DOM Mutation Events here instead.
        // However, they appear to arrive irregularly, causing choppy animation.
        d3.timer(redraw);

        // Clear the canvas and then iterate over child elements.
        function redraw() {
            canvas.width = root.getAttribute("width");
            canvas.height = root.getAttribute("height");
            for (var child = root.firstChild; child; child = child.nextSibling) draw(child);
        }

        // For now we only support circles with strokeStyle.
        // But you should imagine extending this to arbitrary shapes and groups!
        function draw(element) {
            //console.log("draw");
            //console.log(element.getAttribute("x"));
            switch (element.tagName) {
                case "circle":
                    {
                        context.strokeStyle = element.getAttribute("strokeStyle");
                        context.beginPath();
                        context.arc(element.getAttribute("x"), element.getAttribute("y"), element.getAttribute("r"), 0, 2 * Math.PI);
                        context.stroke();
                        break;
                    }
            }
        }
    });
}*/