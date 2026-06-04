/* panel.jsx — prawy panel sterowania + wyniki symulacji */

function StageSelector({ stages, current, onChange }) {
  return (
    <div className="stage-row">
      {stages.map((s, i) => (
        <button key={s.id}
          className={'stage-btn' + (s.id === current ? ' active' : '')}
          onClick={() => onChange(s.id)}>
          <span className="stage-idx">{String(i + 1).padStart(2, '0')}</span>
          <span className="stage-label">{s.label}</span>
          {s.sub && <span className="stage-sub">{s.sub}</span>}
        </button>
      ))}
    </div>
  );
}

const BASIS_OPTS = [
  { id: 'real', label: 'Realne dziś', sub: 'co działa' },
  { id: 'plan', label: 'Plany', sub: 'ogłoszone' },
  { id: 'both', label: 'Razem', sub: 'real + plan' },
];

function BasisSelector({ current, onChange, supReal, supPlan }) {
  const rt = fmtTokens(supReal), pt = fmtTokens(supPlan);
  const val = (id) => (id === 'real' ? rt : id === 'plan' ? pt : fmtTokens(supReal + supPlan));
  return (
    <div className="basis-row">
      {BASIS_OPTS.map((o) => {
        const t = val(o.id);
        return (
          <button key={o.id} className={'basis-btn' + (o.id === current ? ' active' : '')}
                  onClick={() => onChange(o.id)}>
            <span className="basis-label">{o.label}</span>
            <span className="basis-val">{t.num} {t.unit}<i> tok/d</i></span>
          </button>
        );
      })}
    </div>
  );
}

function BalanceIndicator({ bal }) {
  const exp = bal.mode === 'EKSPORT';
  const tok = fmtTokens(Math.abs(bal.net));
  const ratio = bal.demand > 0 ? bal.supply / bal.demand : Infinity;
  let cov;
  if (!isFinite(ratio)) cov = 'brak popytu';
  else if (ratio >= 1) cov = '×' + fmtNum(ratio, ratio >= 10 ? 0 : 1) + ' nadwyżki podaży';
  else cov = fmtInt(bal.coverage) + '% popytu pokryte';
  return (
    <div className={'balance ' + (exp ? 'is-exp' : 'is-imp')}>
      <div className="balance-top">
        <span className="kicker">Bilans tokenów</span>
        <span className="balance-arrow">{exp ? '↗' : '↘'}</span>
      </div>
      <div className="balance-word">{bal.mode}</div>
      <div className="balance-net">
        {exp ? '+' : '−'}{tok.num}<span className="balance-unit"> {tok.unit} tok / dobę</span>
      </div>
      <div className="balance-cov">{cov}</div>
    </div>
  );
}

/* Trójpaskowy gauge: podaż realna (dziś) vs podaż wg planów vs popyt.
   Skala logarytmiczna — inaczej realna podaż (o ~3 rzędy mniejsza od planów)
   byłaby niewidocznym pikselem. */
function Gauge({ supReal, supPlan, demTotal, basis }) {
  const vals = [supReal, supPlan, demTotal].filter((v) => v > 0);
  const max = Math.max(...vals, 1);
  const lg = (v) => (v <= 0 ? 0 : Math.max(2, (Math.log10(v) / Math.log10(max)) * 100));
  const row = (tag, v, cls, on) => {
    const t = fmtTokens(v);
    return (
      <div className={'gauge-row' + (on ? ' on' : '')}>
        <span className="gauge-tag">{tag}</span>
        <div className="gauge-track"><div className={'gauge-fill ' + cls} style={{ width: lg(v) + '%' }} /></div>
        <span className="gauge-val">{t.num} {t.unit}</span>
      </div>
    );
  };
  return (
    <div className="gauge">
      <div className="gauge-cap">skala logarytmiczna</div>
      {row('Dziś', supReal, 'sup', basis === 'real')}
      {row('Plany', supPlan, 'sup-plan', basis === 'plan')}
      {row('Popyt', demTotal, 'dem', false)}
    </div>
  );
}

