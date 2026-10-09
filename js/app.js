"use strict";
/* ================= DEFAULTS =================
   Public defaults contain illustrative values only. Real company data (grade ranges, allowance policy)
   is loaded on each device from the company settings JSON (Settings > 회사 설정 파일). */
const M = window.OD_MARKET;   // monthly-updated market data (data/market.js)
const DEFAULT_COMPANY = {
  schema: 2,
  grades: [
    {g:"101", pos:"Associate Repair Tech", min:30000000, mid:36000000, max:42000000, inc:8},
    {g:"102", pos:"Support Tech 1",        min:34000000, mid:41000000, max:48000000, inc:10},
    {g:"103", pos:"Support Tech 2",        min:40000000, mid:47000000, max:54000000, inc:10},
    {g:"104", pos:"Repair Engineer",       min:46000000, mid:54000000, max:62000000, inc:12},
    {g:"105", pos:"Senior Repair Engineer",min:54000000, mid:64000000, max:74000000, inc:15},
    {g:"106", pos:"Lead Repair Engineer",  min:64000000, mid:76000000, max:88000000, inc:15}
  ],
  pay: {meal:200000, commute:0, service:0, family:0, skill:0, festival:0, otherExtra:0, insOn:false, flex:0, misc:0},
  insOverride: null, fxOverride: null, marketOverride: null,
  blendWeightCurrent: 60, varRecognition: 70, minRaise: 5, defaultExpectedRaise: 15, stretchUplift: 5, otherExpWeight: 50, defaultMonths: 12,
  raise: [{upTo:85,r:20},{upTo:95,r:15},{upTo:105,r:12},{upTo:115,r:8},{upTo:999,r:5}],
  adj: {edu:{hs:-3,assoc:0,bach:3,master:6}, cert:1.5, certCap:3, interview:{low:-5,mid:0,high:3,top:6}, shift:0, english:{basic:0,biz:2,fluent:4}},
  benefits: [
    {n:"단체상해·의료보험, 종합건강검진 (예시) / Group insurance & health check (example)", v:600000},
    {n:"ESPP·자사주 할인 효과 (해당 시) / Stock purchase discount (if applicable)", v:0},
    {n:"자녀 학자금·경조사 / Tuition & family support", v:0}
  ]
};
const SOURCES = ["foreign_equip","chipmaker","domestic_equip","parts_repair","subcon","other_ind","new_grad"];
const MAX_PEERS = 10;

/* ================= STATE / STORAGE ================= */
const LS = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const clone = o => JSON.parse(JSON.stringify(o));
function mergeCompany(saved){
  const c = Object.assign(clone(DEFAULT_COMPANY), saved || {});
  c.pay = Object.assign(clone(DEFAULT_COMPANY.pay), (saved && saved.pay) || {});
  c.adj = Object.assign(clone(DEFAULT_COMPANY.adj), (saved && saved.adj) || {});
  c.grades = (c.grades || []).map(g => Object.assign({pos:""}, g));
  return c;
}
let C = mergeCompany(LS.get("od_company_v2", null));
let lang = LS.get("od_lang", "ko");
let theme = LS.get("od_theme", "auto");
let selScenario = "target";
let currentId = null;
let peers = [];
const saveC = () => LS.set("od_company_v2", C);

const marketTbl = () => C.marketOverride || M.market;
const INS = () => Object.assign({}, M.insurance, C.insOverride || {});
const FX = () => Number(C.fxOverride) || M.fx.usdkrw;
const t = k => (I18N[lang][k] ?? I18N.ko[k] ?? k);
const fmtT = (k, o) => t(k).replace(/\{(\w)\}/g, (_, x) => o[x]);

