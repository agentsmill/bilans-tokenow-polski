/* ===========================================================================
   engine.js — silnik symulacji podaż / popyt / bilans / CAPEX
   params = { pue, util, inf } (suwaki), reszta ze stałych CONST.

   Wspólny mianownik obu warstw = LICZBA GPU:
   - planned: GPU wyprowadzane z mocy przyłączeniowej (MW → MW IT → szafy → GPU),
              throughput GB200 NVL72 (CONST.TPS).
   - real:    GPU wpisane wprost, throughput wg generacji kart (dc.tps).
   =========================================================================== */

function _p(params) {
  return {
    pue:  params?.pue  ?? CONST.PUE,
    util: params?.util ?? CONST.UTIL,
    inf:  params?.inf  ?? CONST.INF,
  };
}

// throughput tok/s/GPU dla danego DC (real: wg generacji; planned: GB200)
function dcTps(dc) {
  return dc.kind === 'real' ? (dc.tps ?? CONST.TPS) : CONST.TPS;
}

// liczba GPU w danym DC
function dcGpus(dc, params) {
  if (dc.kind === 'real') return dc.gpus ?? 0;
  const { pue } = _p(params);
  const itMW  = (dc.mw / 1000 / pue) * 1000;     // moc IT w MW
  const racks = (itMW * 1000) / CONST.RACK_KW;
  return racks * CONST.GPU_PER_RACK;
}

// tokeny/dobę z danego DC przy parametrach (util, inf z suwaków)
function dcTokDay(dc, params) {
  const { util, inf } = _p(params);
  return dcGpus(dc, params) * dcTps(dc) * inf * util * 86400;
}

/* ---- PODAŻ z dowolnego zbioru DC ---- */
function supplyOf(list, params) {
  let gpus = 0, tokDay = 0, mw = 0;
  for (const dc of list) {
    gpus   += dcGpus(dc, params);
    tokDay += dcTokDay(dc, params);
    if (dc.kind !== 'real') mw += dc.mw;          // tylko plany mają moc przyłączeniową
  }
  const racks = gpus / CONST.GPU_PER_RACK;
  const itMW  = (racks * CONST.RACK_KW) / 1000;
  return { gpus, racks, itMW, tokDay, mw, gw: mw / 1000 };
}

/* ---- KOSZT BUDOWY (CAPEX) w PLN — z mocy IT wynikającej z GPU ---- */
function capexOf(list, params) {
  const { itMW } = supplyOf(list, params);
  return itMW * CONST.CAPEX_PER_MW_IT * CONST.USDPLN;
}

/* ---- POPYT z presetu etapu ---- */
function consumerDemand(s) {
  return s.users_mln * 1e6 * s.queriesPerDay * s.tokPerQuery;
}
function agenticDemand(s) {
  const fte = s.jobs_mln * 1e6 * s.autoFraction * s.intensityMult;
  const tokPerAgentDay = s.hoursPerDay * s.tokPerHour;
  return { fte, tokPerAgentDay, demand: fte * tokPerAgentDay };
}
function stageDemand(s) {
  const cons = consumerDemand(s);
  const ag = agenticDemand(s);
  return { consumer: cons, agentic: ag.demand, fte: ag.fte, total: cons + ag.demand };
}

/* ---- BILANS: import / eksport ---- */
function balance(supplyTok, totalDemand) {
  const net = supplyTok - totalDemand;           // + = eksport, - = import
  const coverage = totalDemand > 0 ? (supplyTok / totalDemand) * 100 : Infinity;
  return {
    supply: supplyTok, demand: totalDemand, net, coverage,
    mode: net >= 0 ? 'EKSPORT' : 'IMPORT',
  };
}

/* ---- ODWRÓCONY RACHUNEK: ile GW (planowanych, GB200) na dany popyt ---- */
function gwNeeded(totalDemand, params) {
  const { pue, util, inf } = _p(params);
  const tokPerGpuDay = CONST.TPS * inf * util * 86400;
  const gpus  = totalDemand / tokPerGpuDay;
  const racks = gpus / CONST.GPU_PER_RACK;
  const itMW  = (racks * CONST.RACK_KW) / 1000;
  return (itMW * pue) / 1000;
}

Object.assign(window, {
  dcTps, dcGpus, dcTokDay, supplyOf, capexOf,
  consumerDemand, agenticDemand, stageDemand,
  balance, gwNeeded,
});