function DemandBreakdown({ dem }) {
  const total = dem.total || 1;
  const cW = (dem.consumer / total) * 100;
  const ct = fmtTokens(dem.consumer), at = fmtTokens(dem.agentic);
  return (
    <div className="breakdown">
      <div className="bd-head">
        <span className="kicker">Struktura popytu</span>
        <span className="bd-fte">{fmtInt(dem.fte)} agent-FTE</span>
      </div>
      <div className="bd-bar">
        <div className="bd-seg cons" style={{ width: cW + '%' }} />
        <div className="bd-seg agen" style={{ width: (100 - cW) + '%' }} />
      </div>
      <div className="bd-legend">
        <span><i className="dot cons" />Konsumencki · {ct.num} {ct.unit}</span>
        <span><i className="dot agen" />Agentyczny · {at.num} {at.unit}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, sub, tone }) {
  return (
    <div className={'stat' + (tone ? ' tone-' + tone : '')}>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className="stat-value">{value}<span className="stat-unit">{unit}</span></div>
    </div>
  );
}

function StatCards({ supSel, cap, gwNeed, basis }) {
  const gw = supSel.gw;                              // moc planowana (real ≈ 0)
  const ksePct = (gw / CONST.KSE_PEAK_GW) * 100;
  const needTone = gwNeed > gw + 1e-9 ? 'warn' : 'ok';
  const gpus = supSel.gpus;
  return (
    <div className="stats">
      <StatCard label="Pracujące GPU (AI-grade)" value={fmtInt(gpus)} unit=""
                sub={basis === 'real' ? 'realne, działające dziś' : basis === 'plan' ? 'wyprowadzone z mocy planów' : 'real + plany'} />
      <StatCard label="Koszt budowy (CAPEX)" value={fmtMldPLN(cap)} unit=" mld zł"
                sub="all-in · 37 M$/MW IT · kurs 4,0" />
      <StatCard label="Moc na pokrycie popytu" value={fmtNum(gwNeed, gwNeed >= 10 ? 0 : 1)} unit=" GW"
                sub={`w tej podstawie: ${fmtNum(gw, gw >= 1 ? 2 : 3)} GW`} tone={needTone} />
      <StatCard label="Udział w szczycie KSE" value={fmtNum(ksePct, ksePct >= 1 ? 0 : 1)} unit=" %"
                sub={`szczyt krajowy ~${CONST.KSE_PEAK_GW} GW (zima)`} />
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }) {
  return (
    <div className="slider">
      <div className="slider-head">
        <span>{label}</span>
        <span className="slider-val">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function AdvancedParams({ params, setParams, supSel, open, onToggle }) {
  return (
    <div className="advanced">
      <button className="adv-toggle" onClick={onToggle}>
        <span>Parametry data center</span>
        <span className="adv-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="adv-body">
          <Slider label="PUE (sprawność)" value={params.pue} min={1.1} max={1.6} step={0.01}
                  fmt={(v) => fmtNum(v, 2)} onChange={(v) => setParams({ ...params, pue: v })} />
          <Slider label="Utilization" value={params.util} min={0.20} max={0.95} step={0.01}
                  fmt={(v) => fmtInt(v * 100) + '%'} onChange={(v) => setParams({ ...params, util: v })} />
          <Slider label="% mocy na inference" value={params.inf} min={0.30} max={1.0} step={0.01}
                  fmt={(v) => fmtInt(v * 100) + '%'} onChange={(v) => setParams({ ...params, inf: v })} />
          <div className="adv-derived">
            <span>{fmtNum(supSel.itMW, supSel.itMW >= 100 ? 0 : 1)} MW IT</span>
            <span>{fmtInt(supSel.racks)} szaf</span>
            <span>{fmtInt(supSel.gpus)} GPU</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlPanel(props) {
  const { stage, setStageId, bal, dem, supReal, supPlan, supSel, cap, gwNeed,
          basis, setBasis, params, setParams, advOpen, setAdvOpen } = props;
  return (
    <div className="panel">
      <div className="panel-block">
        <span className="kicker">Etap adopcji AI · popyt</span>
        <StageSelector stages={STAGES} current={stage.id} onChange={setStageId} />
        <p className="stage-blurb">{stage.blurb}</p>
      </div>

      <div className="panel-block">
        <span className="kicker">Podstawa podaży · co liczymy</span>
        <BasisSelector current={basis} onChange={setBasis} supReal={supReal} supPlan={supPlan} />
      </div>

      <BalanceIndicator bal={bal} />
      <Gauge supReal={supReal} supPlan={supPlan} demTotal={dem.total} basis={basis} />
      <DemandBreakdown dem={dem} />
      <StatCards supSel={supSel} cap={cap} gwNeed={gwNeed} basis={basis} />
      <AdvancedParams params={params} setParams={setParams} supSel={supSel}
                      open={advOpen} onToggle={() => setAdvOpen(!advOpen)} />
    </div>
  );
}

Object.assign(window, { ControlPanel });