/* ================= HELPERS ================= */
const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat("ko-KR");
const won = n => (n == null || !isFinite(n)) ? "—" : nf.format(Math.round(n));
const mil = n => (n == null || !isFinite(n)) ? "—" : (lang === "ko" ? nf.format(Math.round(n/10000)) + "만원" : "₩" + (n/1e6).toFixed(1) + "M");
const pct = (n, d=1) => (n == null || !isFinite(n)) ? "—" : (n*100).toFixed(d) + "%";
const usd = n => (n == null || !isFinite(n)) ? "—" : "$" + nf.format(Math.round(n / FX()));
const parseMoney = s => { const v = String(s ?? "").replace(/[^\d.-]/g, ""); return v === "" ? null : Number(v); };
const num = id => { const el = $(id); if(!el) return null; if(el.classList.contains("money")) return parseMoney(el.value); const v = el.value; return v === "" ? null : Number(v); };
const val = id => $(id).value;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nz = v => v == null ? 0 : v;
function toast(msg){ const el=$("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove("show"),1800); }
const gradeLabel = g => g.pos ? `${g.g} - ${g.pos}` : g.g;

function marketAt(y){
  const m = marketTbl().slice().sort((a,b)=>a.lo-b.lo);
  const pick = r => ({p25:r.p25,p50:r.p50,p75:r.p75,ttc:r.ttc});
  const pts = m.map(r => ({x:(r.lo + Math.min(r.hi, r.lo+6))/2, r}));
  if (y <= pts[0].x) return pick(pts[0].r);
  if (y >= pts[pts.length-1].x) return pick(pts[pts.length-1].r);
  for (let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1];
    if (y>=a.x && y<=b.x){ const f=(y-a.x)/(b.x-a.x); const o={}; ["p25","p50","p75","ttc"].forEach(k=>o[k]=a.r[k]+(b.r[k]-a.r[k])*f); return o; }
  }
  return pick(pts[0].r);
}
function raiseFor(posPct){
  const rows = C.raise.slice().sort((a,b)=>a.upTo-b.upTo);
  for (const r of rows) if (posPct <= r.upTo) return r.r/100;
  return rows[rows.length-1].r/100;
}
// employee social-insurance share on annual base (pension capped on monthly income)
function insAnnual(base){
  const I = INS(), m = base / 12;
  const np = Math.min(m, I.pensionCapMonthly || Infinity) * I.pension/100;
  const hl = m * I.health/100;
  const ltc = hl * I.ltcOfHealth/100;
  const em = m * I.employment/100;
  return (np + hl + ltc + em) * 12;
}
const insTotalRate = () => { const I = INS(); return I.pension + I.health*(1 + I.ltcOfHealth/100) + I.employment; };
// monotonic inverse by bisection
function solve(fn, target){
  let lo = 0, hi = 2e9;
  if (fn(lo) >= target) return 0;
  for (let i=0;i<80;i++){ const mid=(lo+hi)/2; if (fn(mid) < target) lo = mid; else hi = mid; }
  return hi;
}
const roundMonthly = (annual, months) => Math.ceil(annual / months / 10000) * 10000;

/* ================= INPUTS ================= */
const ALLOW_M = ["meal","commute","service","family","skill"];
function readInputs(){
  const o = id => num(id);
  const g = C.grades.find(x => x.g === val("c_grade")) || C.grades[0];
  return {
    name: val("c_name"), grade: g,
    totalYears: o("c_totalYears") ?? 0, relYears: o("c_relYears") ?? 0, age: o("c_age"),
    edu: val("c_edu"), certs: o("c_certs") ?? 0, interview: val("c_interview"), source: val("c_source"), shift: val("c_shift"), english: val("c_english"),
    cur: { monthly: o("cur_monthly"), months: o("cur_months") ?? 12,
      meal:o("cur_meal"), commute:o("cur_commute"), service:o("cur_service"), family:o("cur_family"), skill:o("cur_skill"),
      festival:o("cur_festival"), other:o("cur_other"), incPct:o("cur_incPct") ?? 0, incAmt:o("cur_incAmt"), flex:o("cur_flex"), misc:o("cur_misc") },
    expected: o("c_expected"), competing: o("c_competing"), forfeit: o("c_forfeit"),
    offer: { months:o("o_months"), incPct:o("o_incPct"),
      meal:o("o_meal"), commute:o("o_commute"), service:o("o_service"), family:o("o_family"), skill:o("o_skill"),
      festival:o("o_festival"), otherExtra:o("o_otherExtra"), ins: val("o_ins"), flex:o("o_flex"), misc:o("o_misc"), manual:o("o_manual") },
    peerBasis: val("p_basis") || "base", peerDefRaise: o("p_defRaise")
  };
}

/* ================= CORE CALC ================= */
function compute(I){
  const g = I.grade;
  const vr = C.varRecognition/100;
  const cur = {};
  cur.base = nz(I.cur.monthly) * (I.cur.months || 12);
  cur.items = {}; ALLOW_M.forEach(k => cur.items[k] = nz(I.cur[k]) * 12);
  cur.items.festival = nz(I.cur.festival); cur.items.other = nz(I.cur.other);
  cur.allow = Object.values(cur.items).reduce((a,b)=>a+b,0);
  cur.inc = (I.cur.incAmt != null && I.cur.incAmt > 0) ? I.cur.incAmt : cur.base * nz(I.cur.incPct)/100;
  cur.flex = nz(I.cur.flex); cur.miscOther = nz(I.cur.misc); cur.misc = cur.flex + cur.miscOther;
  cur.fixed = cur.base + cur.allow; cur.ttc = cur.fixed + cur.inc; cur.total = cur.ttc + cur.misc;
  cur.eff = cur.fixed + cur.inc * vr;
  const hasCur = cur.base > 0;

  const effYears = Math.max(0, I.relYears + Math.max(0, I.totalYears - I.relYears) * C.otherExpWeight/100);
  const mk = marketAt(effYears);
  const A = C.adj;
  const adjPct = (A.edu[I.edu] || 0) + Math.min(I.certs, A.certCap) * A.cert + (A.interview[I.interview] || 0) + (I.shift === "yes" ? A.shift : 0) + (A.english[I.english] || 0);
  const adj = 1 + adjPct/100;
  const mktFixed = mk.p50 * adj;

  // offer structure (blank → company default)
  const P = C.pay, O = I.offer;
  const months = O.months || C.defaultMonths;
  const incPct = (O.incPct != null ? O.incPct : g.inc) / 100;
  const items = {}; ALLOW_M.forEach(k => items[k] = (O[k] != null ? O[k] : P[k]) * 12);
  items.festival = O.festival != null ? O.festival : P.festival;
  const otherExtra = O.otherExtra != null ? O.otherExtra : P.otherExtra;
  const insOn = (O.ins || (P.insOn ? "on" : "off")) === "on";
  const allowFixed = Object.values(items).reduce((a,b)=>a+b,0) + otherExtra;
  const allowOf = b => allowFixed + (insOn ? insAnnual(b) : 0);
  const flex = O.flex != null ? O.flex : P.flex;
  const miscOther = O.misc != null ? O.misc : P.misc;
  const misc = flex + miscOther;
  const fixedOf = b => b + allowOf(b);
  const effOf = b => fixedOf(b) + b * incPct * vr;
  const ttcOf = b => fixedOf(b) + b * incPct;

  const curPos = hasCur ? cur.fixed / mktFixed : null;
  const raise = hasCur ? raiseFor(curPos*100) : null;
  const expRaise = (I.expected && hasCur) ? (I.expected / cur.ttc - 1) : C.defaultExpectedRaise/100;

  const baseMarket = solve(fixedOf, mktFixed);
  const baseCurrent = hasCur ? solve(effOf, cur.eff * (1 + raise)) : null;
  const w = hasCur ? C.blendWeightCurrent/100 : 0;
  let target = hasCur ? w*baseCurrent + (1-w)*baseMarket : baseMarket;
  const floorB = hasCur ? Math.max(solve(effOf, cur.eff * (1 + C.minRaise/100)), g.min) : Math.max(solve(fixedOf, mk.p25*adj), g.min);
  let capped = false, raisedToMin = false;
  if (target < floorB) target = floorB;
  if (target < g.min){ target = g.min; raisedToMin = true; }
  if (target > g.max){ target = g.max; capped = true; }
  let stretchNeed = target * (1 + C.stretchUplift/100);
  if (I.expected) stretchNeed = Math.max(stretchNeed, solve(ttcOf, I.expected));
  if (I.competing) stretchNeed = Math.max(stretchNeed, solve(ttcOf, I.competing * 1.03));
  const stretch = Math.max(Math.min(stretchNeed, g.max), target);

  const mkScenario = (key, baseAnnual) => {
    const mb = roundMonthly(baseAnnual, months);
    const base = mb * months;
    const ins = insOn ? Math.round(insAnnual(base)) : 0;
    const it = Object.assign({}, items, {otherIns: ins, otherExtra, other: ins + otherExtra});
    const allow = allowFixed + ins;
    const inc = base * incPct;
    const fixed = base + allow, ttc = fixed + inc, total = ttc + misc, eff = fixed + inc * vr;
    const o = {key, monthly: mb, months, base, items: it, allow, inc, incPct, flex, miscOther, misc, fixed, ttc, total, eff,
      pir: (base - g.min) / (g.max - g.min), cr: base / g.mid,
      raiseTTC: hasCur ? ttc / cur.ttc - 1 : null, raiseEff: hasCur ? eff / cur.eff - 1 : null};
    let risk;
    if (hasCur){ const r = o.raiseEff, e = expRaise; risk = r >= e ? "low" : (r >= e - 0.05 ? "mid" : "high"); }
    else risk = fixed >= mk.p50*adj ? "low" : fixed >= mk.p25*adj ? "mid" : "high";
    if (I.competing && ttc < I.competing) risk = "high";
    else if (I.expected && ttc >= I.expected) risk = "low";
    o.risk = risk;
    return o;
  };
  const sc = { floor: mkScenario("floor", floorB), target: mkScenario("target", target), stretch: mkScenario("stretch", stretch) };
  if (O.manual) sc.manual = mkScenario("manual", O.manual);
  if (!sc[selScenario]) selScenario = "target";
  const chosen = sc[selScenario];

  let signOn = 0;
  if (stretchNeed > g.max) signOn = Math.max(signOn, ttcOf(stretchNeed) - ttcOf(g.max));
  if (I.forfeit) signOn = Math.max(signOn, I.forfeit);
  signOn = Math.round(signOn / 100000) * 100000;

  // internal peers
  const basisVal = s => I.peerBasis === "fixed" ? s.fixed : I.peerBasis === "ttc" ? s.ttc : s.base;
  const offerVal = basisVal(chosen);
  const pr = peers.filter(p => nz(p.salary) > 0).map(p => {
    const r = (p.raise !== "" && p.raise != null) ? Number(p.raise) : nz(I.peerDefRaise);
    const proj = p.salary * (1 + r/100);
    return Object.assign({}, p, {r, proj, gap: offerVal - proj, gapPct: offerVal/proj - 1, near: p.tenure !== "" && p.tenure != null && Math.abs(Number(p.tenure) - I.relYears) <= 2});
  });
  let peerStat = null;
  if (pr.length){
    const v = pr.map(p=>p.proj);
    peerStat = {avg: v.reduce((a,b)=>a+b,0)/v.length, max: Math.max(...v), min: Math.min(...v), rank: v.filter(x => x > offerVal).length + 1, n: v.length};
  }

  // flags
  const flags = [];
  const mwAnnual = M.minWage.hourly * M.minWage.monthlyHours * 12;
  const mwNext = (M.minWage.nextHourly || M.minWage.hourly) * M.minWage.monthlyHours * 12;
  const hourly = chosen.fixed / 12 / M.minWage.monthlyHours;
  if (hourly < M.minWage.hourly) flags.push(["bad", fmtT("fl_minwage", {a: won(chosen.fixed/12), b: won(hourly), c: won(M.minWage.hourly)})]);
  if (g.min < Math.max(mwAnnual, mwNext)) flags.push(["warn", fmtT("fl_bandMinBelowMW", {a: won(g.min), b: `${M.minWage.year} ${won(mwAnnual)} / ${M.minWage.nextYear || ""} ${won(mwNext)}`})]);
  if (capped || stretchNeed > g.max) flags.push(["warn", fmtT("fl_overMax", {a: won(signOn)})]);
  if (raisedToMin) flags.push(["info", t("fl_belowMin")]);
  if (hasCur){
    const r = chosen.raiseEff;
    flags.push(r < expRaise - 0.0001 ? ["bad", fmtT("fl_lowRaise", {a:(r*100).toFixed(1), b:(expRaise*100).toFixed(1)})] : ["good", fmtT("fl_okRaise", {a:(r*100).toFixed(1), b:(expRaise*100).toFixed(1)})]);
  } else flags.push(["info", t("fl_noCurrent")]);
  if (I.competing && chosen.ttc < I.competing) flags.push(["bad", fmtT("fl_competing", {a: won(I.competing), b: won(chosen.ttc)})]);
  if (peerStat){
    if (offerVal > peerStat.max) flags.push(["warn", fmtT("fl_peerOver", {a: won(offerVal), b: won(peerStat.max)})]);
    else if (offerVal > peerStat.avg * 1.05) flags.push(["info", fmtT("fl_peerAbove", {a: ((offerVal/peerStat.avg-1)*100).toFixed(1)})]);
    else flags.push(["good", fmtT("fl_peerOk", {a: mil(peerStat.min), b: mil(peerStat.max)})]);
  }
  if (I.forfeit) flags.push(["warn", fmtT("fl_forfeit", {a: won(I.forfeit)})]);
  if (I.source === "chipmaker") flags.push(["info", t("fl_chipmaker")]);
  if (chosen.pir > 0.75) flags.push(["warn", fmtT("fl_highPIR", {a: (chosen.pir*100).toFixed(0)})]);
  if (I.age) flags.push(["info", t("fl_age")]);

  return {g, cur, hasCur, effYears, mk, adj, adjPct, mktFixed, curPos, raise, expRaise, months, incPct, insOn, sc, chosen, signOn, flags, w, pr, peerStat, offerVal};
}

/* ================= RENDER: DESIGN ================= */
let R = null, IN = null;
const scName = {floor:"scFloor", target:"scTarget", stretch:"scStretch", manual:"scManual"};
function render(){
  if (!C.grades.length) return;
  IN = readInputs();
  R = compute(IN);
  persistDraft();
  updatePlaceholders();
  const c = R.cur;
  $("kpis").innerHTML = [
    [t("kCurTTC"), R.hasCur ? mil(c.ttc) : "—", R.hasCur ? `${t("fixedCash")} ${mil(c.fixed)}` : ""],
    [t("kEffYears"), R.effYears.toFixed(1) + (lang==="ko"?"년":" yrs"), `${t("fRelYears")} ${IN.relYears}`],
    [t("kMktP50"), mil(R.mktFixed), `${R.adjPct>=0?"+":""}${R.adjPct.toFixed(1)}% adj.`],
    [t("kCurPos"), R.curPos ? pct(R.curPos,0) : "—", R.raise!=null ? `→ +${(R.raise*100).toFixed(0)}%` : ""]
  ].map(([k,v,d]) => `<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join("");

  const keys = ["floor","target","stretch"].concat(R.sc.manual ? ["manual"] : []);
  const riskPill = r => `<span class="pill ${r==="low"?"good":r==="mid"?"warn":"bad"}">${t("risk")} ${t(r==="low"?"riskLow":r==="mid"?"riskMid":"riskHigh")}</span>`;
  $("scenarios").style.gridTemplateColumns = window.innerWidth > 640 ? `repeat(${keys.length},minmax(0,1fr))` : "";
  $("scenarios").innerHTML = keys.map(k => {
    const s = R.sc[k];
    return `<div class="sc ${k===selScenario?"sel":""}" data-sc="${k}" role="button" tabindex="0">
      <div class="t"><span>${t(scName[k])}</span>${riskPill(s.risk)}</div>
      <div class="v">${mil(s.base)}</div>
      <div class="s">${t("monthlyBase")} ${won(s.monthly)} × ${s.months}</div>
      <div class="kv">
        <span>${t("fixedCash")}</span><b>${mil(s.fixed)}</b>
        <span>${t("ttc")}</span><b>${mil(s.ttc)}</b>
        <span>${t("totalPkg")}</span><b>${mil(s.total)}</b>
        <span>${t("raiseTTC")}</span><b>${s.raiseTTC!=null?pct(s.raiseTTC):"—"}</b>
        <span>${t("raiseEff")}</span><b>${s.raiseEff!=null?pct(s.raiseEff):"—"}</b>
        <span>PIR / CR</span><b>${pct(s.pir,0)} / ${pct(s.cr,0)}</b>
      </div></div>`;
  }).join("");
  $("chart").innerHTML = positionChart();
  renderPeerResult();
  $("flags").innerHTML = R.flags.map(([cls, msg]) => `<li class="${cls}"><span class="ic">${cls==="good"?"✓":cls==="bad"?"!":cls==="warn"?"△":"i"}</span><span>${esc(msg)}</span></li>`).join("");
  $("rationale").textContent = rationale();
  renderSheet(); renderRewards();
}

function updatePlaceholders(){
  const P = C.pay;
  ALLOW_M.forEach(k => $("o_"+k).placeholder = won(P[k]));
  $("o_festival").placeholder = won(P.festival); $("o_otherExtra").placeholder = won(P.otherExtra);
  $("o_flex").placeholder = won(P.flex); $("o_misc").placeholder = won(P.misc);
  $("o_months").placeholder = C.defaultMonths; $("o_incPct").placeholder = IN.grade.inc;
  $("p_defRaise").placeholder = "0";
}

function positionChart(){
  const g = R.g, s = R.sc, adjA = R.adj;
  const mkB = v => v - (s.target.fixed - s.target.base);   // market contract salary → approx. base
  const mk25 = mkB(R.mk.p25*adjA), mk75 = mkB(R.mk.p75*adjA), mk50 = mkB(R.mk.p50*adjA);
  const vals = [g.min, g.max, mk25, mk75, s.floor.base, s.stretch.base];
  if (R.hasCur) vals.push(R.cur.base);
  if (R.peerStat && IN.peerBasis === "base") vals.push(R.peerStat.min, R.peerStat.max);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || 1e6; lo -= pad; hi += pad;
  const W = 640, H = 180, L = 12, Rr = 12;
  const x = v => L + (v - lo) / (hi - lo) * (W - L - Rr);
  const near = (a,b) => Math.abs(x(a)-x(b)) < 18;
  const tick = (v, y, color, label, up) => `<line x1="${x(v)}" x2="${x(v)}" y1="${y-14}" y2="${y+14}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <text x="${x(v)}" y="${up ? y-20 : y+28}" text-anchor="middle" font-size="11" fill="${color}" font-weight="600">${label}</text>`;
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="positioning chart">
   <rect x="${x(g.min)}" y="34" width="${x(g.max)-x(g.min)}" height="22" rx="5" fill="var(--band)"/>
   <text x="${x(g.min)}" y="72" font-size="10.5" fill="var(--muted)">Min ${mil(g.min)}</text>
   <text x="${x(g.max)}" y="72" font-size="10.5" fill="var(--muted)" text-anchor="end">Max ${mil(g.max)}</text>
   <line x1="${x(g.mid)}" x2="${x(g.mid)}" y1="30" y2="60" stroke="var(--muted)" stroke-dasharray="3 3"/>
   <text x="${x(g.mid)}" y="26" font-size="10.5" fill="var(--muted)" text-anchor="middle">Mid</text>
   <rect x="${x(mk25)}" y="98" width="${Math.max(2,x(mk75)-x(mk25))}" height="14" rx="4" fill="var(--mkt)" opacity=".75"/>
   <line x1="${x(mk50)}" x2="${x(mk50)}" y1="94" y2="116" stroke="var(--mkt)" stroke-width="2"/>`;
  if (R.peerStat && IN.peerBasis === "base") R.pr.forEach(p => { svg += `<circle cx="${x(p.proj)}" cy="86" r="4" fill="var(--warn)" opacity=".85"/>`; });
  svg += tick(s.floor.base, 140, "var(--floor)", "F", false);
  svg += tick(s.target.base, near(s.target.base, s.floor.base) ? 128 : 140, "var(--target)", "T", near(s.target.base, s.floor.base));
  svg += tick(s.stretch.base, 140, "var(--stretch)", near(s.stretch.base, s.target.base) ? "" : "S", false);
  if (R.hasCur) svg += tick(R.cur.base, 45, "var(--cur)", t("lgCur"), true);
  svg += `</svg>`;
  const peerLg = (R.peerStat && IN.peerBasis === "base") ? `<span><i style="background:var(--warn);border-radius:50%"></i>${lang==="ko"?"내부 비교군(인상 후)":"Peers (projected)"}</span>` : "";
  return svg + `<div class="legend"><span><i style="background:var(--band)"></i>${t("lgBand")} (${esc(gradeLabel(g))})</span><span><i style="background:var(--mkt)"></i>${t("lgMkt")}</span>${R.hasCur?`<span><i style="background:var(--cur)"></i>${t("lgCur")} ${mil(R.cur.base)}</span>`:""}${peerLg}<span><i style="background:var(--floor)"></i>F ${mil(s.floor.base)}</span><span><i style="background:var(--target)"></i>T ${mil(s.target.base)}</span><span><i style="background:var(--stretch)"></i>S ${mil(s.stretch.base)}</span></div>`;
}

/* ================= PEERS ================= */
function blankPeer(){ return {label:"", tenure:"", grade:"", salary:null, raise:""}; }
function renderPeerInputs(){
  if (!peers.length) peers = [blankPeer()];
  const gradeOpts = sel => `<option value=""></option>` + C.grades.map(g=>`<option value="${esc(g.g)}" ${g.g===sel?"selected":""}>${esc(g.g)}</option>`).join("");
  const lb = k => `<span class="l">${t(k)}</span>`;
  $("peerTbl").innerHTML = peers.map((p,i)=>`<div class="peer-row" data-i="${i}">
      <div class="peer-no">${i+1}</div>
      <label class="f">${lb("pLabel")}<input data-pk="label" value="${esc(p.label)}" maxlength="20"></label>
      <label class="f">${lb("pTenure")}<input data-pk="tenure" class="num" type="number" min="0" step="0.5" inputmode="decimal" value="${esc(p.tenure)}"></label>
      <label class="f">${lb("pGrade")}<select data-pk="grade">${gradeOpts(p.grade)}</select></label>
      <label class="f">${lb("pSalary")}<input data-pk="salary" class="num money" inputmode="numeric" value="${p.salary!=null?won(p.salary):""}"></label>
      <label class="f">${lb("pRaise")}<input data-pk="raise" class="num" type="number" step="0.1" inputmode="decimal" value="${esc(p.raise)}" placeholder="${esc($("p_defRaise").value || "0")}"></label>
      <button class="btn danger peer-del" data-prm="${i}" aria-label="delete">✕</button>
    </div>`).join("");
  wireMoney($("peerTbl"));
  $("btnAddPeer").disabled = peers.length >= MAX_PEERS;
}
function onPeerInput(e){
  const tr = e.target.closest("[data-i]"); if (!tr || !e.target.dataset.pk) return;
  const p = peers[+tr.dataset.i], k = e.target.dataset.pk;
  p[k] = k === "salary" ? parseMoney(e.target.value) : e.target.value;
  clearTimeout(onPeerInput._t); onPeerInput._t = setTimeout(render, 120);
}
function renderPeerResult(){
  const el = $("peerResult");
  if (!R.peerStat){ el.innerHTML = `<p class="hint">${t("peerNone")}</p>`; return; }
  const st = R.peerStat, basisName = t(IN.peerBasis==="fixed"?"basisFixed":IN.peerBasis==="ttc"?"basisTtc":"basisBase");
  el.innerHTML = `<div class="kpis">
     <div class="kpi"><div class="k">${lang==="ko"?"후보자 오퍼":"Candidate offer"} · ${esc(basisName)}</div><div class="v">${mil(R.offerVal)}</div></div>
     <div class="kpi"><div class="k">${t("peerAvg")}</div><div class="v">${mil(st.avg)}</div><div class="d">${pct(R.offerVal/st.avg-1)}</div></div>
     <div class="kpi"><div class="k">${t("peerMin")} ~ ${t("peerMax")}</div><div class="v" style="font-size:15px">${mil(st.min)} ~ ${mil(st.max)}</div></div>
     <div class="kpi"><div class="k">${t("peerRank")}</div><div class="v">${st.rank} / ${st.n+1}</div></div>
   </div>
   <div class="tbl-wrap"><table>
    <tr><th>#</th><th class="l">${t("pLabel")}</th><th>${t("pTenure")}</th><th>${t("pGrade")}</th><th>${t("pSalary")}</th><th>${t("pRaise")}</th><th>${t("pProj")}</th><th>${t("pGap")}</th><th>${t("pGapPct")}</th></tr>
    ${R.pr.map((p,i)=>`<tr class="${p.near?"near":""}"><td>${i+1}</td><td class="l">${esc(p.label||"—")}</td><td>${esc(p.tenure||"—")}</td><td>${esc(p.grade||"—")}</td><td>${won(p.salary)}</td><td>${p.r.toFixed(1)}%</td><td><b>${won(p.proj)}</b></td><td class="${p.gap>=0?"pos":"neg"}">${p.gap>=0?"+":""}${won(p.gap)}</td><td class="${p.gap>=0?"pos":"neg"}">${pct(p.gapPct)}</td></tr>`).join("")}
   </table></div>`;
}

/* ================= RATIONALE ================= */
function rationale(){
  const I = IN, c = R.cur, s = R.chosen, ko = lang === "ko";
  const L = [];
  L.push(t("ratTitle") + " " + (I.name || (ko?"후보자":"Candidate")) + " · " + gradeLabel(R.g));
  const scn = t(scName[s.key]);
  if (ko){
    L.push(`1) 경력: 총 ${I.totalYears}년 / 관련 ${I.relYears}년 → 유효 경력 ${R.effYears.toFixed(1)}년 (비관련 경력 ${C.otherExpWeight}% 인정)`);
    L.push(`2) 시장 기준(${M.updatedAt}): 계약연봉 P25 ${mil(R.mk.p25)} / P50 ${mil(R.mk.p50)} / P75 ${mil(R.mk.p75)}, 학력·자격·면접 등 보정 ${R.adjPct>=0?"+":""}${R.adjPct.toFixed(1)}% → 목표 계약연봉 ${mil(R.mktFixed)}`);
    if (R.hasCur){
      L.push(`3) 현재 보상: 고정연봉 ${mil(c.fixed)}, 최근 1년 성과급 ${mil(c.inc)}, 총현금 ${mil(c.ttc)} (시장 중위 대비 ${pct(R.curPos,0)}) → 목표 인상률 ${(R.raise*100).toFixed(0)}%`);
      L.push(`4) 산정: 현 연봉 기준 ${(R.w*100).toFixed(0)}% + 시장 기준 ${(100-R.w*100).toFixed(0)}% 가중 평균 후, 내부 밴드(${mil(R.g.min)}~${mil(R.g.max)}) 내로 조정`);
    } else L.push(`3) 현재 보상 정보 없음 → 시장 기준으로만 산정, 내부 밴드(${mil(R.g.min)}~${mil(R.g.max)}) 내로 조정`);
    L.push(`5) 제안(${scn}): 월 기본급 ${won(s.monthly)}원 × ${s.months}개월 = 연 기본급 ${won(s.base)}원`);
    L.push(`   · 고정수당 ${won(s.allow)}원${R.insOn?` (4대보험 근로자분 지원 ${won(s.items.otherIns)}원 포함)`:""}, 목표 인센티브 ${won(s.inc)}원, 복지포인트·기타 ${won(s.misc)}원`);
    L.push(`   · 고정연봉 ${won(s.fixed)}원 / 목표 총현금 ${won(s.ttc)}원 / 총 패키지 ${won(s.total)}원`);
    if (R.hasCur) L.push(`   · 총현금 인상률 ${pct(s.raiseTTC)} / 변동급 ${C.varRecognition}% 인정 시 실질 인상률 ${pct(s.raiseEff)} (후보자 기대 ${pct(R.expRaise)})`);
    L.push(`   · PIR ${pct(s.pir,0)}, CR ${pct(s.cr,0)} · 이탈 리스크: ${t(s.risk==="low"?"riskLow":s.risk==="mid"?"riskMid":"riskHigh")}`);
    if (R.peerStat) L.push(`6) 내부 형평성: 비교군 ${R.peerStat.n}명 인상 후 평균 ${mil(R.peerStat.avg)} (범위 ${mil(R.peerStat.min)}~${mil(R.peerStat.max)}) 대비 오퍼 ${pct(R.offerVal/R.peerStat.avg-1)}`);
    if (R.signOn) L.push(`${R.peerStat?7:6}) 보완: 일회성 사이닝 보너스 ${won(R.signOn)}원 권장 (밴드 초과분·포기 보상 보전, 고정비 증가 없음)`);
  } else {
    L.push(`1) Experience: ${I.totalYears} yrs total / ${I.relYears} relevant → ${R.effYears.toFixed(1)} effective yrs`);
    L.push(`2) Market (${M.updatedAt}): contract salary P25 ${mil(R.mk.p25)} / P50 ${mil(R.mk.p50)} / P75 ${mil(R.mk.p75)}; adjustments ${R.adjPct>=0?"+":""}${R.adjPct.toFixed(1)}% → target ${mil(R.mktFixed)}`);
    if (R.hasCur){
      L.push(`3) Current: fixed ${mil(c.fixed)}, last-12-month bonus ${mil(c.inc)}, total cash ${mil(c.ttc)} (${pct(R.curPos,0)} of market median) → target raise ${(R.raise*100).toFixed(0)}%`);
      L.push(`4) Method: ${(R.w*100).toFixed(0)}% current-pay basis + ${(100-R.w*100).toFixed(0)}% market basis, bounded by grade range (${mil(R.g.min)}–${mil(R.g.max)})`);
    } else L.push(`3) No current pay → market basis only, bounded by grade range (${mil(R.g.min)}–${mil(R.g.max)})`);
    L.push(`5) Proposal (${scn}): monthly ${won(s.monthly)} × ${s.months} = annual base ${won(s.base)}`);
    L.push(`   · Fixed allowances ${won(s.allow)}${R.insOn?` (incl. insurance support ${won(s.items.otherIns)})`:""}, target incentive ${won(s.inc)}, flexible benefit & misc. ${won(s.misc)}`);
    L.push(`   · Fixed cash ${won(s.fixed)} / target total cash ${won(s.ttc)} / total package ${won(s.total)}`);
    if (R.hasCur) L.push(`   · TTC increase ${pct(s.raiseTTC)} / effective increase ${pct(s.raiseEff)} (expectation ${pct(R.expRaise)})`);
    L.push(`   · PIR ${pct(s.pir,0)}, CR ${pct(s.cr,0)} · drop-out risk: ${t(s.risk==="low"?"riskLow":s.risk==="mid"?"riskMid":"riskHigh")}`);
    if (R.peerStat) L.push(`6) Internal equity: ${R.peerStat.n} peers, projected avg ${mil(R.peerStat.avg)} (range ${mil(R.peerStat.min)}–${mil(R.peerStat.max)}); offer ${pct(R.offerVal/R.peerStat.avg-1)} vs avg`);
    if (R.signOn) L.push(`${R.peerStat?7:6}) Supplement: one-time sign-on bonus ${won(R.signOn)}`);
  }
  return L.join("\n");
}

/* ================= RENDER: SHEET ================= */
function renderSheet(){
  const I = IN, c = R.cur, s = R.chosen, ko = lang==="ko", I2 = INS();
  const today = new Date().toISOString().slice(0,10);
  $("sheetHead").innerHTML = `
   <tr><th class="l">Name</th><td class="l">${esc(I.name)}</td><th class="l">Date Prepared</th><td class="l">${today}</td></tr>
   <tr><th class="l">Designation</th><td class="l">${esc(R.g.pos || "")}</td><th class="l">Job Grade</th><td class="l">${esc(R.g.g)}</td></tr>
   <tr><th class="l">Country/Location</th><td class="l">Korea</td><th class="l">Work Location</th><td class="l">Yongin, Gyeonggi-do</td></tr>
   <tr><th class="l">Currency</th><td class="l">KRW</td><th class="l">Incentive Type</th><td class="l">Annual Bonus</td></tr>
   <tr><th class="l">Work Shift</th><td class="l">${I.shift==="yes"?"Shift":"Standard"}</td><th class="l">Experience</th><td class="l">${I.totalYears} / ${I.relYears} yrs</td></tr>`;
  const inc = (a, b) => (a > 0 && b != null) ? pct(b/a - 1) : "";
  const row = (label, a, b, cls="", cmt="", ind=false) => `<tr class="${cls}"><td class="l ${ind?"ind":""}">${label}</td><td>${a!=null?won(a):""}</td><td>${a!=null?usd(a):""}</td><td>${b!=null?won(b):""}</td><td>${b!=null?usd(b):""}</td><td>${(a!=null&&b!=null)?inc(a,b):""}</td><td class="l">${esc(cmt)}</td></tr>`;
  const sec = l => `<tr class="sec"><td colspan="7">${l}</td></tr>`;
  const otherCmt = R.insOn ? (ko ? `4대보험 근로자분 지원 ${won(s.items.otherIns)}` : `Employee insurance share ${won(s.items.otherIns)}`) + (s.items.otherExtra ? ` + ${won(s.items.otherExtra)}` : "") : "";
  $("sheetTbl").innerHTML = `
   <tr><th class="l">${t("thRemu")}</th><th>${t("thCurL")}</th><th>${t("thCurU")}</th><th>${t("thNewL")}</th><th>${t("thNewU")}</th><th>${t("thInc")}</th><th>${t("thCmt")}</th></tr>
   ${sec("ANNUAL BASE PAY [A]")}
   ${row("Monthly Base Salary", nz(I.cur.monthly), s.monthly)}
   <tr><td class="l">Months Paid (e.g., 13)</td><td>${I.cur.months || 12}</td><td></td><td>${s.months}</td><td></td><td></td><td></td></tr>
   ${row("Annual Base Pay", c.base, s.base, "tot")}
   ${sec("FIXED ALLOWANCES [B]")}
   ${row("Annual Allowance", c.allow, s.allow, "tot")}
   ${row("Meal Allowance", c.items.meal, s.items.meal, "", "", true)}
   ${row("Commuting/Car Allowance", c.items.commute, s.items.commute, "", "", true)}
   ${row("Service Allowance", c.items.service, s.items.service, "", "", true)}
   ${row("Family Allowance", c.items.family, s.items.family, "", "", true)}
   ${row("Skill Allowance", c.items.skill, s.items.skill, "", "", true)}
   ${row("Festival Allowance", c.items.festival, s.items.festival, "", s.items.festival ? (ko?"반기 지급":"Paid semi-annually") : "", true)}
   ${row("Other Allowances", c.items.other, s.items.other, "", otherCmt, true)}
   ${sec("TARGET INCENTIVE [C]")}
   ${row("Incentive/Commission Calculation Base", c.base, s.base)}
   <tr><td class="l">Variable Incentive / Commission%</td><td>${c.base? pct(c.inc/c.base):""}</td><td></td><td>${pct(s.incPct)}</td><td></td><td></td><td class="l">${I.cur.incAmt ? (ko?"현재: 최근 1년 실지급 총액":"Current: actual last 12 months") : ""}</td></tr>
   ${row("Annual target incentive/commission", c.inc, s.inc)}
   ${sec("TOTAL MISCELLANEOUS [D]")}
   ${row("Flexible Benefit", c.flex, s.flex, "", ko?"복지포인트 (급여 지급)":"Paid via payroll", true)}
   ${row("Other Miscellaneous", c.miscOther, s.miscOther, "", "", true)}
   ${row("Total Miscellaneous", c.misc, s.misc, "tot")}
   ${row("ANNUAL FIXED CASH [E=A+B]", c.fixed, s.fixed, "tot")}
   ${row("TARGET TOTAL CASH [F=E+C]", c.ttc, s.ttc, "tot")}
   ${row("TOTAL PACKAGE [G=F+D]", c.total, s.total, "grand")}
   ${R.signOn ? row(t("signOn")+" (one-time)", null, R.signOn, "", ko?"고정비 미반영 일회성":"One-time, not in fixed cost") : ""}`;
  const g = R.g;
  const pirC = c.base ? (c.base - g.min)/(g.max - g.min) : null, crC = c.base ? c.base/g.mid : null;
  $("bandTbl").innerHTML = `
   <tr><th class="l">Base Pay Comparison</th><th>Min</th><th>Midpoint</th><th>Max</th><th>Base Pay</th><th>PIR*</th><th>CR**</th><th>Job Grade</th></tr>
   <tr><td class="l">Current</td><td>${won(g.min)}</td><td>${won(g.mid)}</td><td>${won(g.max)}</td><td>${c.base?won(c.base):"-"}</td><td>${pirC!=null?pct(pirC,0):"-"}</td><td>${crC!=null?pct(crC,0):"-"}</td><td>${esc(g.g)}</td></tr>
   <tr><td class="l">Offer</td><td>${won(g.min)}</td><td>${won(g.mid)}</td><td>${won(g.max)}</td><td>${won(s.base)}</td><td>${pct(s.pir,0)}</td><td>${pct(s.cr,0)}</td><td>${esc(g.g)}</td></tr>`;
  $("insNote").textContent = R.insOn ? fmtT("insNote", {p: I2.pension, h: I2.health, l: (I2.health*I2.ltcOfHealth/100).toFixed(4), e: I2.employment, c: won(I2.pensionCapMonthly)}) : "";
}

/* ================= RENDER: REWARDS ================= */
function renderRewards(){
  const c = R.cur, s = R.chosen;
  const ben = C.benefits.reduce((a,b)=>a+(Number(b.v)||0),0);
  const curTotal = c.total, offTotal = s.total + ben;
  const row = (l, a, b, cls="") => `<tr class="${cls}"><td class="l">${l}</td><td>${won(a)}</td><td>${won(b)}</td><td>${(b-a)>=0?"+":""}${won(b-a)}</td></tr>`;
  const benName = b => lang==="ko" ? b.n.split(" / ")[0] : (b.n.split(" / ")[1]||b.n);
  const benRows = C.benefits.filter(b=>Number(b.v)>0).map(b => `<tr><td class="l ind">${esc(benName(b))}</td><td></td><td>${won(b.v)}</td><td></td></tr>`).join("");
  $("rewardsBody").innerHTML = `
   <div class="print-only"><h2>${esc(IN.name||"")} — ${t("rewardsTitle")}</h2></div>
   <div class="kpis" style="margin-top:12px">
     <div class="kpi"><div class="k">${t("rwCur")}</div><div class="v">${mil(curTotal)}</div></div>
     <div class="kpi"><div class="k">${t("rwOffer")}</div><div class="v">${mil(offTotal)}</div></div>
     <div class="kpi"><div class="k">${t("rwDiff")}</div><div class="v">${curTotal? pct(offTotal/curTotal-1):"—"}</div></div>
     <div class="kpi"><div class="k">${t("rwSignOn")}</div><div class="v">${R.signOn?mil(R.signOn):"—"}</div></div>
   </div>
   <div class="tbl-wrap"><table>
    <tr><th class="l">${t("rwItem")}</th><th>${t("rwCur")}</th><th>${t("rwOffer")}</th><th>${t("rwDiff")}</th></tr>
    ${row(t("rwBase"), c.base, s.base)}
    ${row(t("rwAllow"), c.allow, s.allow)}
    ${R.insOn ? `<tr><td class="l ind">${lang==="ko"?"└ 4대보험 근로자분 회사 지원":"└ Employee insurance share paid"}</td><td></td><td>${won(s.items.otherIns)}</td><td></td></tr>` : ""}
    ${s.items.festival ? `<tr><td class="l ind">${lang==="ko"?"└ 명절수당":"└ Festival allowance"}</td><td>${c.items.festival?won(c.items.festival):""}</td><td>${won(s.items.festival)}</td><td></td></tr>` : ""}
    ${row(t("rwInc"), c.inc, s.inc)}
    ${row(t("rwMisc"), c.misc, s.misc)}
    <tr><td class="l">${t("rwBen")}</td><td>${lang==="ko"?"(현재 직장 미입력)":"(not entered)"}</td><td>${won(ben)}</td><td></td></tr>
    ${benRows}
    ${row(t("rwTotal"), curTotal, offTotal, "grand")}
    ${R.signOn? `<tr><td class="l">${t("rwSignOn")}</td><td></td><td>${won(R.signOn)}</td><td></td></tr>`:""}
   </table></div>
   <p class="hint">${t("rwNote")}</p>`;
}

/* ================= MARKET TAB ================= */
function renderMarket(){
  const ko = lang==="ko", mt = marketTbl();
  $("mktMeta").textContent = fmtT("mktMeta", {a: M.updatedAt, b: M.nextUpdate || "—", c: nf.format(FX())}) + (C.marketOverride ? " " + t("mktLocal") : "");
  $("mktTbl").innerHTML = `<tr><th>${ko?"유효 경력":"Effective yrs"}</th><th>P25</th><th>P50</th><th>P75</th><th>${ko?"총현금 P25":"TTC P25"}</th><th>${t("colTtc")}</th><th>${ko?"총현금 P75":"TTC P75"}</th></tr>` +
    mt.map(r => `<tr><td>${r.lo}–${r.hi>=30?"+":r.hi}</td><td>${won(r.p25)}</td><td><b>${won(r.p50)}</b></td><td>${won(r.p75)}</td><td>${won(r.ttc25)}</td><td><b>${won(r.ttc)}</b></td><td>${won(r.ttc75)}</td></tr>`).join("");
  const W=760, rowH=40, H=mt.length*rowH+24, L=70, RW=110;
  const lo = Math.min(...mt.map(r=>r.p25))*0.92, hi = Math.max(...mt.map(r=>Math.max(r.p75, r.ttc75||r.ttc)))*1.02;
  const x = v => L + (v-lo)/(hi-lo)*(W-L-RW);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="market ranges" style="max-width:900px">`;
  mt.forEach((r,i)=>{
    const y = 8 + i*rowH;
    svg += `<text x="0" y="${y+17}" font-size="12" fill="var(--muted)">${r.lo}–${r.hi>=30?"+":r.hi}${ko?"년":"y"}</text>
     <rect x="${x(r.p25)}" y="${y+4}" width="${x(r.p75)-x(r.p25)}" height="14" rx="4" fill="var(--mkt)"/>
     <line x1="${x(r.p50)}" x2="${x(r.p50)}" y1="${y}" y2="${y+22}" stroke="var(--target)" stroke-width="3"/>`;
    if (r.ttc25 && r.ttc75) svg += `<rect x="${x(r.ttc25)}" y="${y+24}" width="${x(r.ttc75)-x(r.ttc25)}" height="6" rx="3" fill="var(--stretch)" opacity=".55"/>`;
    svg += `<circle cx="${x(r.ttc)}" cy="${y+27}" r="4" fill="var(--stretch)"/>
     <text x="${W}" y="${y+14}" font-size="11.5" fill="var(--text)" text-anchor="end">${mil(r.p50)}</text>
     <text x="${W}" y="${y+29}" font-size="11" fill="var(--muted)" text-anchor="end">${ko?"총":"TTC"} ${mil(r.ttc)}</text>`;
  });
  svg += `</svg><div class="legend"><span><i style="background:var(--mkt)"></i>P25–P75 (${ko?"계약연봉":"contract salary"})</span><span><i style="background:var(--target)"></i>P50</span><span><i style="background:var(--stretch)"></i>${ko?"총현금 P25–P75 · P50":"Total cash P25–P75 · P50"}</span></div>`;
  $("mktChart").innerHTML = svg;
  $("mktNotes").innerHTML = (M.notes && (M.notes[lang] || M.notes.ko)) || "";
  $("mktLog").innerHTML = `<ul>${(M.changelog||[]).slice().reverse().map(c=>`<li><b>${esc(c.date)}</b> — ${esc(c[lang]||c.ko)}</li>`).join("")}</ul>`;
}

