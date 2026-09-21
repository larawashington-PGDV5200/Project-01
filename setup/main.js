const url = new URL("https://api.si.edu/openaccess/api/v1.0/search");
  url.searchParams.set("q", `taxonomicName:"Plantae Monocotyledonae Asparagales Orchidaceae"`);
  url.searchParams.set("row_group", "objects");
  url.searchParams.set("api_key", ${SI_KEY});

document.querySelector("#fetch-api").addEventListener("click", async () => {

    const siRes = await fetch(url);
    const siData = await siRes.json();
    console.log(sidata);
  });