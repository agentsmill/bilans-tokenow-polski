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

function Gauge({ sup, demTotal }) {
  const max = Math.max(sup, demTotal, 1);
  const sW = (sup / max) * 100;
  const dW = (demTotal / max) * 100;
  const st = fmtTokens(sup), dt = fmtTokens(demTotal);
  return (
    <div className="gauge">
      <div className="gauge-row">
        <span className="gauge-tag">Podaż</span>
        <div className="gauge-track"><div className="gauge-fill sup" style={{ width: sW + '%' }} /></div>
        <span className="gauge-val">{st.num} {st.unit}</span>
      </div>
      <div className="gauge-row">
        <span className="gauge-tag">Popyt</span>
        <div className="gauge-track"><div className="gauge-fill dem" style={{ width: Math.max(dW, 0.6) + '%' }} /></div>
        <span className="gauge-val">{dt.num} {dt.unit}</span>
      </div>
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

function StatCards({ cap, gwNeed, totalGW }) {
  const ksePct = (totalGW / CONST.KSE_PEAK_GW) * 100;
  const needTone = gwNeed > totalGW ? 'warn' : 'ok';
  return (
    <div className="stats">
      <StatCard label="Koszt budowy (CAPEX)" value={fmtMldPLN(cap)} unit=" mld zł"
                sub="all-in · 37 M$/MW IT · kurs 4,0" />
      <StatCard label="Moc na pokrycie popytu" value={fmtNum(gwNeed, gwNeed >= 10 ? 0 : 1)} unit=" GW"
                sub={`dostępne na mapie: ${fmtNum(totalGW, 2)} GW`} tone={needTone} />
      <StatCard label="Udział w szczycie KSE" value={fmtNum(ksePct, ksePct >= 100 ? 0 : 0)} unit=" %"
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

function AdvancedParams({ params, setParams, sup, open, onToggle }) {
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
            <span>{fmtInt(sup.itMW)} MW IT</span>
            <span>{fmtInt(sup.racks)} szaf NVL72</span>
            <span>{fmtInt(sup.gpus)} GPU</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlPanel(props) {
  const { stage, setStageId, bal, dem, sup, cap, gwNeed, totalGW,
          params, setParams, advOpen, setAdvOpen } = props;
  return (
    <div className="panel">
      <div className="panel-block">
        <span className="kicker">Etap adopcji AI</span>
        <StageSelector stages={STAGES} current={stage.id} onChange={setStageId} />
        <p className="stage-blurb">{stage.blurb}</p>
      </div>

      <BalanceIndicator bal={bal} />
      <Gauge sup={sup.tokDay} demTotal={dem.total} />
      <DemandBreakdown dem={dem} />
      <StatCards cap={cap} gwNeed={gwNeed} totalGW={totalGW} />
      <AdvancedParams params={params} setParams={setParams} sup={sup}
                      open={advOpen} onToggle={() => setAdvOpen(!advOpen)} />
    </div>
  );
}

Object.assign(window, { ControlPanel });
