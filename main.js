const box = document.querySelector("#viz");
let width = 1000; //will be resized 
let height = 600; //will be resized 
let root;
let speciesScale;
const n_other = 40; //genera with less than 40 specimens get grouped 

//css colours
const css = getComputedStyle(document.documentElement);
const stem_colour = css.getPropertyValue("--stem").trim();
const other_colour = css.getPropertyValue("--other").trim();

//lookups 
const rank_names = ['Family', 'Subfamily', 'Genus'];
const topRow = [null, 0, 0.08, 0.25];
const rowHeights = [null, 0.08, 0.17, 0.75];

//tooltip
const tooltip = d3.select(".tooltip");

let timer = 0;
window.addEventListener("resize", function () {
  clearTimeout(timer);
  timer = setTimeout(resize, 150);
});

d3.json("data/orchid.json")
  .then(data => {
    const cdata = data.map(cleanRecord);
    //grouping genus records less than 40 into 'Other' for legibility of chart
    const genus_cnt = d3.rollup(cdata, v => v.length, d => d.genus); 
    for (const d of cdata) {
      if (d.genus != null && genus_cnt.get(d.genus) < n_other) {
        d.real_genus = d.genus;
        d.genus = "Other";
        if (d.species != null) {
          d.species = d.real_genus + " " + d.species;
        };
      }
    }
    const nested = d3.group(cdata, d => d.family, d => d.subfamily, d => d.genus, d => d.species);
    root = d3.hierarchy(nested)
      .count()
      .sort((a, b) => (a.data[0] === "Other") - (b.data[0] === "Other") || b.value - a.value);
    d3.partition().size([1, 1])(root);
    resize();
  });

function cleanRecord(d) {
  const taxWords = d.tax_name.split(" ");
  const nameWords = d.name.split(" ");
  const badnames = ['Indet.', 'cf.', 'x'];
  const species_badnames = ['sp.', 'cf.', 'aff.', 'x', '×']
  const family = taxWords[3];
  const subfamily = taxWords[4] ?? null;
  const genus = badnames.includes(nameWords[0]) ? null : nameWords[0];
  const species = genus == null ? null : nameWords[1] == null ? null : species_badnames.includes(nameWords[1]) ? null : nameWords[1];
  return {
    id: d.id,
    family,
    subfamily,
    genus,
    species
  };
}

function resize() {
  width = box.clientWidth;
  height = box.clientHeight;
  if (!root) return;
  const genera = root.descendants().filter(d => d.depth === 3 && d.data[0] != null);
  const max_species = d3.max(genera, speciesCount);
  speciesScale = d3.scaleLinear()
    .domain([0, max_species])
    .range([0, rowHeights[3] * height - 2]);
  drawBlocks();
  drawRankLabels();
  drawTaxonLabels();
}

function drawBlocks() {
  if (!root) return;
  const nodes = root.descendants().filter(d => {
    if (d.depth < 1 || d.depth > 3) return false;
    if (d.depth === 3 && d.data[0] == null) return false; // gap for unknown genus
    return true;
  });
  d3.select("#blocks").selectAll("rect")
    .data(nodes).join("rect")
    .attr("x", d => d.x0 * width)
    .attr("y", d => topRow[d.depth] * height)
    .attr("width", d => Math.max((d.x1 - d.x0) * width - 1, 0.5))
    .attr("height", blockHeight)
    .attr("fill", d => blockColour(d))
    .on("mouseenter", (event, d) => {
      tooltip.style("opacity", 0.9).html(tooltipText(d));
    })
    .on("mousemove", (event, d) => {
      tooltip.style("left", event.clientX + 12 + "px")
      .style("top", event.clientY + 12 + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));
}

function blockColour(node) {
  if (node.depth === 1) return stem_colour;
  if (node.data[0] === "Other") return other_colour;
  const sub = node.ancestors().find(a => a.depth === 2).data[0]; //subfamily depth
  return getSubColour(sub);
}

function tooltipText(d) {
  const name = d.data[0] ?? "Unknown subfamily";
  const specimens = `${d.value.toLocaleString()} specimens`;

  if (d.depth < 3) return `<b>${name}</b><br>${specimens}`;
  if (name === "Other") {
    const n_genera = new Set(d.leaves().map(l => l.data.real_genus)).size;
    return `<b>Other genera</b><br>${specimens}<br>${speciesCount(d)} species<br>${n_genera} genera with fewer than ${n_other} specimens`
  };
  const top = d.children.find(c => c.data[0] != null);   //sorted biggest first
  return `<b><i>${name}</i></b><br>${specimens}<br>${speciesCount(d)} species<br>most common: <i>${name} ${top.data[0]}</i>`;
}

function speciesCount(node) {
  return node.children.filter(c => c.data[0] != null).length;
}

function blockHeight(node) {
  const fullRow = rowHeights[node.depth] * height - 2;
  if (node.depth < 3) return fullRow; 
  return speciesScale(speciesCount(node));
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
    .attr("y", (d, i) => (topRow[i + 1] + rowHeights[i + 1] / 2) * height)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(d => d);
}

function drawTaxonLabels() {
  if (!root) return;
  const keep = root.descendants().filter(f => {
    const name = f.data[0];
    if (name == null) return false;
    const needed = name.length * 7 + 6; //est length of label
    if (f.depth < 1 || f.depth > 3) return false;
    return (f.x1 - f.x0) * width > needed;
  });
  d3.select("#overlay").selectAll("text")
    .data(keep).join("text")
    .attr("class", "taxon-label")
    .attr("x", d => (d.x0 + d.x1) / 2 * width)
    .attr("y", d => (topRow[d.depth] * height + blockHeight(d) / 2))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .classed("is-italic", d => d.depth >= 3)
    .text(d => d.data[0]);
}
