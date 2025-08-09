export const CITIES = [
  { id:"BIR", name:"Birmingham (HQ)", x:480, y:260, cost:0, tutorial:true },
  { id:"OXF", name:"Oxford", x:430, y:310, cost:0, tutorial:true },
  { id:"BRI", name:"Bristol", x:360, y:360, cost:0, tutorial:true },
  { id:"LDN", name:"London", x:560, y:320, cost:0, tutorial:true },
  { id:"LEI", name:"Leicester", x:520, y:240, cost:800 },
  { id:"CAR", name:"Cardiff", x:310, y:380, cost:900 },
  { id:"LIV", name:"Liverpool", x:430, y:180, cost:1200 },
  { id:"MAN", name:"Manchester", x:500, y:160, cost:1600 },
  { id:"SHE", name:"Sheffield", x:560, y:200, cost:1400 },
  { id:"NOR", name:"Norwich", x:700, y:250, cost:1800 },
];

export const CITY_BY_ID = Object.fromEntries(CITIES.map(c => [c.id, c]));

export const ROADS = {
  "BIR-OXF": ["M40","A34"],
  "BIR-LDN": ["M6","M1","M25"],
  "BIR-BRI": ["M5"],
  "BIR-LEI": ["M6","M69"],
  "BIR-CAR": ["M5","M4"],
  "BIR-LIV": ["M6"],
  "BIR-MAN": ["M6"],
  "BIR-SHE": ["M1"],
  "BIR-NOR": ["A14","A11","A47"],
  "OXF-LDN": ["M40","A40"],
  "OXF-BRI": ["A420","M4"],
  "OXF-LEI": ["M40","M69"],
  "OXF-CAR": ["M4"],
  "OXF-LIV": ["M40","M6"],
  "OXF-MAN": ["M40","M6"],
  "OXF-SHE": ["M40","M1"],
  "OXF-NOR": ["A34","A14","A11"],
  "BRI-LDN": ["M4","M25"],
  "BRI-LEI": ["M5","M42","M6","M69"],
  "BRI-CAR": ["M4"],
  "BRI-LIV": ["M5","M6"],
  "BRI-MAN": ["M5","M6"],
  "BRI-SHE": ["M5","M42","M1"],
  "BRI-NOR": ["M4","M25","A11"],
  "LDN-LEI": ["M1"],
  "LDN-CAR": ["M4"],
  "LDN-LIV": ["M1","M6"],
  "LDN-MAN": ["M1","M6"],
  "LDN-SHE": ["M1"],
  "LDN-NOR": ["A11","A47"],
  "LEI-CAR": ["M69","M6","M50","M4"],
  "LEI-LIV": ["M6"],
  "LEI-MAN": ["M6"],
  "LEI-SHE": ["M1"],
  "LEI-NOR": ["A47"],
  "CAR-LIV": ["M4","M5","M6"],
  "CAR-MAN": ["M4","M5","M6"],
  "CAR-SHE": ["M4","M5","M1"],
  "CAR-NOR": ["M4","M25","A11"],
  "LIV-MAN": ["M62"],
  "LIV-SHE": ["M62","M1"],
  "LIV-NOR": ["M62","A1","A47"],
  "MAN-SHE": ["M1"],
  "MAN-NOR": ["M62","A1","A47"],
  "SHE-NOR": ["A1","A47"]
};

export function pairKey(a,b){
  const p = [a,b].sort().join("-");
  return p;
}

export function roadsFor(a,b){
  return ROADS[pairKey(a,b)] || ["A-roads"];
}