/* ================= SETTINGS UI ================= */
function renderSettings(){
  const mi = (path, v) => `<input class="num money" inputmode="numeric" data-path="${path}" value="${won(v)}">`;
  const ni = (path, v, w) => `<input class="num" type="number" step="any" data-path="${path}" value="${v ?? ""}" ${w?`style="width:${w}px"`:""}>`;
  $("gradeTbl").innerHTML = `<tr><th>${t("colGrade")}</th><th>${t("colPos")}</th><th>${t("colMin")}</th><th>${t("colMid")}</th><th>${t("colMax")}</th><th>${t("colInc")}</th><th></th></tr>` +
    C.grades.map((r,i)=>`<tr><td><input data-path="grades.${i}.g" value="${esc(r.g)}" style="width:70px"></td><td><input data-path="grades.${i}.pos" value="${esc(r.pos)}" style="min-width:170px"></td><td>${mi(`grades.${i}.min`,r.min)}</td><td>${mi(`grades.${i}.mid`,r.mid)}</td><td>${mi(`grades.${i}.max`,r.max)}</td><td>${ni(`grades.${i}.inc`,r.inc,70)}</td><td><button class="btn danger" data-del="grades" data-i="${i}" aria-label="delete">✕</button></td></tr>`).join("");
  const P = C.pay;
  $("payFields").innerHTML = ["meal","commute","service","family","skill","festival","otherExtra","flex","misc"].map(k=>`<label class="f"><span class="l">${t("pay_"+k)}</span>${mi("pay."+k, P[k])}</label>`).join("") +
    `<label class="f"><span class="l">${t("pay_insOn")}</span><select data-path="pay.insOn"><option value="true" ${P.insOn?"selected":""}>${t("yes")}</option><option value="false" ${!P.insOn?"selected":""}>${t("no")}</option></select></label>`;
  const I2 = INS();
  $("insFields").innerHTML = [["pension","ins_pension"],["health","ins_health"],["ltcOfHealth","ins_ltc"],["employment","ins_emp"]].map(([k,l])=>`<label class="f"><span class="l">${t(l)}</span>${ni("ins."+k, I2[k])}</label>`).join("") +
    `<label class="f"><span class="l">${t("ins_cap")}</span>${mi("ins.pensionCapMonthly", I2.pensionCapMonthly)}</label>
     <label class="f"><span class="l">${lang==="ko"?"합계 근로자 부담률":"Total employee rate"}</span><input class="num" readonly value="${insTotalRate().toFixed(4)}%"></label>`;
  $("insHint").textContent = t("insHint") + ` (${M.insurance.year} · ${M.updatedAt})`;
  const mt = marketTbl();
  $("marketSrc").textContent = C.marketOverride ? t("mktSrcLocal") : fmtT("mktSrcRemote", {a: M.updatedAt});
  $("marketEditTbl").innerHTML = `<tr><th>${t("colLo")}</th><th>${t("colHi")}</th><th>P25</th><th>P50</th><th>P75</th><th>TTC P25</th><th>${t("colTtc")}</th><th>TTC P75</th></tr>` +
    mt.map((r,i)=>`<tr><td>${ni(`market.${i}.lo`,r.lo,60)}</td><td>${ni(`market.${i}.hi`,r.hi,60)}</td>${["p25","p50","p75","ttc25","ttc","ttc75"].map(k=>`<td>${mi(`market.${i}.${k}`,r[k])}</td>`).join("")}</tr>`).join("");
  const rf = [["fxOverride","rule_fx"],["blendWeightCurrent","rule_w"],["varRecognition","rule_var"],["minRaise","rule_min"],["defaultExpectedRaise","rule_exp"],["stretchUplift","rule_str"],["otherExpWeight","rule_oth"],["defaultMonths","rule_mon"]];
  $("ruleFields").innerHTML = rf.map(([k,l])=>`<label class="f"><span class="l">${t(l)}</span>${ni(k, C[k])}</label>`).join("");
  $("raiseTbl").innerHTML = `<tr><th>${t("colUpTo")}</th><th>${t("colR")}</th></tr>` + C.raise.map((r,i)=>`<tr><td>${ni(`raise.${i}.upTo`,r.upTo)}</td><td>${ni(`raise.${i}.r`,r.r)}</td></tr>`).join("");
  const A = C.adj;
  $("adjTbl").innerHTML = `
    <tr><th class="l">${t("adjEdu")}</th>${["hs","assoc","bach","master"].map(k=>`<td>${t("edu_"+k)}<br>${ni("adj.edu."+k, A.edu[k], 90)}</td>`).join("")}</tr>
    <tr><th class="l">${t("adjIv")}</th>${["low","mid","high","top"].map(k=>`<td>${t("iv_"+k)}<br>${ni("adj.interview."+k, A.interview[k], 90)}</td>`).join("")}</tr>
    <tr><th class="l">${t("adjEn")}</th>${["basic","biz","fluent"].map(k=>`<td>${t("en_"+k)}<br>${ni("adj.english."+k, A.english[k], 90)}</td>`).join("")}<td></td></tr>
    <tr><th class="l">${t("adjCert")}</th><td>${ni("adj.cert", A.cert, 90)}</td><th class="l">${t("adjCertCap")}</th><td>${ni("adj.certCap", A.certCap, 90)}</td><td></td></tr>
    <tr><th class="l">${t("adjShift")}</th><td>${ni("adj.shift", A.shift, 90)}</td><td colspan="3"></td></tr>`;
  $("benTbl").innerHTML = `<tr><th class="l">${t("colBen")}</th><th>${t("colVal")}</th><th></th></tr>` + C.benefits.map((b,i)=>`<tr><td><input data-path="benefits.${i}.n" value="${esc(b.n)}" style="min-width:280px"></td><td>${mi(`benefits.${i}.v`,b.v)}</td><td><button class="btn danger" data-del="benefits" data-i="${i}" aria-label="delete">✕</button></td></tr>`).join("");
  wireMoney($("tab-settings"));
}
function setPath(path, v){
  const p = path.split(".");
  if (p[0] === "market" && !C.marketOverride) C.marketOverride = clone(M.market);
  if (p[0] === "ins"){ C.insOverride = Object.assign({}, C.insOverride || {}); C.insOverride[p[1]] = v; return; }
  let o = p[0] === "market" ? C.marketOverride : C[p[0]];
  if (p.length === 1){ C[p[0]] = v; return; }
  for (let i=1;i<p.length-1;i++) o = o[p[i]];
  o[p[p.length-1]] = v;
}
function onSettingChange(e){
  const el = e.target; if (!el.dataset.path) return;
  let v;
  if (el.classList.contains("money")) v = parseMoney(el.value) ?? 0;
  else if (el.type === "number") v = el.value === "" ? null : Number(el.value);
  else if (el.tagName === "SELECT" && (el.value === "true" || el.value === "false")) v = el.value === "true";
  else v = el.value;
  setPath(el.dataset.path, v);
  saveC();
  if (el.dataset.path.startsWith("grades")) { fillGrades(); renderPeerInputs(); }
  if (el.dataset.path.startsWith("ins.")) renderSettings();
  render(); renderMarket();
  if (el.dataset.path.startsWith("market")) $("marketSrc").textContent = t("mktSrcLocal");
}

