(function(){

// === Diagnostic helpers ===
function __diagBanner(msg){
  try{
    const b = document.createElement('div');
    b.textContent = msg;
    b.style.cssText='position:fixed;left:8px;top:8px;z-index:999999;background:#111;color:#fff;padding:8px 10px;border-radius:8px;font:13px/1.2 system-ui';
    document.body.appendChild(b);
  }catch(e){ console.error(e); }
}
console.log('[parcel-pilot] module loaded');

'use strict';

/* ===== Version & Globals ===== */
const GAME_VERSION = "1.6";

/* ===== DOM Helpers ===== */
const $ = s => document.querySelector(s);

/* ===== Constants / Tunables ===== */
const WORLD = { W: 960, H: 500 };
const ECON = {
  fuelPrice: 2, fuelCap: 100, fuelPerDist: 0.05, fuelReserve: 12,
  refuelTimeMin: 3, refuelTimeMax: 6,
  trafficChancePerSec: 1/90, trafficSpeedMult: 0.6, trafficDurMin: 6, trafficDurMax: 15,
  incidentChancePerSec: 1/140, incidentDurMin: 4, incidentDurMax: 10,
  incidentCostMin: 0, incidentCostMax: 120, // can be 0 (delay-only)
  serviceCostBase: 150,
  refreshNowCost: 50
};
const BREAKS = {
  minutesPerSecond: 2,
  dinnerEveryMin: 360,
  dinnerDurSecMin: 8, dinnerDurSecMax: 14,
  toiletEveryMinMin: 90, toiletEveryMinMax: 180,
  toiletDurSecMin: 3, toiletDurSecMax: 7
};
const SPEED = { base: 1.2, tuneStep: 0.2 };

/* ===== Map / Cities ===== */
const CITIES = [
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
const CITY_BY_ID = Object.fromEntries(CITIES.map(c => [c.id, c]));

/* ===== UK-ish simulated road network between city pairs ===== */
const ROADS = {
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
function pairKey(a,b){
  const p = [a,b].sort().join("-");
  return p;
}
function roadsFor(a,b){
  return ROADS[pairKey(a,b)] || ["A-roads"];
}

/* ===== Utils ===== */
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const dist = (ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const fmtMoney = n => "£" + Math.round(n).toLocaleString("en-GB");
const fmt1 = n => (Math.round(n*10)/10).toFixed(1);
const formatMMSS = s => { s=Math.max(0,Math.floor(s)); const m=String(Math.floor(s/60)).padStart(2,"0"); const ss=String(s%60).padStart(2,"0"); return `${m}:${ss}`; };

/* ===== State ===== */
let S;

function defaultState(){
  return {
    version: GAME_VERSION,
    money: 500,
    day: 1,
    timePlayed: 0,
    lastSaved: Date.now(),
    tutorial: { active: true, firstDelivery:false },
    unlockedCityIds: CITIES.filter(c => c.tutorial).map(c => c.id),
    vans: [{
      id:"V1", name:"Sprinter 1", speed:SPEED.base, capacity:5, x: CITY_BY_ID["BIR"].x, y: CITY_BY_ID["BIR"].y,
      cityId:"BIR", status:"idle", jobId:null, path:[], segIndex:0, totalPathLen:0,
      fuel: ECON.fuelCap, currentWeight: 0, currentPayout: 0, waitTimer: 0, event: null,
      odometer: 0, condition: 100, lastServiceOdo: 0,
      minSinceDinner: 0, minSinceToilet: 0, nextToiletAt: rnd(BREAKS.toiletEveryMinMin, BREAKS.toiletEveryMinMax)
    }],
    jobs: [], jobCounter: 1,
    jobsTimer: 60,
    upgrades: { speedLevel:0, capacityLevel:0, autoDispatch:false, secondVan:false, thirdVan:false },
    stats: { deliveries:0, totalEarned:0 },
    achievements: { firstDelivery:false, tenDeliveries:false, fiveK:false },
    meta: { payoutMult: 1.0, spawnFactor: 1.0, maxJobs: 3, rp: 0, rpRate: 0, corpLevel: 0, corpBonus: 0.0, tickerOn: true, telemetry: false },
    research: { routePlanner:false, smartPricing:false, betterLeads:false, fleetTelemetry:false },
    buildings: { opsDesk:false, rndTeam:false, marketing:false, distroHub:false, garageExpansion:false },
    conditions: [], // global ticker items relevant to active routes
    selections: { vanId: null, jobId: null }
  };
}

/* ===== DOM refs (attached on init) ===== */
let map, ctx, cashEl, dayEl, vanCountEl, jobCountEl, speedStatEl, capStatEl, logEl, jobsEl, vansEl, acceptBtn,
    tutorialCard, unlocksCard, upgradesCard, rpStat, corpBonusEl, researchCard,
    buildingsCard, prestigeCard, jobsTimerEl, refreshNowBtn, toggleTickerBtn, ticker, tickerWrap, tickerInner,
    garageBtn, garageCard, garageEl;

const PBARS = Object.create(null);
const ETAS = Object.create(null);

const WEATHER = [
  { name:"Light Rain", mult:0.9 },
  { name:"Heavy Rain", mult:0.75 },
  { name:"Snow", mult:0.6 },
  { name:"Fog", mult:0.85 },
];

/* ===== Logging ===== */
const CITY_NAMES = new Map(CITIES.map(c => [c.name, c.id]));
function highlightCities(text){
  for (const name of CITY_NAMES.keys()){
    const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "g");
    text = text.replace(re, `<span class="city">${name}</span>`);
  }
  return text;
}
function log(msg, level="info"){
  const time = new Date().toLocaleTimeString();
  const htmlMsg = highlightCities(msg);
  const wrapOpen = level==="critical" ? `<span class="crit">` : ``;
  const wrapClose = level==="critical" ? `</span>` : ``;
  logEl.innerHTML = `[${time}] ${wrapOpen}${htmlMsg}${wrapClose}<br>` + logEl.innerHTML;
}

/* ===== UI ===== */
function updateTopBar(){
  cashEl.textContent = fmtMoney(S.money);
  dayEl.textContent = S.day;
  vanCountEl.textContent = S.vans.length;
  jobCountEl.textContent = S.jobs.length;
  speedStatEl.textContent = (S.vans[0]?.speed ?? SPEED.base).toFixed(1);
  capStatEl.textContent = S.vans[0]?.capacity ?? 5;
  rpStat.textContent = fmt1(S.meta.rp);
  corpBonusEl.textContent = `+${Math.round(S.meta.corpBonus*100)}%`;
  jobsTimerEl.textContent = formatMMSS(S.jobsTimer);
  toggleTickerBtn.textContent = `Ticker: ${S.meta.tickerOn ? "On" : "Off"}`;
  // Enable/disable assign button
  const van = S.vans.find(v => v.id === S.selections.vanId);
  const job = S.jobs.find(j => j.id === S.selections.jobId);
  const ok = !!van && !!job && van.status === "idle" && van.capacity >= job.weight;
  acceptBtn.disabled = !ok;
}
function moneyChanged(){
  updateTopBar();
  redrawUnlocks(); redrawUpgrades(); redrawBuildings(); maybeShowPrestige(); redrawGarage();
}
function redrawJobs(){
  jobsEl.innerHTML = "";
  S.jobs.forEach(job => {
    const el = document.createElement("div");
    el.className = "item"; el.dataset.id = job.id;
    el.innerHTML = `<div class="title">${CITY_BY_ID[job.pick].name} → ${CITY_BY_ID[job.drop].name} ${job.contract?"⭐":""}</div>
                    <div class="meta">Weight: ${job.weight} • Distance: ${Math.round(job.distance)} • Payout: <b>${fmtMoney(job.payout)}</b></div>`;
    el.addEventListener("click", () => {
      S.selections.jobId = job.id;
      jobsEl.querySelectorAll(".item").forEach(n => n.classList.remove("selected"));
      el.classList.add("selected");
      updateTopBar();
    });
    if (S.selections.jobId === job.id) el.classList.add("selected");
    jobsEl.appendChild(el);
  });
  updateTopBar();
}
function vanStatusText(v){
  let base = "";
  switch(v.status){
    case "idle": base = `Waiting at ${CITY_BY_ID[v.cityId]?.name || "Unknown"}`; break;
    case "toPickup": base = "Heading to pickup"; break;
    case "loading": base = "Loading"; break;
    case "toDrop": base = "Delivering"; break;
    case "unloading": base = "Unloading"; break;
    case "refuel": base = "Refueling"; break;
    case "break": base = v.breakKind==="dinner" ? "Dinner break" : "Toilet break"; break;
    case "service": base = "In service"; break;
    default: base = v.status;
  }
  if (v.event){
    base += ` • ${v.event.label || (v.event.type === "traffic" ? "Traffic" : "Incident")}`;
  }
  return base;
}
function fuelPct(v){ return Math.round((v.fuel / ECON.fuelCap) * 100); }
function redrawVans(){
  for (const k in PBARS) delete PBARS[k];
  for (const k in ETAS) delete ETAS[k];
  vansEl.innerHTML = "";
  S.vans.forEach(v => {
    const el = document.createElement("div");
    el.className = "item"; el.dataset.id = v.id;
    el.innerHTML = `<div class="title">${v.name}</div>
      <div class="meta">${vanStatusText(v)} • Speed ${v.speed.toFixed(1)} • Cap ${v.capacity} • Fuel ${fuelPct(v)}% • Cond ${Math.round(v.condition)}%<span id="eta-${v.id}" class="eta"></span></div>`;
    const pbar = document.createElement("div"); pbar.className = "pbar";
    const fill = document.createElement("div"); fill.className = "pfill";
    pbar.appendChild(fill); el.appendChild(pbar);
    el.addEventListener("click", () => {
      S.selections.vanId = v.id;
      vansEl.querySelectorAll(".item").forEach(n => n.classList.remove("selected"));
      el.classList.add("selected");
      updateTopBar();
    });
    if (S.selections.vanId === v.id) el.classList.add("selected");
    vansEl.appendChild(el);
    PBARS[v.id] = fill;
    ETAS[v.id] = el.querySelector(`#eta-${v.id}`);
  });
  updateProgressBars();
}

/* ===== Jobs ===== */
function jobPayout(distance, weight){
  const base = 50 + distance*0.6 + weight*20;
  const mult = S.meta.payoutMult * (1 + S.meta.corpBonus);
  return Math.round((base * mult) / 10) * 10;
}
function generateJob(){
  const unlocked = CITIES.filter(c => S.unlockedCityIds.includes(c.id));
  if (unlocked.length < 2) return null;
  let a = unlocked[rnd(0, unlocked.length-1)];
  let b = unlocked[rnd(0, unlocked.length-1)];
  let safety = 0;
  while (b.id === a.id && safety++ < 5){ b = unlocked[rnd(0, unlocked.length-1)]; }
  const weight = rnd(1, Math.max(1, S.vans[0].capacity));
  const distance = dist(a.x, a.y, b.x, b.y);
  const payout = jobPayout(distance, weight);
  const isContract = Math.random() < 0.10;
  return { id:S.jobCounter++, pick:a.id, drop:b.id, weight, distance, payout: isContract? Math.round(payout*1.25):payout, accepted:false, assignedTo:null, contract:isContract };
}
function fillJobs(){
  const max = S.tutorial.active ? 1 : S.meta.maxJobs;
  while (S.jobs.length < max){
    const j = generateJob();
    if (j) S.jobs.push(j); else break;
  }
  redrawJobs();
}

/* ===== Money ===== */
function addMoney(amount, reason=""){
  S.money += amount;
  if (amount >= 0){ S.stats.totalEarned += amount; }
  moneyChanged();
  if (reason){
    if (amount < 0) log(`${reason}: ${fmtMoney(amount)}`, "critical");
    else log(`${reason}: +${fmtMoney(amount)}`);
  }
}

/* ===== Dispatch & Movement ===== */
function assignSelectedVanToSelectedJob(){
  const van = S.vans.find(v => v.id === S.selections.vanId);
  const job = S.jobs.find(j => j.id === S.selections.jobId);
  if (!van || !job) return;
  if (van.status !== "idle"){ log(`${van.name} is busy.`, "critical"); return; }
  if (van.capacity < job.weight){ log(`${van.name} capacity too low for this job.`, "critical"); return; }

  job.accepted = true; job.assignedTo = van.id;
  van.jobId = job.id; van.currentWeight = job.weight; van.currentPayout = job.payout;

  const cur = { x: van.x, y: van.y };
  const pick = CITY_BY_ID[job.pick]; const drop = CITY_BY_ID[job.drop];
  const seg1Len = dist(cur.x,cur.y,pick.x,pick.y);
  const seg2Len = dist(pick.x,pick.y,drop.x,drop.y);
  van.path = [
    { type:"toPickup", from:{x:cur.x,y:cur.y}, to:{x:pick.x,y:pick.y}, remaining: seg1Len, len: seg1Len, fromId: van.cityId, toId: job.pick, roads: roadsFor(van.cityId, job.pick) },
    { type:"toDrop",   from:{x:pick.x,y:pick.y}, to:{x:drop.x,y:drop.y}, remaining: seg2Len, len: seg2Len, fromId: job.pick, toId: job.drop, roads: roadsFor(job.pick, job.drop) },
  ];
  van.totalPathLen = seg1Len + seg2Len;
  van.segIndex = 0; van.status = "toPickup";
  S.jobs = S.jobs.filter(j => j.id !== job.id);
  S.selections.jobId = null;
  redrawJobs(); redrawVans(); updateTopBar();
  log(`Assigned <b>${van.name}</b> to job #${job.id}: ${pick.name} → ${drop.name} (${job.weight} crates, pays ${fmtMoney(job.payout)})`);
}

/* ===== Event specifics ===== */
const INCIDENTS = [
  { label: "Speed check", delay:[3,8], cost:[0,0] },
  { label: "Debris on carriageway", delay:[4,10], cost:[0,0] },
  { label: "Minor collision", delay:[6,12], cost:[20,90] },
  { label: "Flat tyre", delay:[8,14], cost:[40,120] },
  { label: "Lane closure", delay:[5,12], cost:[0,0] },
  { label: "Roadside inspection", delay:[4,9], cost:[0,30] },
];
function pickIncident(){
  const it = INCIDENTS[rnd(0, INCIDENTS.length-1)];
  const delay = rnd(it.delay[0], it.delay[1]);
  const cost = rnd(it.cost[0], it.cost[1]);
  return { label: it.label, delay, cost };
}

/* ===== Conditions & Ticker (relevant-to-route only) ===== */
function anyRouteTouchesCity(cityId){
  return S.vans.some(v => (v.status==="toPickup"||v.status==="toDrop") && v.path[v.segIndex] && (v.path[v.segIndex].fromId===cityId || v.path[v.segIndex].toId===cityId));
}
function anyRouteMatchesCorridor(a,b){
  return S.vans.some(v => {
    const seg = v.path[v.segIndex]; if (!seg) return false;
    const f=seg.fromId,t=seg.toId;
    return (f===a && t===b) || (f===b && t===a);
  });
}
function addCondition(kind){
  if (kind === "weather"){
    // Only spawn weather if it affects at least one active segment city
    const activeCities = new Set();
    S.vans.forEach(v => {
      const seg = v.path[v.segIndex];
      if (seg && (v.status==="toPickup"||v.status==="toDrop")){ activeCities.add(seg.fromId); activeCities.add(seg.toId); }
    });
    const arr = [...activeCities]; if (arr.length===0) return;
    const cityId = arr[rnd(0, arr.length-1)];
    const city = CITY_BY_ID[cityId];
    const w = WEATHER[rnd(0, WEATHER.length-1)];
    S.conditions.push({ kind:"weather", cities:[cityId], mult:w.mult, ttl:rnd(50,110), label:`Weather: ${w.name} in ${city.name} (${Math.round((1-w.mult)*100)}% slowdown)` });
  }else if (kind === "roadworks"){
    // Spawn only on an active corridor and include a road name
    const corridors = [];
    S.vans.forEach(v => {
      const seg = v.path[v.segIndex];
      if (seg && (v.status==="toPickup"||v.status==="toDrop")){
        corridors.push([seg.fromId, seg.toId]);
      }
    });
    if (corridors.length === 0) return;
    const [a,b] = corridors[rnd(0, corridors.length-1)];
    const list = roadsFor(a,b);
    const road = list[rnd(0, list.length-1)];
    const mult = 0.8;
    S.conditions.push({ kind:"roadworks", corridor:[a,b], road, mult, ttl:rnd(60,140), label:`Roadworks on ${road} ${CITY_BY_ID[a].name} ↔ ${CITY_BY_ID[b].name} (20% slowdown)` });
  }
}
function updateConditions(dt){
  // keep ticker short and relevant
  if (S.conditions.length < 3){
    if (Math.random() < dt/18) addCondition("weather");
    if (Math.random() < dt/22) addCondition("roadworks");
  }
  // age & filter
  S.conditions.forEach(c => c.ttl -= dt);
  S.conditions = S.conditions.filter(c => {
    if (c.kind==="weather"){
      return c.ttl>0 && c.cities.some(id => anyRouteTouchesCity(id));
    }else if (c.kind==="roadworks"){
      const [a,b] = c.corridor; return c.ttl>0 && anyRouteMatchesCorridor(a,b);
    }
    return false;
  });
  renderTicker();
}
function renderTicker(){
  if (!S.meta.tickerOn){ tickerWrap.classList.add("hidden"); return; } else { tickerWrap.classList.remove("hidden"); }
  const items = S.conditions.map(c => ({ tag: c.kind==="weather" ? "WEATHER" : "ROADS", text: c.label }));
  const html = items.map(it => `<span class="titem"><span class="tag">${it.tag}</span><span>${it.text}</span></span>`).join("");
  tickerInner.innerHTML = html + html; // duplicate for seamless loop

  // Animate marquee
  const width = tickerInner.scrollWidth / 2;
  let x = 0;
  const speedPxPerSec = 70;
  function step(){
    x -= speedPxPerSec/60;
    if (-x >= width) x = 0;
    tickerInner.style.transform = `translateX(${x}px)`;
    if (S.meta.tickerOn) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ===== Money helper ===== */
function addMoneyIf(cost){
  if (cost>0){ addMoney(-cost, "Incident expense"); }
}

/* ===== Movement & Events ===== */
function applyGlobalMultipliers(v, baseSpeed){
  let mult = 1.0;
  const seg = v.path[v.segIndex]; if (!seg) return baseSpeed;
  for (const c of S.conditions){
    if (c.kind === "weather"){
      if (c.cities.includes(seg.fromId) || c.cities.includes(seg.toId)) mult *= c.mult;
    }else if (c.kind === "roadworks"){
      const [a,b] = c.corridor;
      if ((a===seg.fromId && b===seg.toId) || (b===seg.fromId && a===seg.toId)) mult *= c.mult;
    }
  }
  return baseSpeed * mult;
}
function maybeRandomEvents(v, dt){
  if ((v.status === "toPickup" || v.status === "toDrop") && !v.event){
    // Traffic (delay only, shown in status)
    if (Math.random() < ECON.trafficChancePerSec * dt){
      const seg = v.path[v.segIndex]; const roads = seg.roads || ["route"];
      const road = roads[rnd(0, roads.length-1)];
      v.event = { type:"traffic", remaining: rnd(ECON.trafficDurMin, ECON.trafficDurMax), label:`Traffic on ${road}` };
      log(`${v.name} hit traffic on <b>${road}</b> near ${CITY_BY_ID[v.cityId].name}.`);
      redrawVans();
    }else{
      // Specific incident (may be delay-only or cost+delay)
      const inc = pickIncident();
      const seg = v.path[v.segIndex]; const roads = seg.roads || ["route"];
      const road = roads[rnd(0, roads.length-1)];
      if (Math.random() < ECON.incidentChancePerSec * dt){
        v.event = { type:"incident", remaining: inc.delay, label: `${inc.label} on ${road}`, cost: inc.cost };
        if (inc.cost>0) addMoney(-inc.cost, `${v.name}: ${inc.label}`); else log(`${v.name}: ${inc.label} on <b>${road}</b> — delay ${inc.delay}s`);
        redrawVans();
      }
    }
  }
  if (v.event){
    v.event.remaining -= dt;
    if (v.event.remaining <= 0){
      log(`${v.name} cleared ${v.event.label || v.event.type}.`);
      v.event = null; redrawVans();
    }
  }
}
function stepBreaks(v, dt){
  const addMin = dt * BREAKS.minutesPerSecond;
  v.minSinceDinner += addMin;
  v.minSinceToilet += addMin;
  if ((v.status === "toPickup" || v.status === "toDrop") && !v.event && v.status!=="refuel"){
    if (v.minSinceDinner >= BREAKS.dinnerEveryMin){
      v.status = "break"; v.breakKind="dinner"; v.waitTimer = rnd(BREAKS.dinnerDurSecMin, BREAKS.dinnerDurSecMax);
      v.minSinceDinner = 0;
      log(`${v.name} taking a dinner break at a service station.`);
      redrawVans();
    }else if (v.minSinceToilet >= v.nextToiletAt){
      v.status = "break"; v.breakKind="toilet"; v.waitTimer = rnd(BREAKS.toiletDurSecMin, BREAKS.toiletDurSecMax);
      v.minSinceToilet = 0; v.nextToiletAt = rnd(BREAKS.toiletEveryMinMin, BREAKS.toiletEveryMinMax);
      log(`${v.name} taking a toilet break.`);
      redrawVans();
    }
  }
}
function stepVan(v, dt){
  if (["loading","unloading","refuel","break","service"].includes(v.status)){
    v.waitTimer -= dt;
    if (v.waitTimer <= 0){
      if (v.status === "loading"){ v.status = "toDrop"; }
      else if (v.status === "unloading"){
        addMoney(v.currentPayout, `${v.name} delivered job #${v.jobId} at ${CITY_BY_ID[v.cityId].name}`);
        S.stats.deliveries += 1;
        if (S.tutorial.active && !S.tutorial.firstDelivery){
          S.tutorial.firstDelivery = true; S.tutorial.active = false;
          log("Tutorial complete! More jobs, upgrades, research, buildings and cities are now unlocked.");
          $("#unlocksCard").classList.remove("hidden");
          $("#upgradesCard").classList.remove("hidden");
          $("#researchCard").classList.remove("hidden");
          $("#buildingsCard").classList.remove("hidden");
        }
        if (!S.achievements.firstDelivery) S.achievements.firstDelivery = true;
        if (!S.achievements.tenDeliveries && S.stats.deliveries >= 10) S.achievements.tenDeliveries = true;
        if (!S.achievements.fiveK && S.stats.totalEarned >= 5000) S.achievements.fiveK = true;
        v.jobId = null; v.path = []; v.segIndex = 0; v.totalPathLen = 0; v.currentWeight = 0; v.currentPayout = 0;
        v.status = "idle";
      }else if (v.status === "refuel"){
        const needed = ECON.fuelCap - v.fuel;
        const cost = needed * ECON.fuelPrice;
        if (S.money >= cost){ addMoney(-cost, `${v.name} refueled`); v.fuel = ECON.fuelCap; }
        else{
          const maxCredit = 100, canSpend = Math.max(0, S.money) + maxCredit;
          const units = Math.min(needed, Math.floor(canSpend / ECON.fuelPrice));
          addMoney(-units * ECON.fuelPrice, `${v.name} refueled (partial/credit)`);
          v.fuel += units;
        }
        v.status = v.segIndex === 0 ? "toPickup" : "toDrop";
      }else if (v.status === "break"){
        v.status = v.segIndex === 0 ? "toPickup" : "toDrop";
      }else if (v.status === "service"){
        v.condition = 100; v.lastServiceOdo = v.odometer; v.status = "idle"; log(`${v.name} finished service.`);
      }
      redrawVans(); redrawAchievements();
    }
    return;
  }

  maybeRandomEvents(v, dt);
  stepBreaks(v, dt);

  if (v.status !== "toPickup" && v.status !== "toDrop") return;
  const seg = v.path[v.segIndex];
  if(!seg){ v.status="idle"; return; }
  const totalDist = seg.len;
  if (totalDist === 0){ advanceSegment(v); return; }

  let effSpeed = applyGlobalMultipliers(v, v.speed);
  if (v.event){
    if (v.event.type === "traffic") effSpeed *= ECON.trafficSpeedMult;
    if (v.event.type === "incident") effSpeed = 0;
  }
  const move = effSpeed * dt;

  if (v.fuel <= ECON.fuelReserve){ triggerRefuel(v); return; }

  const willTravel = Math.min(move, seg.remaining);
  v.x += ((seg.to.x - seg.from.x) / totalDist) * willTravel;
  v.y += ((seg.to.y - seg.from.y) / totalDist) * willTravel;
  seg.remaining -= willTravel;
  v.odometer += willTravel;

  v.fuel = Math.max(0, v.fuel - willTravel * ECON.fuelPerDist);
  v.condition = clamp(v.condition - willTravel * 0.01, 0, 100);

  if (seg.remaining <= 0.0001){ v.x = seg.to.x; v.y = seg.to.y; advanceSegment(v); }
}
function triggerRefuel(v){
  v.status = "refuel"; v.waitTimer = rnd(ECON.refuelTimeMin, ECON.refuelTimeMax); log(`${v.name} added a refuel stop.`);
}
function advanceSegment(v){
  const seg = v.path[v.segIndex];
  if (!seg) { v.status="idle"; return; }
  if (seg.type === "toPickup"){
    v.cityId = seg.toId; v.status = "loading"; v.waitTimer = 2 + v.currentWeight * 0.6;
    log(`${v.name} arrived at ${CITY_BY_ID[v.cityId].name} — loading (${v.waitTimer.toFixed(1)}s).`);
  }else if (seg.type === "toDrop"){
    v.cityId = seg.toId; v.status = "unloading"; v.waitTimer = 3 + v.currentWeight * 0.7;
    log(`${v.name} arrived at ${CITY_BY_ID[v.cityId].name} — unloading (${v.waitTimer.toFixed(1)}s).`);
  }
  v.segIndex = Math.min(v.segIndex+1, v.path.length-1);
  redrawVans();
}

/* ===== Garage ===== */
function redrawGarage(){
  if (garageCard.classList.contains("hidden")) return;
  const tbl = document.createElement("table");
  S.vans.forEach(v => {
    const tr1 = document.createElement("tr");
    tr1.innerHTML = `<td><b>${v.name}</b><br><small class="muted">At ${CITY_BY_ID[v.cityId]?.name || "Road"}</small></td>
                     <td>Fuel ${fuelPct(v)}%<br>Odo ${Math.round(v.odometer)}u</td>`;
    const tr2 = document.createElement("tr");
    const nextServiceIn = Math.max(0, 500 - Math.round(v.odometer - v.lastServiceOdo));
    const btn = document.createElement("button"); btn.className="btn"; btn.textContent="Service Now";
    btn.disabled = S.money < ECON.serviceCostBase;
    btn.addEventListener("click", () => {
      if (S.money < ECON.serviceCostBase) return;
      addMoney(-ECON.serviceCostBase, `${v.name} sent to service`);
      v.status = "service"; v.waitTimer = 8; redrawVans(); redrawGarage();
    });
    const td2 = document.createElement("td");
    td2.innerHTML = `Cond ${Math.round(v.condition)}%<br>Next service in ${nextServiceIn}u`;
    const td3 = document.createElement("td"); td3.appendChild(btn);
    const td1 = tr2.insertCell(); td1.innerHTML = `Status: ${vanStatusText(v)}`;
    tr2.appendChild(td2); tr2.appendChild(td3);
    tbl.appendChild(tr1); tbl.appendChild(tr2);
  });
  garageEl.innerHTML = ""; garageEl.appendChild(tbl);
}

/* ===== Progress & Jobs timer ===== */
function remainingDist(v){ if (!v.path || !v.path.length) return 0; let rem=0; for (let i=v.segIndex;i<v.path.length;i++){ rem+=v.path[i].remaining;} return rem; }
function progressFor(v){ const total=v.totalPathLen||1; const rem=remainingDist(v); return clamp(1 - rem/total, 0, 1); }
function etaFor(v){
  const rem = remainingDist(v);
  let effSpeed = applyGlobalMultipliers(v, v.speed);
  if (v.event){ if (v.event.type === "traffic") effSpeed *= ECON.trafficSpeedMult; if (v.event.type === "incident") effSpeed = 0.1; }
  const spd = Math.max(0.1, effSpeed);
  return Math.max(0, Math.ceil(rem / spd));
}
function updateProgressBars(){
  S.vans.forEach(v => {
    const fill = PBARS[v.id]; if (!fill) return;
    const p = (v.totalPathLen > 0) ? progressFor(v) : 0;
    fill.style.width = (p*100).toFixed(1) + "%";
    const etaEl = ETAS[v.id];
    if (etaEl){
      if (S.meta.telemetry && (v.status === "toPickup" || v.status === "toDrop")) etaEl.textContent = ` • ETA ${etaFor(v)}s`;
      else etaEl.textContent = "";
    }
  });
}
function updateJobsTimer(dt){
  S.jobsTimer -= dt;
  if (S.jobsTimer <= 0){ fillJobs(); S.jobsTimer = 60; log("New jobs posted to the board."); }
}

/* ===== Rendering ===== */
function draw(){
  const ctx = map.getContext("2d");
  ctx.clearRect(0,0,WORLD.W,WORLD.H);
  const g = ctx.createLinearGradient(0,0,0,WORLD.H);
  g.addColorStop(0,"#0a0f22"); g.addColorStop(1,"#0b0e21");
  ctx.fillStyle = g; ctx.fillRect(0,0,WORLD.W,WORLD.H);

  ctx.strokeStyle = "#1a2144"; ctx.lineWidth = 1;
  for (let x=0;x<WORLD.W;x+=80){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,WORLD.H); ctx.stroke(); }
  for (let y=0;y<WORLD.H;y+=80){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(WORLD.W,y); ctx.stroke(); }

  CITIES.forEach(c => {
    const unlocked = S.unlockedCityIds.includes(c.id);
    ctx.globalAlpha = unlocked ? 1 : 0.35;
    ctx.fillStyle = unlocked ? "#9fb4ff" : "#5a6ab0";
    ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#cfe1ff";
    ctx.font = "12px system-ui"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(c.name, c.x+10, c.y);
    ctx.globalAlpha = 1;
  });

  S.vans.forEach(v => {
    if (v.path.length){
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(v.path[0].from.x, v.path[0].from.y);
      v.path.forEach(seg => { ctx.lineTo(seg.to.x, seg.to.y); });
      ctx.stroke();
    }
  });

  S.vans.forEach(v => {
    ctx.fillStyle = "#3bd37f";
    ctx.beginPath(); ctx.arc(v.x, v.y, 5, 0, Math.PI*2); ctx.fill();
    if (S.meta.telemetry && (v.status === "toPickup" || v.status === "toDrop")){
      ctx.fillStyle = "#bde2ff"; ctx.font = "11px system-ui"; ctx.textAlign="left"; ctx.textBaseline="bottom";
      ctx.fillText(`${etaFor(v)}s`, v.x+8, v.y-6);
    }
  });
}

/* ===== World Loop ===== */
let lastT = 0;
function advanceWorld(dt){
  updateConditions(dt);
  updateJobsTimer(dt);
  if (S.meta.rpRate > 0){ S.meta.rp += S.meta.rpRate * dt; }
}
function tick(){
  const now = performance.now() / 1000;
  const dt = Math.min(0.1, now - lastT); lastT = now;
  S.vans.forEach(v => stepVan(v, dt));
  advanceWorld(dt);
  draw(); updateProgressBars(); updateTopBar();
  requestAnimationFrame(tick);
}

/* ===== Save/Load/Offline ===== */
const SAVE_KEY = "parcel-pilot-save-v1.6";
function save(now=false){
  localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  if(now){ S.lastSaved = Date.now(); }
}
function load(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw);
    const base = defaultState();
    S = Object.assign(base, obj);
    ["upgrades","stats","achievements","meta","research","buildings","selections"].forEach(k => S[k] = Object.assign(base[k], obj[k]||{}));
    S.conditions = obj.conditions || [];
    S.unlockedCityIds = S.unlockedCityIds.filter(id => CITY_BY_ID[id]);
    S.vans.forEach(v => {
      if(!Number.isFinite(v.x) || !Number.isFinite(v.y)){ const c = CITY_BY_ID[v.cityId] || CITY_BY_ID["BIR"]; v.x=c.x; v.y=c.y; }
      v.totalPathLen = v.totalPathLen || 0;
      if (v.fuel == null) v.fuel = ECON.fuelCap;
      if (v.waitTimer == null) v.waitTimer = 0;
      if (v.currentWeight == null) v.currentWeight = 0;
      if (v.currentPayout == null) v.currentPayout = 0;
      if (v.odometer == null) v.odometer = 0;
      if (v.condition == null) v.condition = 100;
      if (v.lastServiceOdo == null) v.lastServiceOdo = v.odometer;
      if (v.minSinceDinner == null) v.minSinceDinner = 0;
      if (v.minSinceToilet == null) v.minSinceToilet = 0;
      if (v.nextToiletAt == null) v.nextToiletAt = rnd(BREAKS.toiletEveryMinMin, BREAKS.toiletEveryMinMax);
      if (v.speed > 5) v.speed = SPEED.base + SPEED.tuneStep * (S.upgrades?.speedLevel || 0);
    });
    const elapsedSec = Math.max(0, Math.floor((Date.now() - (S.lastSaved || Date.now()))/1000));
    if (elapsedSec > 0){ offlineSim(elapsedSec); }
    return true;
  }catch(e){ console.warn("Load failed:", e); return false; }
}
function offlineSim(seconds){
  const step = 0.25; let t = 0;
  while (t < seconds){
    const dt = Math.min(step, seconds - t);
    S.vans.forEach(v => stepVan(v, dt));
    advanceWorld(dt);
    t += dt;
  }
  log(`Simulated ${Math.floor(seconds/60)} min offline.`);
}

/* ===== Buttons / Events ===== */
function maybeShowPrestige(){
  const open = S.stats.totalEarned >= 20000 || S.money >= 20000;
  prestigeCard.classList.toggle("hidden", !open);
}
function bindUI(){

  // Diagnostic: check critical DOM nodes exist
  const _ids = ['saveBtn','resetBtn','garageBtn','toggleTickerBtn','refreshNowBtn','acceptBtn','prestigeBtn','importBtn'];
  for (const id of _ids){
    const el = document.getElementById(id);
    if (!el){ console.error('[parcel-pilot] missing #' + id); try{ __diagBanner('Missing #' + id); }catch(_e){} }
  }

  $("#saveBtn").addEventListener("click", () => { save(true); log("Game saved."); });
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("Reset all progress? This cannot be undone.")){
      localStorage.removeItem(SAVE_KEY); S = defaultState(); initAfterLoad(); log("Progress reset.");
    }
  });
  $("#exportBtn").addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob([JSON.stringify(S, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "parcel-pilot-save-v1.6.json"; a.click();
    URL.revokeObjectURL(url);
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const obj = JSON.parse(reader.result);
        if (!obj || typeof obj !== "object") throw new Error("Invalid file");
        localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
        if (load()){ initAfterLoad(); log("Save imported."); }
      }catch(err){ alert("Import failed: "+err.message); }
    };
    reader.readAsText(file);
  });
  $("#acceptBtn").addEventListener("click", assignSelectedVanToSelectedJob);
  $("#refreshNowBtn").addEventListener("click", () => {
    if (S.money < ECON.refreshNowCost){ log("Not enough cash to refresh now."); return; }
    addMoney(-ECON.refreshNowCost, "Job board refreshed"); S.jobsTimer = 0.01;
  });
  $("#toggleTickerBtn").addEventListener("click", () => { S.meta.tickerOn = !S.meta.tickerOn; updateTopBar(); renderTicker(); });
  $("#garageBtn").addEventListener("click", () => { garageCard.classList.toggle("hidden"); redrawGarage(); });
  $("#prestigeBtn").addEventListener("click", () => {
    if (!confirm("Incorporate now? This will reset most progress but grant a permanent +10% payout bonus.")) return;
    const newLevel = (S.meta.corpLevel||0) + 1; const bonus = (S.meta.corpBonus||0) + 0.10;
    localStorage.removeItem(SAVE_KEY); S = defaultState(); S.meta.corpLevel = newLevel; S.meta.corpBonus = bonus;
    log(`Incorporated! Permanent payout bonus is now +${Math.round(bonus*100)}%.`); initAfterLoad();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "?"){
      alert([
        "Parcel Pilot — quick help",
        "• Select a van, then a job, then 'Assign & Dispatch'",
        "• Slower routes (BIR→OXF ~60s), Engine Tune +0.2 u/s",
        "• Scrolling ticker shows only relevant weather/roadworks with real road names",
        "• Incidents are specific (often delay-only) and logged with details",
        "• Vans take dinner/toilet breaks; refuel & service automatic",
        "• Job board refreshes every 60s; pay £50 to refresh instantly",
        "• Garage shows fuel/odometer/condition/service",
      ].join("\n"));
    }
  });
}

