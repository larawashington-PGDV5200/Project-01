# Taxonomic Classification of Smithsonian's Orchid Collection

  A D3 visualization of how the Smithsonian's orchid specimens are broken down by
  taxonomy, from Kingdom down to Species.

  **Live:** https://larawashington-pgdv5200.github.io/Project-01/visualization/

  ## Data
  - Source: [Smithsonian Open Access API](https://api.si.edu/openaccess/api/v1.0/search)
  - Query: `taxonomicName:"Plantae Monocotyledonae Asparagales Orchidaceae"`
  - Data file: `data/orchid.json`

  ## Method
  - Each record's taxonomic name is split into ranks: Kingdom → Class → Order →
    Family → Subfamily → Genus → Species
  - Records with uncertain names (`cf.`, `aff.`, `sp.`, `Indet.`, hybrids) stop
    at the last rank they can be confidently placed in
  - Records are nested with `d3.group`, and ranks are laid out as rows with
    `d3.partition`

  ## Built with
  - D3.js v7
  - Canvas (lines) + SVG (labels, overlay)

  ## Structure
  - `setup/` – script that fetches the data from the API
  - `visualization/` – the visualization
  - `data/` – the cleaned orchid dataset
  - `sketches/` – early concept sketches