/* ================= FORM SETUP ================= */
function opts(sel, items, cur){ const el=$(sel); const v = cur ?? el.value; el.innerHTML = items.map(([k,l])=>`<option value="${esc(k)}">${esc(l)}</option>`).join(""); if (v && items.some(i=>i[0]===v)) el.value = v; }
function fillGrades(){ opts("c_grade", C.grades.map(g=>[g.g, gradeLabel(g)])); }
function fillSelects(){
  fillGrades();
  opts("c_edu", ["hs","assoc","bach","master"].map(k=>[k,t("edu_"+k)]));
  opts("c_interview", ["low","mid","high","top"].map(k=>[k,t("iv_"+k)]));
  opts("c_source", SOURCES.map(k=>[k,t("src_"+k)]));
  opts("c_shift", [["no",t("no")],["yes",t("yes")]]);
  opts("c_english", ["basic","biz","fluent"].map(k=>[k,t("en_"+k)]));
  opts("o_ins", [["", (C.pay.insOn ? t("insOn") : t("insOff")) + (lang==="ko"?" · 회사 기본값":" · company default")],["on",t("insOn")],["off",t("insOff")]]);
  opts("p_basis", [["base",t("basisBase")],["fixed",t("basisFixed")],["ttc",t("basisTtc")]]);
}
const FIELD_IDS = ["c_name","c_grade","c_totalYears","c_relYears","c_age","c_edu","c_certs","c_interview","c_source","c_shift","c_english",
  "cur_monthly","cur_months","cur_meal","cur_commute","cur_service","cur_family","cur_skill","cur_festival","cur_other","cur_incPct","cur_incAmt","cur_flex","cur_misc",
  "c_expected","c_competing","c_forfeit","o_months","o_incPct","o_meal","o_commute","o_service","o_family","o_skill","o_festival","o_otherExtra","o_ins","o_flex","o_misc","o_manual","p_basis","p_defRaise"];
