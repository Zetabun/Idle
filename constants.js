export const WORLD = { W: 960, H: 500 };

export const ECON = {
  fuelPrice: 2, fuelCap: 100, fuelPerDist: 0.05, fuelReserve: 12,
  refuelTimeMin: 3, refuelTimeMax: 6,
  trafficChancePerSec: 1/90, trafficSpeedMult: 0.6, trafficDurMin: 6, trafficDurMax: 15,
  incidentChancePerSec: 1/140, incidentDurMin: 4, incidentDurMax: 10,
  incidentCostMin: 0, incidentCostMax: 120, // can be 0 (delay-only)
  serviceCostBase: 150,
  refreshNowCost: 50
};

export const BREAKS = {
  minutesPerSecond: 2,
  dinnerEveryMin: 360,
  dinnerDurSecMin: 8, dinnerDurSecMax: 14,
  toiletEveryMinMin: 90, toiletEveryMinMax: 180,
  toiletDurSecMin: 3, toiletDurSecMax: 7
};

export const SPEED = { base: 1.2, tuneStep: 0.2 };

export const WEATHER = [
  { name:"Light Rain", mult:0.9 },
  { name:"Heavy Rain", mult:0.75 },
  { name:"Snow", mult:0.6 },
  { name:"Fog", mult:0.85 },
];
