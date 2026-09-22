const SI_URL = "https://api.si.edu/openaccess/api/v1.0/search";

const OBJS_PER_QUERY = 1000;
const QUERY_TERM = `taxonomicName:"Plantae Monocotyledonae Asparagales Orchidaceae"`;

// list to store objects
const objects = [];

// Wait for html to be available
document.addEventListener("DOMContentLoaded", async () => {
  // our button that starts the query
  const startButton = document.querySelector("#fetch-api");

  // on click
  startButton.addEventListener("click", async () => {
    startButton.style.display = "none";

    // query parameters as an object.
    // easier to read and manipulate.
    // initially going to fetch 0 rows, just to get a total row count
    const params = {
      q: QUERY_TERM,
      api_key: SI_KEY,
      start: 0,
      sort: "id",
      rows: 0
    };

    // this turns the object into text that can be appended to the url
    const paramString = new URLSearchParams(params).toString();

    // fetch and decode response
    const res = await fetch(`${SI_URL}?${paramString}`);
    const data = await res.json();

    console.log("data");

    // row count
    const totalRows = data["response"]["rowCount"];

    console.log(totalRows);

    // fetch in groups of 1000 rows (can be changed above)
    for (let qcnt = 0; qcnt < totalRows / OBJS_PER_QUERY; qcnt += 1) {
      // update parameters to get results starting at rows 0, 1000, 2000, etc
      params.start = qcnt * OBJS_PER_QUERY;
      params.rows = OBJS_PER_QUERY;
      const paramString = new URLSearchParams(params).toString();
      
      console.log("paramString");

      // fetch and decode
      const res = await fetch(`${SI_URL}?${paramString}`);
      const data = await res.json();

      console.log(data);

      // iterate through rows
      for (const row of data.response.rows) {

        // object count
        const ocnt = objects.length;

        console.log(ocnt);

        // print progress every 25 objects
        if (ocnt % 25 == 0) console.log(ocnt, "/", totalRows);

        // show save button after 32 objects have been added to list
        if (ocnt == 100) {
          const b = document.createElement("button");
          b.innerHTML = "save json";
          document.body.appendChild(b);
          b.addEventListener("click", () => saveJSON(objects));
        }

        const toSave = {
          id: row.id,
          url: row.content.descriptiveNonRepeating.guid ?? "",
          name: row.content.descriptiveNonRepeating.title.content ?? "", 
          tax_name: row.content.freetext.taxonomicName?.[0]?.content ?? "" 
        }
        objects.push(toSave);
        }
      }
    });
    console.log(objects.length);
  });