function getForm(){ const o={}; FIELD_IDS.forEach(id=>o[id]=$(id).value); o._sc = selScenario; o._peers = clone(peers); return o; }
function setForm(o){
  FIELD_IDS.forEach(id=>{ $(id).value = o[id] !== undefined ? o[id] : ""; });
  if (!$("c_grade").value && C.grades.length) $("c_grade").value = C.grades[0].g;
  ["c_edu","c_interview","c_source","c_shift","c_english","p_basis"].forEach(id => { if (!$(id).value) $(id).selectedIndex = 0; });
  // legacy v1 drafts
  if (o.cur_allow && !o.cur_meal) $("cur_meal").value = o.cur_allow;
  selScenario = o._sc || "target";
  peers = Array.isArray(o._peers) && o._peers.length ? clone(o._peers).slice(0, MAX_PEERS) : [blankPeer()];
  formatAllMoney(); renderPeerInputs();
}
function blankForm(){
  setForm({c_grade: C.grades[1]?.g || C.grades[0].g, c_edu:"assoc", c_certs:"0", c_interview:"mid", c_source:"domestic_equip", c_shift:"no", c_english:"basic", cur_months:"12", p_basis:"base", _sc:"target"});
  currentId = null;
}
function sampleForm(){
  setForm({c_name: lang==="ko"?"홍길동 (예시)":"Sample Candidate", c_grade: (C.grades[2]||C.grades[0]).g, c_totalYears:"6", c_relYears:"4", c_age:"32", c_edu:"assoc", c_certs:"1", c_interview:"high", c_source:"domestic_equip", c_shift:"no", c_english:"biz",
    cur_monthly:"2900000", cur_months:"14", cur_meal:"200000", cur_festival:"400000", cur_incAmt:"2000000", cur_flex:"800000", p_basis:"base", p_defRaise:"4",
    _peers:[{label:"A", tenure:"3", grade:"", salary:46000000, raise:""},{label:"B", tenure:"5", grade:"", salary:50000000, raise:"5"}], _sc:"target"});
  currentId = null;
}
function formatAllMoney(){ document.querySelectorAll("input.money").forEach(el=>{ const v=parseMoney(el.value); el.value = v==null?"":won(v); }); }
function wireMoney(root){
  root.querySelectorAll("input.money").forEach(el=>{
    if (el._w) return; el._w = 1;
    el.addEventListener("focus", ()=>{ const v=parseMoney(el.value); el.value = v==null?"":String(v); });
    el.addEventListener("blur", ()=>{ const v=parseMoney(el.value); el.value = v==null?"":won(v); });
  });
}
function persistDraft(){ LS.set("od_draft_v2", {form:getForm(), id:currentId}); }

