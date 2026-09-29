d3.json("../data/orchid.json")
  .then(data => {
    //console.log(data.length);
    //console.log(data[0]);
    const cdata = data.map(cleanRecord);
    //console.log(cdata[0]);
    //console.log(cdata.filter(d => d.genus === "Unknown").length);
    const nested = d3.rollup(cdata, v => v.length, d => d.family, d => d.subfamily, d => d.genus);
    console.log(nested);
    const root = d3.hierarchy(nested)
      .sum(d => {
        return typeof d[1] === 'number' ? d[1] : 0
      })
      .sort((a, b) => b.value - a.value);
    console.log(root);
    console.log(root.value);
    console.log(root.children[0].children.length);

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