/* ===== Unlocks/Upgrades/Research/Buildings (unchanged from 1.5.1) ===== */
function rowBtn(title, sub, btnLabel, disabled, onClick){
  const row = document.createElement("div"); row.className="row";
  row.innerHTML = `<div><h3>${title}</h3><small class="muted">${sub}</small></div><button class="btn">${btnLabel}</button>`;
  const btn = row.querySelector("button"); btn.disabled = !!disabled; btn.addEventListener("click", onClick); return row;
}
function redrawUnlocks(){
  const container = $("#unlocks"); container.innerHTML = "";
  CITIES.forEach(city => {
    const unlocked = S.unlockedCityIds.includes(city.id); if (unlocked) return;
    const row = rowBtn(`${city.name}`, `Unlock for ${fmtMoney(city.cost)}`, "Unlock", S.money < city.cost, () => {
      if (S.money < city.cost) return;
      addMoney(-city.cost, `Unlocked city: ${city.name}`);
      S.unlockedCityIds.push(city.id); redrawUnlocks();
    });
    container.appendChild(row);
  });
  if (container.children.length === 0){ container.innerHTML = `<div class="muted">All available cities are unlocked.</div>`; }
}
function redrawUpgrades(){
  const container = $("#upgrades"); container.innerHTML = "";
  const speedCost = 400 + S.upgrades.speedLevel * 300;
  container.appendChild(rowBtn(`Engine Tune (+0.2 u/s)`, `Level ${S.upgrades.speedLevel} • ${fmtMoney(speedCost)}`, "Buy", S.money < speedCost, () => {
    if (S.money < speedCost) return;
    addMoney(-speedCost, "Purchased Engine Tune");
    S.upgrades.speedLevel += 1; S.vans.forEach(v => v.speed += SPEED.tuneStep);
    redrawUpgrades(); updateTopBar();
  }));
  const capCost = 350 + S.upgrades.capacityLevel * 350;
  container.appendChild(rowBtn(`Storage Racks (+2 cap)`, `Level ${S.upgrades.capacityLevel} • ${fmtMoney(capCost)}`, "Buy", S.money < capCost, () => {
    if (S.money < capCost) return;
    addMoney(-capCost, "Purchased Storage Racks");
    S.upgrades.capacityLevel += 1; S.vans.forEach(v => v.capacity += 2);
    redrawUpgrades(); updateTopBar();
  }));
  const autoCost = 1200;
  container.appendChild(rowBtn(`Auto Dispatcher`, `${S.upgrades.autoDispatch ? "Enabled" : "Picks best job automatically"} • ${fmtMoney(autoCost)}`, S.upgrades.autoDispatch ? "Owned" : "Buy", S.upgrades.autoDispatch || S.money < autoCost, () => {
    if (S.money < autoCost) return;
    addMoney(-autoCost, "Hired Auto Dispatcher");
    S.upgrades.autoDispatch = true;
    redrawUpgrades(); updateTopBar(); autoDispatch();
  }));
  const secondCost = 2000;
  container.appendChild(rowBtn(`Buy Second Van`, `${S.upgrades.secondVan ? "Owned" : "Adds a new van at HQ"} • ${fmtMoney(secondCost)}`, S.upgrades.secondVan ? "Owned" : "Buy", S.upgrades.secondVan || S.money < secondCost, () => {
    if (S.money < secondCost) return;
    addMoney(-secondCost, "Purchased second van");
    const hq = CITY_BY_ID["BIR"]; S.upgrades.secondVan = true;
    S.vans.push({ id:"V2", name:"Sprinter 2", speed:S.vans[0].speed, capacity:S.vans[0].capacity, x:hq.x, y:hq.y, cityId:"BIR",
      status:"idle", jobId:null, path:[], segIndex:0, totalPathLen:0, fuel: ECON.fuelCap, currentWeight:0, currentPayout:0, waitTimer:0, event:null,
      odometer:0, condition:100, lastServiceOdo:0, minSinceDinner:0, minSinceToilet:0, nextToiletAt:rnd(BREAKS.toiletEveryMinMin, BREAKS.toiletEveryMinMax) });
    redrawUpgrades(); updateTopBar(); redrawVans(); if (S.upgrades.autoDispatch) autoDispatch();
  }));
  const thirdCost = 4500; const allowThird = S.buildings.garageExpansion;
  container.appendChild(rowBtn(`Buy Third Van`, `${allowThird ? (S.upgrades.thirdVan ? "Owned" : "Adds a third van at HQ") : "Requires Garage Expansion"} • ${fmtMoney(thirdCost)}`, S.upgrades.thirdVan ? "Owned" : "Buy", !allowThird || S.upgrades.thirdVan || S.money < thirdCost, () => {
    if (!allowThird || S.money < thirdCost) return;
    addMoney(-thirdCost, "Purchased third van");
    const hq = CITY_BY_ID["BIR"]; S.upgrades.thirdVan = true;
    S.vans.push({ id:"V3", name:"Sprinter 3", speed:S.vans[0].speed, capacity:S.vans[0].capacity, x:hq.x, y:hq.y, cityId:"BIR",
      status:"idle", jobId:null, path:[], segIndex:0, totalPathLen:0, fuel: ECON.fuelCap, currentWeight:0, currentPayout:0, waitTimer:0, event:null,
      odometer:0, condition:100, lastServiceOdo:0, minSinceDinner:0, minSinceToilet:0, nextToiletAt:rnd(BREAKS.toiletEveryMinMin, BREAKS.toiletEveryMinMax) });
    redrawUpgrades(); updateTopBar(); redrawVans(); if (S.upgrades.autoDispatch) autoDispatch();
  }));
}
function stateTxt(done, cost, unit){ return done ? "Researched" : `${cost} ${unit}`; }
function labelFor(done){ return done ? "Done" : "Research"; }
function redrawResearch(){
  const container = $("#research"); container.innerHTML = "";
  container.appendChild(rowBtn(`Route Planner (+2 job slots)`, stateTxt(S.research.routePlanner, 10, "RP"), labelFor(S.research.routePlanner), S.research.routePlanner || S.meta.rp < 10, () => {
    S.meta.rp -= 10; S.research.routePlanner = true; S.meta.maxJobs += 2; log("Research: Route Planner (+2 job slots)"); redrawResearch();
  }));
  container.appendChild(rowBtn(`Smart Pricing (+10% payouts)`, stateTxt(S.research.smartPricing, 20, "RP"), labelFor(S.research.smartPricing), S.research.smartPricing || S.meta.rp < 20, () => {
    S.meta.rp -= 20; S.research.smartPricing = true; S.meta.payoutMult += 0.10; log("Research: Smart Pricing (+10% payouts)"); redrawResearch();
  }));
  container.appendChild(rowBtn(`Better Leads (faster job spawns)`, stateTxt(S.research.betterLeads, 15, "RP"), labelFor(S.research.betterLeads), S.research.betterLeads || S.meta.rp < 15, () => {
    S.meta.rp -= 15; S.research.betterLeads = true; S.meta.spawnFactor += 0.5; log("Research: Better Leads (faster spawns)"); redrawResearch();
  }));
  container.appendChild(rowBtn(`Fleet Telemetry (show ETA)`, stateTxt(S.research.fleetTelemetry, 8, "RP"), labelFor(S.research.fleetTelemetry), S.research.fleetTelemetry || S.meta.rp < 8, () => {
    S.meta.rp -= 8; S.research.fleetTelemetry = true; S.meta.telemetry = true; log("Research: Fleet Telemetry (ETA visible)"); redrawResearch(); redrawVans();
  }));
}
function redrawBuildings(){
  const container = $("#buildings"); container.innerHTML = "";
  container.appendChild(rowBtn(`Ops Desk (+0.05 RP/s)`, S.buildings.opsDesk ? "Built" : fmtMoney(800), S.buildings.opsDesk ? "Owned" : "Build", S.buildings.opsDesk || S.money < 800, () => {
    addMoney(-800, "Built Ops Desk"); S.buildings.opsDesk = true; S.meta.rpRate += 0.05; redrawBuildings();
  }));
  container.appendChild(rowBtn(`R&D Team (+0.15 RP/s)`, S.buildings.rndTeam ? "Built" : (S.buildings.opsDesk ? fmtMoney(2500) : "Requires Ops Desk"), S.buildings.rndTeam ? "Owned" : "Build", S.buildings.rndTeam || !S.buildings.opsDesk || S.money < 2500, () => {
    addMoney(-2500, "Built R&D Team"); S.buildings.rndTeam = true; S.meta.rpRate += 0.15; redrawBuildings();
  }));
  container.appendChild(rowBtn(`Marketing Dept (+5% payouts)`, S.buildings.marketing ? "Built" : fmtMoney(1500), S.buildings.marketing ? "Owned" : "Build", S.buildings.marketing || S.money < 1500, () => {
    addMoney(-1500, "Built Marketing Dept"); S.buildings.marketing = true; S.meta.payoutMult += 0.05; redrawBuildings();
  }));
  container.appendChild(rowBtn(`Distribution Hub (+1 job slot)`, S.buildings.distroHub ? "Built" : fmtMoney(1800), S.buildings.distroHub ? "Owned" : "Build", S.buildings.distroHub || S.money < 1800, () => {
    addMoney(-1800, "Built Distribution Hub"); S.buildings.distroHub = true; S.meta.maxJobs += 1; redrawBuildings();
  }));
  container.appendChild(rowBtn(`Garage Expansion (unlock 3rd van)`, S.buildings.garageExpansion ? "Built" : fmtMoney(2200), S.buildings.garageExpansion ? "Owned" : "Build", S.buildings.garageExpansion || S.money < 2200, () => {
    addMoney(-2200, "Built Garage Expansion"); S.buildings.garageExpansion = true; redrawBuildings(); redrawUpgrades();
  }));
}