/* ================= SAVED ================= */
const getSaved = () => LS.get("od_saved", []);
function saveCandidate(){
  const list = getSaved();
  const rec = {id: currentId || ("c"+Date.now()), savedAt: new Date().toISOString(), form: getForm(),
    summary: {name: IN.name, grade: gradeLabel(R.g), base: R.chosen.base, ttc: R.chosen.ttc, raise: R.chosen.raiseEff, sc: R.chosen.key}};
  const i = list.findIndex(x=>x.id===rec.id);
  if (i>=0) list[i]=rec; else list.unshift(rec);
  currentId = rec.id; LS.set("od_saved", list); renderSaved(); toast(t("saved"));
}
function renderSaved(){
  const list = getSaved();
  $("savedList").innerHTML = list.length ? list.map(r=>`<div class="list-item"><div><b>${esc(r.summary.name||"—")}</b> <span class="meta">· ${esc(r.summary.grade)} · ${mil(r.summary.base)} · ${r.summary.raise!=null?pct(r.summary.raise):""} · ${r.savedAt.slice(0,10)}</span></div><div style="display:flex;gap:6px"><button class="btn ghost" data-load="${r.id}">${t("load")}</button><button class="btn danger" data-rm="${r.id}">${t("del")}</button></div></div>`).join("") : `<p class="hint">${t("savedEmpty")}</p>`;
}
function download(name, text, type){ const b = new Blob([text], {type}); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 500); }
const csvEsc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
function sheetCsv(){
  const c=R.cur, s=R.chosen, ch=(a,b)=>a?(b/a-1):"";
  const rows = [["Remuneration","Current (KRW)","New Offer (KRW)","% Increase"],
    ["Monthly Base Salary", IN.cur.monthly||0, s.monthly, ""],["Months Paid", IN.cur.months||12, s.months, ""],
    ["Annual Base Pay [A]", c.base, s.base, ch(c.base,s.base)],
    ["Annual Allowance [B]", c.allow, s.allow, ch(c.allow,s.allow)],
    ["  Meal Allowance", c.items.meal, s.items.meal, ""],["  Commuting/Car Allowance", c.items.commute, s.items.commute, ""],["  Service Allowance", c.items.service, s.items.service, ""],
    ["  Family Allowance", c.items.family, s.items.family, ""],["  Skill Allowance", c.items.skill, s.items.skill, ""],["  Festival Allowance", c.items.festival, s.items.festival, ""],["  Other Allowances", c.items.other, s.items.other, ""],
    ["Target Incentive [C]", c.inc, s.inc, ch(c.inc,s.inc)],
    ["  Flexible Benefit", c.flex, s.flex, ""],["  Other Miscellaneous", c.miscOther, s.miscOther, ""],["Total Miscellaneous [D]", c.misc, s.misc, ch(c.misc,s.misc)],
    ["Annual Fixed Cash [E]", c.fixed, s.fixed, ch(c.fixed,s.fixed)],["Target Total Cash [F]", c.ttc, s.ttc, ch(c.ttc,s.ttc)],
    ["Total Package [G]", c.total, s.total, ch(c.total,s.total)],["Sign-on bonus", "", R.signOn||"", ""],
    ["Job Grade", R.g.g, R.g.pos, ""],["PIR", "", s.pir, ""],["CR", "", s.cr, ""]];
  return "﻿" + rows.map(r=>r.map(csvEsc).join(",")).join("\n");
}

