export type ESRegion = { code: string; name: string };

// Comunidades Autônomas (ES usa "CCAA" e não "Estados")
export const REGIONS_ES: readonly ESRegion[] = [
  { code: "AN", name: "Andalucía" },
  { code: "AR", name: "Aragón" },
  { code: "AS", name: "Asturias" },
  { code: "CN", name: "Canarias" },
  { code: "CB", name: "Cantabria" },
  { code: "CM", name: "Castilla-La Mancha" },
  { code: "CL", name: "Castilla y León" },
  { code: "CT", name: "Cataluña" },
  { code: "EX", name: "Extremadura" },
  { code: "GA", name: "Galicia" },
  { code: "IB", name: "Islas Baleares" },
  { code: "RI", name: "La Rioja" },
  { code: "MD", name: "Madrid" },
  { code: "MC", name: "Murcia" },
  { code: "NC", name: "Navarra" },
  { code: "PV", name: "País Vasco" },
  { code: "VC", name: "Comunidad Valenciana" }
];