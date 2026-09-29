const width = 1200;
const height = 600;
const colour = d3.scaleOrdinal(d3.schemeTableau10);

d3.json("../data/orchid.json")
  .then(data => {
    //console.log(data.length);
    //console.log(data[0]);
    const cdata = data.map(cleanRecord);
    //console.log(cdata[0]);
    //console.log(cdata.filter(d => d.genus === "Unknown").length);
    const nested = d3.rollup(cdata, v => v.length, d => d.family, d => d.subfamily, d => d.genus);
    //console.log(nested);
    const root = d3.hierarchy(nested)
      .sum(d => {
        return typeof d[1] === 'number' ? d[1] : 0
      })
      .sort((a, b) => b.value - a.value);
    // console.log(root);
    // console.log(root.value);
    // console.log(root.children[0].children.length);
    const svg = d3.select("#icicle")
      .attr("viewBox", [0, 0, width, height]);
    const rowHeight = height / root.height;
    d3.partition().size([width, height + rowHeight])(root);
    // console.log(root.descendants().length);
    // const orchid = root.children[0];
    // console.log(orchid.x0, orchid.x1);
    // console.log(orchid.y0, orchid.y1);
    // const epi = orchid.children[0];
    // console.log(epi.data[0], epi.x1);

    const nodes = root.descendants().filter(d => d.depth > 0);
    const cell = svg.selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x0}, ${d.y0 - rowHeight})`);
    cell.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => fillColour(d))
      .attr("stroke", "white");
    cell.append("title")
      .text( d => `${d.data[0]}: ${d.value} specimens`);
  });

function cleanRecord(d) {
  const taxWords = d.tax_name.split(" ");
  const nameWords = d.name.split(" ");
  const badnames = ['Indet.', 'cf.', 'x'];
  return {
    family: taxWords[3],
    subfamily: taxWords[4] ?? "Unknown",
    genus: badnames.includes(nameWords[0]) ? "Unknown" : nameWords[0]
  };
}

function fillColour(d) {
  if (d.depth === 1) return "#ccc";
  if (d.depth === 2) return colour(d.data[0]);
  if (d.depth === 3) return colour(d.parent.data[0]);
}

