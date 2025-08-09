export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

export const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;

export const dist = (ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);

export const fmtMoney = n => "£" + Math.round(n).toLocaleString("en-GB");

export const fmt1 = n => (Math.round(n*10)/10).toFixed(1);

export const formatMMSS = s => { s=Math.max(0,Math.floor(s));
