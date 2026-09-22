const SI_KEY = "ThznkUYaVUhwZzYRIwiJb2BnyekMUIx19lV6away";

function saveJSON(obj) {
  const jsonString = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.json";
  link.click();

  URL.revokeObjectURL(link.href);
}