/* ================= LANGUAGE / THEME ================= */
function applyStaticLang(){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-html]").forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
  $("btnLang").textContent = lang==="ko" ? "EN" : "한"; $("authLang").textContent = lang==="ko" ? "EN" : "한";
}
function applyLang(){
  applyStaticLang();
  fillSelects(); renderPeerInputs(); renderSettings(); renderMarket(); renderSaved(); render();
  if (window.Auth.session && window.Auth.session.is_admin) renderAdmin();
}
function applyTheme(){ if (theme==="auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", theme); }

/* ================= AUTH UI ================= */
let authMode = "login";
function setAuthMode(m){
  authMode = m;
  $("authTabLogin").classList.toggle("on", m==="login"); $("authTabSignup").classList.toggle("on", m==="signup");
  $("authPw2Wrap").classList.toggle("hidden", m!=="signup"); $("signupExtra").classList.toggle("hidden", m!=="signup");
  $("authSubmit").textContent = t(m==="login"?"login":"signup");
  $("authPw").autocomplete = m==="login" ? "current-password" : "new-password";
  authMsg("", "");
}
function authMsg(text, cls){ const el=$("authMsg"); el.textContent = text; el.className = "msg " + (cls||""); el.classList.toggle("hidden", !text); }
const errMap = {bad_login:"badLogin", pending:"pending", rejected:"rejected", locked:"locked", nick_taken:"nickTaken", bad_nick:"errNick", bad_pw:"errPw", too_many_pending:"tooMany", expired:"sessionExpired"};
async function submitAuth(){
  const nick = $("authNick").value.trim(), pw = $("authPw").value;
  if (!/^[가-힣A-Za-z0-9_]{2,20}$/.test(nick)) return authMsg(t("errNick"), "err");
  if (authMode === "signup"){
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return authMsg(t("errPw"), "err");
    if (pw !== $("authPw2").value) return authMsg(t("errPw2"), "err");
    if (!$("authConsent").checked) return authMsg(t("errConsent"), "err");
  }
  $("authSubmit").disabled = true;
  try {
    if (authMode === "signup"){
      const r = await Auth.signup(nick, pw);
      if (r.ok){ setAuthMode("login"); $("authPw").value = ""; authMsg(t("signupOk"), "ok"); }
      else authMsg(t(errMap[r.error] || "badLogin"), "err");
    } else {
      const r = await Auth.login(nick, pw);
      if (r.ok){ $("authPw").value = ""; enterApp(); }
      else authMsg(t(errMap[r.error] || "badLogin"), r.error==="pending" ? "info" : "err");
    }
  } catch(e){ authMsg(t("netErr"), "err"); }
  finally { $("authSubmit").disabled = false; }
}
function showGate(msgKey){ $("authGate").classList.remove("hidden"); if (msgKey) authMsg(t(msgKey), "info"); }
function enterApp(){
  $("authGate").classList.add("hidden");
  const s = Auth.session;
  if (s){
    $("userChip").textContent = s.nickname; $("userChip").classList.remove("hidden"); $("btnLogout").classList.remove("hidden");
    $("accountCard").classList.remove("hidden");
    $("tabAdminBtn").classList.toggle("hidden", !s.is_admin);
  }
  if (!enterApp.started){ enterApp.started = true; startApp(); }
  if (s && s.is_admin) renderAdmin();
}
async function renderAdmin(){
  const tb = $("adminTbl");
  try {
    const r = await Auth.adminList();
    if (!r.ok) { tb.innerHTML = `<tr><td>${esc(t(errMap[r.error]||"sessionExpired"))}</td></tr>`; return; }
    const d = s => s ? s.slice(0,16).replace("T"," ") : "—";
    tb.innerHTML = `<tr><th class="l">${t("colNick")}</th><th>${t("colStatus")}</th><th>${t("colCreated")}</th><th>${t("colLast")}</th><th class="l">${t("colAct")}</th></tr>` +
      r.users.map(u=>`<tr><td class="l">${esc(u.nickname)} ${u.is_admin?'<span class="badge">admin</span>':""}</td><td><span class="pill ${u.status==="approved"?"good":u.status==="pending"?"warn":"bad"}">${t("st_"+u.status)}</span></td><td>${d(u.created_at)}</td><td>${d(u.last_login)}</td>
        <td class="l" style="white-space:normal">${u.status!=="approved"?`<button class="btn" data-ua="approve" data-uid="${u.id}">${t("approve")}</button> `:""}${u.status!=="rejected"&&!u.self?`<button class="btn ghost" data-ua="reject" data-uid="${u.id}">${t("reject")}</button> `:""}${!u.self?`<button class="btn ghost" data-ua="${u.is_admin?"unadmin":"admin"}" data-uid="${u.id}">${t(u.is_admin?"unAdmin":"makeAdmin")}</button> <button class="btn danger" data-ua="delete" data-uid="${u.id}">${t("del")}</button>`:""}</td></tr>`).join("");
  } catch(e){ tb.innerHTML = `<tr><td>${t("netErr")}</td></tr>`; }
}

