/* ===========================================================================
   engine.js — silnik symulacji podaż / popyt / bilans / CAPEX
   params = { pue, util, inf } (suwaki), reszta ze stałych CONST
   =========================================================================== */

function _p(params) {
  return {
    pue:  params?.pue  ?? CONST.PUE,
    util: params?.util ?? CONST.UTIL,
    inf:  params?.inf  ?? CONST.INF,
  };
}

// tokeny/dobę z 1 GPU przy danych parametrach
function tokPerGpuDay(params) {
  const { util, inf } = _p(params);
  return CONST.TPS * inf * util * 86400;
}

/* ---- PODAŻ (z sumy mocy wszystkich DC na mapie) ---- */
function supply(totalGW, params) {
  const { pue } = _p(params);
  const itMW   = (totalGW / pue) * 1000;
  const racks  = (itMW * 1000) / CONST.RACK_KW;
  const gpus   = racks * CONST.GPU_PER_RACK;
  const tokDay = gpus * tokPerGpuDay(params);
  return { itMW, racks, gpus, tokDay };
}

/* ---- KOSZT BUDOWY (CAPEX) w PLN ---- */
function capex(totalGW, params) {
  const { pue } = _p(params);
  const itMW = (totalGW / pue) * 1000;
  const usd  = itMW * CONST.CAPEX_PER_MW_IT;
  return usd * CONST.USDPLN;
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
function balance(totalGW, totalDemand, params) {
  const sup = supply(totalGW, params).tokDay;
  const net = sup - totalDemand;                 // + = eksport, - = import
  const coverage = totalDemand > 0 ? (sup / totalDemand) * 100 : Infinity;
  return {
    supply: sup, demand: totalDemand, net, coverage,
    mode: net >= 0 ? 'EKSPORT' : 'IMPORT',
  };
}

/* ---- ODWRÓCONY RACHUNEK: ile GW na dany popyt ---- */
function gwNeeded(totalDemand, params) {
  const { pue } = _p(params);
  const gpus  = totalDemand / tokPerGpuDay(params);
  const racks = gpus / CONST.GPU_PER_RACK;
  const itMW  = (racks * CONST.RACK_KW) / 1000;
  return (itMW * pue) / 1000;
}

Object.assign(window, {
  supply, capex, consumerDemand, agenticDemand, stageDemand,
  balance, gwNeeded, tokPerGpuDay,
});
