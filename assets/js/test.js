/* global variables and initial canvas space set up*/

width = Math.max(960, window.innerWidth),
  height = Math.max(500, window.innerHeight),
  prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

//d3.csv("ftgreenetrees.csv", function(error, dataset) { createMap(dataset) });
d3.json('/assets/data/RoadTrafficAccidentLocations.json', function(error, accident_data) {
  createMap(accident_data.features)
});

var tile = d3.geo.tile()
  .size([width, height]);

var projection = d3.geo.mercator()
  //.scale((1 << 24) / 2 / Math.PI)
  .scale(5000)
  .translate([-width / 2, -height / 2]); // just temporary

var zoom = d3.behavior.zoom()
  .scale(projection.scale() * 2 * Math.PI)
  .scaleExtent([1 << 9, 1 << 25])
  //.center([8.1336, 46.484])
  .translate(projection([8.1336, 46.484]).map(function(x) {
    return -x;
  }))
  .on("zoom", zoomed);

var container = d3.select("#container")
  .style("width", width + "px")
  .style("height", height + "px")
  .call(zoom)
  .on("mousemove", mousemoved);

var base = d3.select('#map');

var chart = d3.select('canvas')
  .attr("class", "layer")
  .attr('width', width)
  .attr('height', height);

var context = chart.node().getContext('2d');

var locations = d3.select('#points');

var layer = d3.select('.layer');

var info = base.append("div")
  .attr("class", "info");

zoomed();

function createMap(dataset) {
  var dataBinding = locations.selectAll("points.arc")
    .data(dataset)
    .enter()
    .append("points")
    .classed("arc", true);
    //.attr("x", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0]})
    //.attr("y", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1]})
    //.attr("radius", 8);
  //.attr("fillStyle", "#ff0000")
  drawCanvas();
}

function drawCanvas() {

  var elements = locations.selectAll("points.arc");
  elements.each(function(d) {
    const p = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]);

    context.beginPath();
    const r = 1;
    context.arc(p[0], p[1], r, 0, 2 * Math.PI);
    context.fillStyle = "#ff0000"; //node.attr("fillStyle");
    context.fill();
    context.closePath();
  })
}

function reDraw() {
  context.clearRect(0, 0, width, height);
  drawCanvas();
}

function zoomed() {
  var tiles = tile
    .scale(zoom.scale())
    .translate(zoom.translate())
    ();

  projection
    .scale(zoom.scale() / 2 / Math.PI)
    .translate(zoom.translate());

  d3.selectAll("points.arc")
  //.attr("x", function(d) {return projection([d.geometry.coordinates.y,d.geometry.coordinates.x])[0]})
  //.attr("y", function(d) {return projection([d.geometry.coordinates.y,d.geometry.coordinates.x])[1]})
  reDraw();

  var image = layer
    .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
    .selectAll(".tile")
    .data(tiles, function(d) {
      return d;
    });

  image.exit()
    .remove();

  image.enter().append("img")
    .attr("class", "tile")
    .attr("src", function(d) {
      return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".basemaps.cartocdn.com/light_all/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
    .style("left", function(d) {
      return (d[0] << 8) + "px";
    })
    .style("top", function(d) {
      return (d[1] << 8) + "px";
    });
}

function mousemoved() {
  info.text(formatLocation(projection.invert(d3.mouse(this)), zoom.scale()));
}

function matrix3d(scale, translate) {
  var k = scale / 256,
    r = scale % 1 ? Number : Math.round;
  return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1] + ")";
}

function prefixMatch(p) {
  var i = -1,
    n = p.length,
    s = document.body.style;
  while (++i < n)
    if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
  return "";
}

function formatLocation(p, k) {
  var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
  return (p[1] < 0 ? format(-p[1]) + " S" : format(p[1]) + " N") + " " +
    (p[0] < 0 ? format(-p[0]) + " W" : format(p[0]) + " E");
}