/* ===== Auto-dispatch (respects new selection flow if enabled) ===== */
function autoDispatch(){
  const idleVans = S.vans.filter(v => v.status === "idle"); if (idleVans.length === 0) return;
  const jobs = [...S.jobs].sort((a,b) => b.payout - a.payout);
  idleVans.forEach(v => {
    const job = jobs.find(j => j && j.weight <= v.capacity);
    if (job){
      S.selections.vanId = v.id; S.selections.jobId = job.id; assignSelectedVanToSelectedJob();
    }
  });
}

/* ===== Bootstrap ===== */
function initAfterLoad(){

  // Diagnostic: verify canvas and context
  try{
    const cnv = document.getElementById('map');
    if (!cnv){ console.error('[parcel-pilot] missing #map canvas'); __diagBanner('Missing #map'); }
    else {
      const ctx = cnv.getContext('2d');
      if (!ctx){ console.error('[parcel-pilot] 2D context failed'); __diagBanner('Canvas 2D failed'); }
    }
  }catch(e){ console.error(e); __diagBanner('Canvas init error: ' + (e && e.message)); }

  // Wire DOM
  map = $("#map"); ctx = map.getContext("2d");
  cashEl=$("#cash"); dayEl=$("#day"); vanCountEl=$("#vanCount"); jobCountEl=$("#jobCount");
  speedStatEl=$("#speedStat"); capStatEl=$("#capStat"); logEl=$("#log");
  jobsEl=$("#jobs"); vansEl=$("#vans"); acceptBtn=$("#acceptBtn");
  tutorialCard=$("#tutorial"); unlocksCard=$("#unlocksCard"); upgradesCard=$("#upgradesCard");
  rpStat=$("#rpStat"); corpBonusEl=$("#corpBonus"); researchCard=$("#researchCard");
  buildingsCard=$("#buildingsCard"); prestigeCard=$("#prestigeCard"); jobsTimerEl=$("#jobsTimer"); refreshNowBtn=$("#refreshNowBtn");
  toggleTickerBtn=$("#toggleTickerBtn"); ticker=$("#ticker"); tickerWrap=$("#tickerWrap"); tickerInner=$("#tickerInner");
  garageBtn=$("#garageBtn"); garageCard=$("#garageCard"); garageEl=$("#garage");

  updateTopBar();
  redrawVans(); redrawJobs(); redrawUnlocks(); redrawUpgrades();
  redrawAchievements(); redrawResearch(); redrawBuildings(); maybeShowPrestige();
  tutorialCard.classList.toggle("hidden", !S.tutorial.active);
  unlocksCard.classList.toggle("hidden", S.tutorial.active);
  upgradesCard.classList.toggle("hidden", S.tutorial.active);
  researchCard.classList.toggle("hidden", S.tutorial.active);
  buildingsCard.classList.toggle("hidden", S.tutorial.active);
  if (S.jobs.length === 0) fillJobs();
  lastT = performance.now() / 1000;
}
function start(){
  S = defaultState();
  load();
  bindUI();
  initAfterLoad();
  setInterval(() => { S.lastSaved = Date.now(); save(); maybeShowPrestige(); }, 10000);
  requestAnimationFrame(tick);
}

/* ===== Achievements (minimal) ===== */
function redrawAchievements(){
  const a = S.achievements;
  $("#achievements").innerHTML = `
    <div>🏁 First Delivery: <b>${a.firstDelivery ? "✔" : "—"}</b></div>
    <div>📦 10 Deliveries: <b>${a.tenDeliveries ? "✔" : `${S.stats.deliveries}/10`}</b></div>
    <div>💰 Earn £5,000: <b>${a.fiveK ? "✔" : fmtMoney(S.stats.totalEarned)}/£5,000</b></div>`;
}

/* Wait for DOM */
window.addEventListener('load', start);

})();