/* ================= INIT ================= */
function startApp(){
  document.querySelectorAll("#tabs button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach(x=>x.classList.toggle("active", x===b));
    document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active", x.id==="tab-"+b.dataset.tab));
    if (b.dataset.tab === "admin") renderAdmin();
    window.scrollTo({top:0});
  }));
  const design = $("tab-design");
  design.addEventListener("input", e => { if (e.target.closest("#peerTbl")) return onPeerInput(e); if (!e.target.classList.contains("money")) render(); else { clearTimeout(render._t); render._t = setTimeout(render, 150); } });
  design.addEventListener("change", e => { if (e.target.closest("#peerTbl")) return onPeerInput(e); if (e.target.id === "p_defRaise") renderPeerInputs(); render(); });
  $("scenarios").addEventListener("click", e => { const el = e.target.closest(".sc"); if (el){ selScenario = el.dataset.sc; render(); } });
  $("scenarios").addEventListener("keydown", e => { const el = e.target.closest(".sc"); if (el && (e.key==="Enter"||e.key===" ")){ e.preventDefault(); selScenario = el.dataset.sc; render(); } });
  $("peerTbl").addEventListener("click", e => { const i = e.target.dataset.prm; if (i != null){ peers.splice(+i, 1); renderPeerInputs(); render(); } });
  $("btnAddPeer").onclick = () => { if (peers.length < MAX_PEERS){ peers.push(blankPeer()); renderPeerInputs(); } };
  wireMoney(design);
  $("btnSave").onclick = saveCandidate;
  $("btnNew").onclick = () => { blankForm(); render(); };
  $("btnSample").onclick = () => { sampleForm(); render(); };
  $("btnCopyRat").onclick = async () => { try { await navigator.clipboard.writeText($("rationale").textContent); toast(t("copied")); } catch(e){ const r=document.createRange(); r.selectNodeContents($("rationale")); const s=getSelection(); s.removeAllRanges(); s.addRange(r); } };
  $("btnCsv").onclick = () => download(`offer_${(IN.name||"candidate").replace(/\s+/g,"_")}.csv`, sheetCsv(), "text/csv;charset=utf-8");
  document.querySelectorAll("[data-print]").forEach(b => b.onclick = () => {
    const sec = $("tab-"+b.dataset.print); sec.classList.add("printing");
    const done = () => { sec.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); window.print(); setTimeout(done, 3000);
  });
  $("savedList").addEventListener("click", e => {
    const ld = e.target.dataset.load, rm = e.target.dataset.rm;
    if (ld){ const r = getSaved().find(x=>x.id===ld); if (r){ setForm(r.form); currentId = r.id; render(); document.querySelector('#tabs button[data-tab="design"]').click(); } }
    if (rm && confirm(t("confirmDel"))){ LS.set("od_saved", getSaved().filter(x=>x.id!==rm)); renderSaved(); }
  });
  $("btnExportAll").onclick = () => download(`offer_designer_candidates_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(getSaved(), null, 2), "application/json");
  $("btnExportCsvAll").onclick = () => {
    const rows = [["name","position_grade","scenario","annual_base","target_total_cash","effective_raise","saved_at"]].concat(getSaved().map(r=>[r.summary.name,r.summary.grade,r.summary.sc,r.summary.base,r.summary.ttc,r.summary.raise,r.savedAt]));
    download("offer_designer_candidates.csv", "﻿"+rows.map(r=>r.map(csvEsc).join(",")).join("\n"), "text/csv;charset=utf-8");
  };
  $("fileImport").onchange = e => readJson(e.target.files[0], data => { if (Array.isArray(data)){ const cur = getSaved(); data.forEach(d=>{ if(d && d.id && !cur.some(x=>x.id===d.id)) cur.push(d); }); LS.set("od_saved", cur); renderSaved(); toast(t("imported")); } });
  const st = $("tab-settings");
  st.addEventListener("change", onSettingChange);
  st.addEventListener("click", e => { const d = e.target.dataset.del; if (d){ if (C[d].length <= 1) return; C[d].splice(+e.target.dataset.i, 1); saveC(); fillGrades(); renderSettings(); renderPeerInputs(); render(); } });
  $("btnAddGrade").onclick = () => { const last = C.grades[C.grades.length-1]; C.grades.push({g:String((parseInt(last.g)||100)+1), pos:"", min:Math.round(last.min*1.15), mid:Math.round(last.mid*1.15), max:Math.round(last.max*1.15), inc:last.inc}); saveC(); fillGrades(); renderSettings(); };
  $("btnAddBen").onclick = () => { C.benefits.push({n:"", v:0}); saveC(); renderSettings(); };
  $("btnMarketReset").onclick = () => { C.marketOverride = null; saveC(); renderSettings(); renderMarket(); render(); };
  $("btnExportSet").onclick = () => download("offer_designer_company_settings.json", JSON.stringify(Object.assign({type:"offer-designer-company-settings", exportedAt:new Date().toISOString()}, C), null, 2), "application/json");
  $("fileImportSet").onchange = e => readJson(e.target.files[0], data => { if (data && data.grades){ C = mergeCompany(data); saveC(); fillSelects(); renderPeerInputs(); renderSettings(); renderMarket(); render(); toast(t("imported")); } else alert("Invalid settings file"); e.target.value = ""; });
  $("btnResetSet").onclick = () => { if (confirm(t("confirmReset"))){ C = mergeCompany(null); saveC(); fillSelects(); renderSettings(); renderMarket(); render(); } };
  $("btnChangePw").onclick = async () => {
    const np = $("acc_new").value; if (np.length < 8 || !/[A-Za-z]/.test(np) || !/\d/.test(np)) return toast(t("errPw"));
    try { const r = await Auth.changePassword($("acc_old").value, np); toast(r.ok ? t("pwChanged") : t(errMap[r.error]||"badLogin")); if (r.ok){ $("acc_old").value=""; $("acc_new").value=""; } } catch(e){ toast(t("netErr")); }
  };
  $("btnWithdraw").onclick = async () => {
    if (!confirm(t("confirmWithdraw"))) return;
    const pw = $("acc_old").value; if (!pw) { $("acc_old").focus(); return toast(t("curPw")); }
    try { const r = await Auth.withdraw(pw); if (r.ok) location.reload(); else toast(t(errMap[r.error]||"badLogin")); } catch(e){ toast(t("netErr")); }
  };
  $("btnAdminRefresh").onclick = renderAdmin;
  $("adminTbl").addEventListener("click", async e => {
    const a = e.target.dataset.ua, id = e.target.dataset.uid; if (!a) return;
    if (a === "delete" && !confirm(t("confirmDel"))) return;
    try { await Auth.adminSet(id, a); } catch(err){ toast(t("netErr")); }
    renderAdmin();
  });
  window.addEventListener("resize", () => { clearTimeout(startApp._r); startApp._r = setTimeout(render, 200); });

  fillSelects();
  const draft = LS.get("od_draft_v2", null);
  if (draft && draft.form){ setForm(draft.form); currentId = draft.id; } else sampleForm();
  applyLang();
}
function readJson(file, cb){ if (!file) return; const r = new FileReader(); r.onload = () => { try { cb(JSON.parse(r.result)); } catch(e){ alert("Invalid JSON"); } }; r.readAsText(file); }

async function boot(){
  applyTheme(); applyStaticLang();
  $("btnLang").onclick = $("authLang").onclick = () => { lang = lang==="ko"?"en":"ko"; LS.set("od_lang", lang); if (enterApp.started) applyLang(); else { applyStaticLang(); setAuthMode(authMode); } };
  $("btnTheme").onclick = () => { theme = theme==="auto" ? "dark" : theme==="dark" ? "light" : "auto"; LS.set("od_theme", theme); applyTheme(); };
  $("authTabLogin").onclick = () => setAuthMode("login");
  $("authTabSignup").onclick = () => setAuthMode("signup");
  $("authSubmit").onclick = submitAuth;
  ["authNick","authPw","authPw2"].forEach(id => $(id).addEventListener("keydown", e => { if (e.key === "Enter") submitAuth(); }));
  $("btnLogout").onclick = async () => { await Auth.logout(); location.reload(); };
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
  if (!Auth.enabled){ enterApp(); return; }
  setAuthMode("login");
  const ok = await Auth.restore();
  if (ok) enterApp(); else showGate();
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && Auth.session && !(await Auth.check())){ await Auth.logout(); showGate("sessionExpired"); }
  });
}
boot();
