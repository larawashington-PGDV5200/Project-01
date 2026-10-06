const box = document.querySelector("#viz");
const cvs = document.querySelector("#lines");
const pen = cvs.getContext("2d");
let width = 1000; //will be resized 
let height = 600; //will be resized 
let root;

let timer = 0;
window.addEventListener("resize", function () {
  clearTimeout(timer);
  timer = setTimeout(resize, 150);
});

const colour = d3.scaleOrdinal(d3.schemeTableau10);

d3.json("../data/orchid.json")
  .then(data => {
    //console.log(data.length);
    //console.log(data[0]);
    const cdata = data.map(cleanRecord);
    // console.log(cdata[0]);
    // console.log(cdata.filter(d => d.uncertain).length);
    // console.log(d3.rollup(cdata, v => v.length, d => d.rank));
    const nested = d3.group(cdata, d => d.kingdom, d => d.taxclass, d => d.order, d => d.family, d => d.subfamily, d => d.genus, d => d.species);
    root = d3.hierarchy(nested)
      .count()
      .sort((a, b) => b.value - a.value);
    d3.partition().size([1, 1])(root);
    resize();

    //     .attr("viewBox", [0, 0, width, height]);
    //   const rowHeight = height / root.height;
    //   d3.partition().size([width, height + rowHeight])(root);
    //   // console.log(root.descendants().length);
    //   // const orchid = root.children[0];
    //   // console.log(orchid.x0, orchid.x1);
    //   // console.log(orchid.y0, orchid.y1);

    //   const nodes = root.descendants().filter(d => d.depth > 0);
    //   const cell = svg.selectAll("g")
    //     .data(nodes)
    //     .join("g")
    //     .attr("transform", d => `translate(${d.x0}, ${d.y0 - rowHeight})`);
    //   cell.append("rect")
    //     .attr("width", d => d.x1 - d.x0)
    //     .attr("height", d => d.y1 - d.y0)
    //     .attr("fill", d => fillColour(d))
    //     .attr("stroke", "white");
    //   cell.append("title")
    //     .text(d => `${d.data[0]}: ${d.value} specimens`);
  });

function cleanRecord(d) {
  const taxWords = d.tax_name.split(" ");
  const nameWords = d.name.split(" ");
  const badnames = ['Indet.', 'cf.', 'x'];
  const species_badnames = ['sp.', 'cf.', 'aff.', 'x', '×']
  const kingdom = taxWords[0];
  const taxclass = taxWords[1];
  const order = taxWords[2];
  const family = taxWords[3];
  const subfamily = taxWords[4] ?? null;
  const genus = badnames.includes(nameWords[0]) ? null : nameWords[0];
  const species = genus == null ? null : nameWords[1] == null ? null : species_badnames.includes(nameWords[1]) ? null : nameWords[1];
  const uncertain = (nameWords.includes('cf.') || nameWords.includes('aff.'));
  const rank = species != null ? "species" : genus != null ? "genus" : subfamily != null ? "subfamily" : "family";
  return {
    id: d.id,
    kingdom,
    taxclass,
    order,
    family,
    subfamily,
    genus,
    species,
    uncertain,
    rank
  };
}

function resize() {
  width = box.clientWidth;
  height = box.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  cvs.width = Math.round(width * dpr);
  cvs.height = Math.round(height * dpr);

  pen.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawLines();
}

function drawLines() {
  pen.clearRect(0, 0, width, height);
  if (!root) return;
  pen.beginPath();
  const rowHeight = height / 7;
  //lookup obj of rank name to row number 
  const rowOf = { family: 4, subfamily: 5, genus: 6, species: 7 };
  for (const leaf of root.leaves()) {
    pen.moveTo(leaf.x0 * width, 0);
    pen.lineTo(leaf.x0 * width, rowOf[leaf.data.rank] * rowHeight) //go to row number x rowHeight - lookup. 
  }
  pen.strokeStyle = '#5b4a36';
  pen.stroke();
}

// function fillColour(d) {
//   if (d.depth === 1) return "#ccc";
//   if (d.depth === 2) return colour(d.data[0]);
//   if (d.depth === 3) return colour(d.parent.data[0]);
// }
