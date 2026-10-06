const box = document.querySelector("#viz");
const cvs = document.querySelector("#lines");
const pen = cvs.getContext("2d");
let width = 1000; //will be resized 
let height = 600; //will be resized 
let rowHeight;
let root;

//css colours
const css = getComputedStyle(document.documentElement);
const stem_colour = css.getPropertyValue("--stem").trim();

//labels 
const rank_names = ['Kingdom', 'Class', 'Order', 'Family', 'Subfamily', 'Genus', 'Species'];


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
  rowHeight = height / 7;
  const dpr = window.devicePixelRatio || 1;
  cvs.width = Math.round(width * dpr);
  cvs.height = Math.round(height * dpr);

  pen.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawLines();
  drawRankLabels();
  drawTaxonLabels();
}

function drawLines() {
  pen.clearRect(0, 0, width, height);
  if (!root) return;
  pen.beginPath();
  //lookup obj of rank name to row number 
  const rowOf = { family: 4, subfamily: 5, genus: 6, species: 7 };
  for (const leaf of root.leaves()) {
    //draw stem colours
    pen.moveTo(leaf.x0 * width, 0);
    pen.lineTo(leaf.x0 * width, rowHeight * 4);
  }
  pen.strokeStyle = stem_colour;
  pen.stroke();
  //batch colours by group
  const bySub = d3.group(root.leaves(), d => d.data.subfamily);
  for (const [sub, leaves] of bySub) {
    pen.beginPath()
    for (const leaf of leaves) {
      pen.moveTo(leaf.x0 * width, rowHeight * 4);
      pen.lineTo(leaf.x0 * width, rowOf[leaf.data.rank] * rowHeight) //go to row number x rowHeight - lookup
    }
    pen.strokeStyle = getSubColour(sub);
    pen.stroke();
  }
}

//css literals 
function getSubColour(subfamily) {
  const str_colour = `--sub-${(subfamily ?? "Unknown").toLowerCase()}`;
  return css.getPropertyValue(str_colour).trim();
}

//labels 
function drawRankLabels() {
  d3.select("#rank-labels").selectAll("text")
    .data(rank_names).join("text")
    .attr("class", "rank-label")
    .attr("x", 80)
    .attr("y", (d, i) => (i + 0.5) * rowHeight)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(d => d);
}

function drawTaxonLabels() {
  if (!root) return;
  const keep = root.descendants().filter(f => {
    const name = f.data[0];
    if (name == null) return false;
    const needed = name.length * 7 + 8; //est length of label
    if (f.depth < 1 || f.depth > 7) return false;
    return (f.x1 - f.x0) * width > needed;
  });
  d3.select("#overlay").selectAll("text")
    .data(keep).join("text")
    .attr("class", "taxon-label")
    .attr("x", d => (d.x0 + d.x1) / 2 * width)
    .attr("y", d => (d.depth - 0.5) * rowHeight)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .classed("is-italic", d => d.depth >= 6)
    .text(d => d.data[0]);
}
