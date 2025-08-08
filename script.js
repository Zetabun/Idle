// Parcel Tycoon — Idle Delivery (Prototype v0.1)
(() => {
  const el = id => document.getElementById(id);
  const moneyEl = el('money');
  const incomeEl = el('incomePerSec');
  const fuelPriceEl = el('fuelPrice');
  const storageUsageEl = el('storageUsage');
  const gameTimeEl = el('gameTime');
  const truckListEl = el('truckList');
  const contractListEl = el('contractList');
  const researchListEl = el('researchList');
  const mapCanvas = el('mapCanvas');
  const logEl = el('log');
  const routeSelect = el('routeSelect');
  const prestigeEl = el('prestigePoints');
  const prestigeMultEl = el('prestigeMult');

  const btnBuyTruck = el('btnBuyTruck');
  const btnBuyWarehouse = el('btnBuyWarehouse');
  const btnRefuelAll = el('btnRefuelAll');
  const btnGenContract = el('btnGenContract');
  const btnAssignRoute = el('btnAssignRoute');
  const btnPrestige = el('btnPrestige');
  const btnSave = el('btnSave');
  const btnLoad = el('btnLoad');
  const btnExport = el('btnExport');
  const btnImport = el('btnImport');

  const TICK_MS = 250;
  const CONTRACTS_MAX = 6;

  const RNG = mulberry32(hashCode(localStorage.getItem('pt_seed') || seedNew()));

  let G = {
    money: 50,
    incomePerSec: 0,
    fuelPrice: 1.0,
    storage: 0,
    storageCap: 50,
    trucks: [],
    contracts: [],
    warehouses: 0,
    routes: [],
    research: {},
    achievements: {},
    selectedTruck: null,
    timePlayedSec: 0,
    lastTick: Date.now(),
    lastSave: Date.now(),
    prestige: {
      points: 0,
      earnedThisRun: 0,
      multiplier: 1.0,
      lifetimeDeliveries: 0,
    },
  };

  function seedNew() {
    const s = Math.random().toString(36).slice(2);
    localStorage.setItem('pt_seed', s);
    return s;
  }
  function hashCode(str) {
    let h = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      h = ((h << 5) - h) + chr;
      h |= 0;
    }
    return h;
  }
  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  function randRange(min, max) { return min + (max - min) * RNG(); }
  function randInt(min, max) { return Math.floor(randRange(min, max + 1)); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function fmtMoney(n){ return '$' + n.toLocaleString(undefined, {maximumFractionDigits: 0}); }
  function fmtNum(n){ return n.toLocaleString(); }
  function fmt2(n){ return n.toFixed(2); }

  function log(msg){
    const t = new Date().toLocaleTimeString();
    const d = document.createElement('div');
    d.textContent = `[${t}] ${msg}`;
    logEl.prepend(d);
  }

  const cityNames = ["Birmingham","Somerset","London","Manchester","Leeds","Cardiff","Bristol","Oxford","Cambridge","York","Norwich","Exeter","Plymouth","Newcastle","Sheffield","Hull","Reading","Leicester","Nottingham","Derby"];
  let MAP = { cities: [], edges: [] };

  function genMap() {
    const W = mapCanvas.width, H = mapCanvas.height;
    MAP.cities = [];
    for (let i=0;i<12;i++){
      MAP.cities.push({
        id: i,
        name: cityNames[i % cityNames.length],
        x: randInt(40, W-40),
        y: randInt(40, H-40),
        demand: randInt(5, 15),
      });
    }
    MAP.edges = [];
    for (let i=0;i<MAP.cities.length;i++){
      let dists = [];
      for(let j=0;j<MAP.cities.length;j++){
        if(i===j) continue;
        const dx = MAP.cities[i].x - MAP.cities[j].x;
        const dy = MAP.cities[i].y - MAP.cities[j].y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        dists.push({j, dist});
      }
      dists.sort((a,b)=>a.dist-b.dist);
      for (let k=0;k<3;k++){
        const j = dists[k].j;
        const exists = MAP.edges.some(e => (e.a===i && e.b===j) || (e.a===j && e.b===i));
        if(!exists) MAP.edges.push({a:i,b:j,dist:Math.round(dists[k].dist)});
      }
    }
    G.routes = MAP.edges.map((e, idx) => {
      return { id: idx, from: e.a, to: e.b, distance: e.dist, time: Math.max(5, Math.round(e.dist / 3)), demand: randInt(4,12), payoutPerUnit: 5 + randInt(0,5) };
    });
    refreshRoutesUI();
    drawMap();
  }

  function drawMap(){
    const ctx = mapCanvas.getContext('2d');
    const W = mapCanvas.width, H = mapCanvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.globalAlpha = .7;
    ctx.lineWidth = 1;
    for(const e of MAP.edges){
      const a = MAP.cities[e.a], b = MAP.cities[e.b];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = '#394080';
      ctx.stroke();
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
      ctx.fillStyle = '#9fb3ff';
      ctx.font = '10px monospace';
      ctx.fillText(e.dist+'km', mx+4, my-4);
    }
    for(const c of MAP.cities){
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI*2);
      ctx.fillStyle = '#8ad0ff';
      ctx.fill();
      ctx.strokeStyle = '#0e2235';
      ctx.stroke();
      ctx.fillStyle = '#dfe6ff';
      ctx.font = '12px sans-serif';
      ctx.fillText(c.name, c.x+8, c.y-8);
    }
  }

  function refreshRoutesUI(){
    routeSelect.innerHTML = '';
    for(const r of G.routes){
      const opt = document.createElement('option');
      const a = MAP.cities[r.from].name, b = MAP.cities[r.to].name;
      opt.value = r.id;
      opt.textContent = `${a} ↔ ${b} • ${r.distance}km • demand:${r.demand}`;
      routeSelect.appendChild(opt);
    }
  }

  function newTruck(){
    const id = G.trucks.length ? Math.max(...G.trucks.map(t=>t.id))+1 : 1;
    const tier = 1 + Math.floor(G.research['fleet_tier'] || 0);
    const cap = 10 + 5*tier;
    const speed = 1 + 0.15*tier;
    const fuelCap = 50 + 10*tier;
    const eff = 1 - 0.05*(G.research['engine_eff']||0);
    return { id, name: `Truck #${id}`, cap, speed, fuel: fuelCap, fuelCap, eff, routeId: null, busy: false, eta: 0, carrying: 0 };
  }

  function newContract(){
    const r = G.routes[randInt(0, G.routes.length-1)];
    const size = randInt(5, 15);
    const time = Math.max(8, Math.round(r.time * randRange(0.9, 1.4)));
    const base = r.payoutPerUnit * size;
    const payout = Math.round(base * randRange(0.9, 1.3));
    return { id: cryptoId(), from: r.from, to: r.to, size, time, payout, expiresIn: 120 + randInt(0,120), taken: false };
  }

  function cryptoId(){ return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }

  const RESEARCH = [
    { id:'engine_eff', name:'Engine Efficiency I', desc:'-5% fuel consumption', cost:500, max:5 },
    { id:'cargo_cap', name:'Cargo Optimization', desc:'+20% truck capacity', cost:800, max:3 },
    { id:'hq_ops', name:'HQ Ops', desc:'+1 contract slot & +10% income', cost:1200, max:3 },
    { id:'fuel_hedge', name:'Fuel Hedging', desc:'Stabilize fuel price (-20% variance)', cost:1500, max:2 },
    { id:'fleet_tier', name:'Fleet Tier', desc:'Unlock better base trucks', cost:2000, max:5 },
  ];

  function init(){
    genMap();
    for(let i=0;i<3;i++) G.contracts.push(newContract());
    renderAll();
    setInterval(tick, TICK_MS);
    setInterval(autoSave, 15000);
  }

  function renderAll(){
    moneyEl.textContent = fmtMoney(G.money);
    fuelPriceEl.textContent = `$${fmt2(G.fuelPrice)}`;
    storageUsageEl.textContent = `${G.storage}/${G.storageCap}`;
    prestigeEl.textContent = fmtNum(G.prestige.points);
    prestigeMultEl.textContent = fmt2(G.prestige.multiplier);

    truckListEl.innerHTML = '';
    for(const t of G.trucks){
      const d = document.createElement('div');
      d.className = 'card' + (G.selectedTruck===t.id ? ' selected': '');
      const routeStr = t.routeId==null ? '—' : routeLabel(G.routes.find(r=>r.id===t.routeId));
      d.innerHTML = `
        <div><strong>${t.name}</strong>
          <span class="badge">Cap ${Math.round(t.cap * (1 + 0.2*(G.research['cargo_cap']||0)) )}</span>
          <span class="badge">Fuel ${Math.round(t.fuel)}/${t.fuelCap}</span>
          <span class="badge">Speed x${fmt2(t.speed)}</span>
        </div>
        <div class="small">Route: ${routeStr}</div>
        <div class="small">${t.busy ? \`Delivering... ETA \${Math.ceil(t.eta/4)}s | Load \${t.carrying}\` : 'Idle'}</div>
        <div class="button-row">
          <button data-act="dispatch" data-id="${'${t.id}'}" ${'${t.busy?\"disabled\":\"\"}'}>Dispatch</button>
          <button data-act="refuel" data-id="${'${t.id}'}">Refuel</button>
          <button data-act="select" data-id="${'${t.id}'}">Select</button>
        </div>
      `;
      truckListEl.appendChild(d);
    }

    contractListEl.innerHTML = '';
    for(const c of G.contracts){
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = `
        <div><strong>${'${MAP.cities[c.from].name}'} → ${'${MAP.cities[c.to].name}'}</strong>
          <span class="badge">Size ${'${c.size}'}</span>
          <span class="badge">Time ${'${c.time}'}s</span>
          <span class="badge">Payout ${'${fmtMoney(Math.round(c.payout * G.prestige.multiplier))}'}</span>
        </div>
        <div class="small">Expires in ${'${Math.max(0, Math.round(c.expiresIn))}'}s</div>
        <div class="button-row">
          <button data-act="accept" data-id="${'${c.id}'}" ${'${c.taken?\"disabled\":\"\"}'}>Accept</button>
        </div>
      `;
      contractListEl.appendChild(d);
    }

    researchListEl.innerHTML = '';
    for(const r of RESEARCH){
      const lvl = G.research[r.id] || 0;
      const maxed = lvl >= r.max;
      const costAdj = Math.round(r.cost * Math.pow(1.6, lvl));
      const d = document.createElement('div');
      d.className = 'card';
      d.innerHTML = `
        <div><strong>${'${r.name}'}</strong> <span class="badge">Lv ${'${lvl}'}/${'${r.max}'}</span></div>
        <div class="small">${'${r.desc}'}</div>
        <div class="button-row">
          <button data-act="rese" data-id="${'${r.id}'}" ${'${maxed?\"disabled\":\"\"}'}>Research (${ '${fmtMoney(costAdj)}' })</button>
        </div>
      `;
      researchListEl.appendChild(d);
    }

    incomeEl.textContent = fmtMoney(G.incomePerSec);
  }

  function routeLabel(r){ if(!r) return '—'; return `${'${MAP.cities[r.from].name}'} ↔ ${'${MAP.cities[r.to].name}'} (${ '${r.distance}' }km)`; }

  function tick(){
    const now = Date.now();
    const dt = (now - G.lastTick) / 1000;
    G.lastTick = now;
    G.timePlayedSec += dt;

    const drift = randRange(-0.02, 0.02) * (1 - 0.2*(G.research['fuel_hedge']||0));
    G.fuelPrice = clamp(G.fuelPrice + drift*dt, 0.6, 1.8);

    for(const t of G.trucks){
      if(t.busy){
        t.eta -= dt * t.speed;
        const fuelUse = 0.15 * (1 - 0.05*(G.research['engine_eff']||0));
        t.fuel = Math.max(0, t.fuel - fuelUse*dt);
        if (t.fuel <= 0){ t.eta += dt * t.speed; }
        if (t.eta <= 0){
          t.busy = false;
          const c = t._contract;
          if(c){
            const payout = Math.round(c.payout * G.prestige.multiplier);
            G.money += payout;
            G.prestige.lifetimeDeliveries += c.size;
            log(`${'${t.name}'} delivered ${'${c.size}'} units and earned ${'${fmtMoney(payout)}'}.`);
            t._contract = null;
            t.carrying = 0;
          }
        }
      }
    }

    for(const c of G.contracts){
      if(!c.taken){ c.expiresIn -= dt; }
    }
    G.contracts = G.contracts.filter(c => c.expiresIn > 0 || c.taken);

    const hq = G.research['hq_ops'] || 0;
    const passive = hq * 1.5 * G.prestige.multiplier * dt;
    G.money += passive;

    G.incomePerSec = passive * (1/dt);

    if (Math.floor(now/250) % 2 === 0) {
      renderAll();
      drawMap();
      gameTimeEl.textContent = formatHMS(G.timePlayedSec);
    }
  }

  function formatHMS(sec){
    const s = Math.floor(sec);
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60);
    const ss = s%60;
    return `${'${h}'}:${'${String(m).padStart(2,'}'0')}:${'${String(ss).padStart(2,'}'0')}`;
  }

  const btnBuyTruck = document.getElementById('btnBuyTruck');
  const btnBuyWarehouse = document.getElementById('btnBuyWarehouse');
  const btnRefuelAll = document.getElementById('btnRefuelAll');
  const btnGenContract = document.getElementById('btnGenContract');
  const btnAssignRoute = document.getElementById('btnAssignRoute');
  const btnPrestige = document.getElementById('btnPrestige');
  const routeSelect = document.getElementById('routeSelect');

  btnBuyTruck.addEventListener('click', () => {
    const cost = 1000 * (1 + G.trucks.length*0.25);
    if (G.money < cost) return alert('Not enough money!');
    G.money -= cost;
    const t = newTruck();
    G.trucks.push(t);
    log(`Purchased ${'${t.name}'}.`);
    renderAll();
  });

  btnBuyWarehouse.addEventListener('click', () => {
    const cost = 5000 * (1 + G.warehouses*0.35);
    if (G.money < cost) return alert('Not enough money!');
    G.money -= cost;
    G.warehouses += 1;
    G.storageCap += 50;
    log(`Built a warehouse. Storage capacity now ${'${G.storageCap}'}.`);
    renderAll();
  });

  btnRefuelAll.addEventListener('click', () => {
    let cost = 0;
    for(const t of G.trucks){
      const needed = t.fuelCap - t.fuel;
      cost += needed * G.fuelPrice;
    }
    if (G.money < cost) return alert('Not enough money to refuel all!');
    for(const t of G.trucks){ t.fuel = t.fuelCap; }
    G.money -= cost;
    log(`Refueled all trucks for ${'${fmtMoney(Math.round(cost))}'}.`);
    renderAll();
  });

  btnGenContract.addEventListener('click', () => {
    const slots = CONTRACTS_MAX + (G.research['hq_ops']||0);
    const toAdd = Math.max(0, slots - G.contracts.length);
    for(let i=0;i<toAdd;i++) G.contracts.push(newContract());
    if (toAdd === 0) alert('No free contract slots. Research HQ Ops to unlock more!');
    renderAll();
  });

  document.getElementById('truckList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = parseInt(btn.dataset.id);
    const t = G.trucks.find(x=>x.id===id);
    if(!t) return;
    if (btn.dataset.act === 'refuel'){
      const need = t.fuelCap - t.fuel;
      const cost = need * G.fuelPrice;
      if (G.money < cost) return alert('Not enough money!');
      t.fuel = t.fuelCap;
      G.money -= cost;
      log(`Refueled ${'${t.name}'} for ${'${fmtMoney(Math.round(cost))}'}.`);
    }
    if (btn.dataset.act === 'dispatch'){
      const c = G.contracts.find(x => x.taken && !x._assigned);
      if(!c) return alert('No accepted (unassigned) contracts available!');
      if (t.busy) return alert('Truck is busy');
      const route = G.routes.find(r => (r.from===c.from && r.to===c.to) || (r.from===c.to && r.to===c.from));
      if(!route) return alert('No valid route for this contract');
      t.routeId = route.id;
      const capBonus = 1 + 0.2*(G.research['cargo_cap']||0);
      const canCarry = Math.min(c.size, Math.round(t.cap*capBonus));
      t.carrying = canCarry;
      c.size -= canCarry;
      if (c.size <= 0) { c._assigned = true; }
      t.eta = (route.time) / t.speed;
      t.busy = true;
      t._contract = c;
      log(`Dispatched ${'${t.name}'} on ${'${routeLabel(route)}'} carrying ${'${canCarry}'} units.`);
    }
    if (btn.dataset.act === 'select'){ G.selectedTruck = t.id; }
    renderAll();
  });

  btnAssignRoute.addEventListener('click', () => {
    if (G.selectedTruck==null) return alert('Select a truck first.');
    const t = G.trucks.find(x=>x.id===G.selectedTruck);
    const rId = parseInt(routeSelect.value);
    const r = G.routes.find(x=>x.id===rId);
    if (!t || !r) return;
    t.routeId = r.id;
    log(`${'${t.name}'} assigned to ${'${routeLabel(r)}'}.`);
    renderAll();
  });

  document.getElementById('contractList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const c = G.contracts.find(x=>x.id===id);
    if(!c) return;
    if (btn.dataset.act === 'accept'){
      if (c.taken) return;
      if (G.storage + c.size > G.storageCap) return alert('Not enough storage for this contract. Build a warehouse.');
      c.taken = true;
      G.storage += c.size;
      log(`Accepted contract ${'${MAP.cities[c.from].name}'} → ${'${MAP.cities[c.to].name}'} (${ '${c.size}'} units).`);
      renderAll();
    }
  });

  document.getElementById('researchList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const r = RESEARCH.find(x=>x.id===id);
    if(!r) return;
    const lvl = G.research[id] || 0;
    if (lvl >= r.max) return;
    const costAdj = Math.round(r.cost * Math.pow(1.6, lvl));
    if (G.money < costAdj) return alert('Not enough money');
    G.money -= costAdj;
    G.research[id] = lvl + 1;
    log(`Researched ${'${r.name}'} to Lv ${'${G.research[id]}'}.');
    renderAll();
  });

  btnPrestige.addEventListener('click', () => {
    const logos = calcPrestigeLogos(G.prestige.lifetimeDeliveries);
    if (!confirm(`Prestige will reset your run and award ~${'${logos}'} Logos (multiplier). Continue?`)) return;
    G.prestige.points += logos;
    G.prestige.multiplier = 1 + G.prestige.points * 0.05;
    const keep = JSON.parse(JSON.stringify(G.prestige));
    G = { money: 50, incomePerSec: 0, fuelPrice: 1.0, storage: 0, storageCap: 50, trucks: [], contracts: [], warehouses: 0, routes: [], research: {}, achievements: {}, selectedTruck: null, timePlayedSec: 0, lastTick: Date.now(), lastSave: Date.now(), prestige: keep };
    genMap();
    for(let i=0;i<3;i++) G.contracts.push(newContract());
    renderAll();
    log(`Prestiged! Total Logos: ${'${G.prestige.points}'}.');
  });

  function calcPrestigeLogos(lifetime){ return Math.floor(Math.sqrt(lifetime/25)); }

  function save(){
    const data = JSON.stringify(G);
    localStorage.setItem('pt_save', data);
    G.lastSave = Date.now();
    log('Game saved.');
  }
  function load(){
    const data = localStorage.getItem('pt_save');
    if(!data) return alert('No save found.');
    try { G = JSON.parse(data); G.lastTick = Date.now(); renderAll(); log('Game loaded.'); } catch(e){ alert('Save is corrupted.'); }
  }
  function autoSave(){ save(); }

  document.getElementById('btnSave').addEventListener('click', save);
  document.getElementById('btnLoad').addEventListener('click', load);

  document.getElementById('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(G, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'parcel_tycoon_save.json'; a.click(); URL.revokeObjectURL(url);
  });

  document.getElementById('btnImport').addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => {
      const f = inp.files[0]; const reader = new FileReader();
      reader.onload = () => { try { G = JSON.parse(reader.result); G.lastTick = Date.now(); renderAll(); log('Imported save.'); } catch(e){ alert('Invalid save.'); } };
      reader.readAsText(f);
    };
    inp.click();
  });

  window.addEventListener('load', () => {
    const data = localStorage.getItem('pt_save');
    if (data){
      try{
        const last = JSON.parse(data);
        const dt = (Date.now() - last.lastTick)/1000;
        if (dt > 5){
          const gain = Math.min(3600, dt) * (last.incomePerSec || 0);
          G = last;
          G.money += gain;
          log(`While you were away (${ '${Math.floor(dt)}'}s), you earned ~${'${fmtMoney(Math.round(gain))}'}.`);
        } else { G = last; }
      }catch(e){}
    }
    G.lastTick = Date.now();
    renderAll();
  });

  init();
})();