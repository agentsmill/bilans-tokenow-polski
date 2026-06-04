/* app.jsx — kompozycja: nagłówek, mapa, panel, modal, wnioski */
const { useState, useEffect, useMemo } = React;

// Akcent używany w SVG mapy (CSS-owe komponenty czytają --acc z :root).
const ACCENT = '#00FF8C';

function DCModal({ data, onSave, onDelete, onClose }) {
  const isEdit = data.mode === 'edit';
  const isReal = data.kind === 'real';
  const [name, setName] = useState(data.name || '');
  const [mw, setMw] = useState(data.mw || 500);
  const [gpus, setGpus] = useState(data.gpus || 256);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const title = isReal
    ? (isEdit ? 'Edytuj klaster GPU' : 'Nowy klaster GPU')
    : (isEdit ? 'Edytuj planowane DC' : 'Nowe planowane DC');

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="kicker">{title}</span>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <label className="field">
          <span>Nazwa</span>
          <input type="text" value={name} autoFocus placeholder="np. Nowy Sącz"
                 onChange={(e) => setName(e.target.value)} />
        </label>
        {isReal ? (
          <label className="field">
            <span>Liczba GPU (AI-grade)</span>
            <div className="field-mw">
              <input type="range" min="8" max="10000" step="8" value={gpus}
                     onChange={(e) => setGpus(parseInt(e.target.value))} />
              <div className="mw-readout">{fmtInt(gpus)}<i>GPU</i></div>
            </div>
          </label>
        ) : (
          <label className="field">
            <span>Moc przyłączeniowa</span>
            <div className="field-mw">
              <input type="range" min="50" max="4000" step="10" value={mw}
                     onChange={(e) => setMw(parseInt(e.target.value))} />
              <div className="mw-readout">{fmtInt(mw)}<i>MW</i></div>
            </div>
          </label>
        )}
        <div className="modal-coords">
          {fmtNum(data.lat, 2)}° N · {fmtNum(data.lon, 2)}° E
          {isReal ? ' · warstwa: realna' : ' · warstwa: plan'}
        </div>
        <div className="modal-actions">
          {isEdit && <button className="btn-del" onClick={onDelete}>Usuń</button>}
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn-go"
                  onClick={() => onSave(isReal ? { name: name.trim() || 'Klaster', gpus }
                                                : { name: name.trim() || 'DC', mw })}>
            {isEdit ? 'Zapisz' : 'Dodaj'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [dcs, setDcs] = useState(INITIAL_DCS.map((d) => ({ ...d })));
  const [stageId, setStageId] = useState('today');
  const [basis, setBasis] = useState('real');
  const [params, setParams] = useState({ ...PARAM_DEFAULTS });
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [advOpen, setAdvOpen] = useState(false);

  const real = useMemo(() => dcs.filter((d) => d.kind === 'real'), [dcs]);
  const planned = useMemo(() => dcs.filter((d) => d.kind !== 'real'), [dcs]);

  const supReal = supplyOf(real, params);
  const supPlan = supplyOf(planned, params);
  const supBoth = supplyOf(dcs, params);
  const supSel = basis === 'real' ? supReal : basis === 'plan' ? supPlan : supBoth;

  const stage = STAGES.find((s) => s.id === stageId);
  const dem = stageDemand(stage);
  const bal = balance(supSel.tokDay, dem.total);
  const cap = supSel.itMW * CONST.CAPEX_PER_MW_IT * CONST.USDPLN;
  const gwNeed = gwNeeded(dem.total, params);

  function addAt(lon, lat) {
    setSelectedId(null);
    // ręcznie dodawane obiekty trafiają do warstwy planów (definiowane mocą)
    setModal({ mode: 'add', kind: 'planned', name: '', mw: 500, lon, lat });
  }
  function selectDc(id) {
    setSelectedId(id);
    if (id == null) return;
    const dc = dcs.find((d) => d.id === id);
    if (dc) setModal({ mode: 'edit', ...dc });
  }
  function saveModal(patch) {
    if (modal.mode === 'add') {
      const id = 'p' + (Date.now().toString(36));
      setDcs([...dcs, { id, kind: 'planned', name: patch.name, mw: patch.mw, lat: modal.lat, lon: modal.lon }]);
    } else {
      setDcs(dcs.map((d) => (d.id === modal.id ? { ...d, ...patch } : d)));
    }
    setModal(null);
  }
  function deleteModal() {
    setDcs(dcs.filter((d) => d.id !== modal.id));
    setSelectedId(null);
    setModal(null);
  }
  function reset() {
    setDcs(INITIAL_DCS.map((d) => ({ ...d })));
    setParams({ ...PARAM_DEFAULTS });
    setBasis('real');
    setStageId('today');
    setSelectedId(null);
    setModal(null);
  }

  const rt = fmtTokens(supReal.tokDay);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span className="bm-dot" /></div>
          <div className="brand-txt">
            <h1>Bilans tokenów Polski</h1>
            <p>Data center AI · symulator importu / eksportu mocy obliczeniowej</p>
          </div>
        </div>
        <div className="topreadout">
          <div className="tr-item"><span className="tr-val">{fmtInt(supReal.gpus)}</span><span className="tr-unit">GPU realne</span></div>
          <div className="tr-sep" />
          <div className="tr-item"><span className="tr-val">{fmtNum(supPlan.gw, 2)}</span><span className="tr-unit">GW w planach</span></div>
          <div className="tr-sep" />
          <div className="tr-item"><span className="tr-val">{fmtInt(dcs.length)}</span><span className="tr-unit">obiektów</span></div>
          <button className="btn-reset" onClick={reset}>Reset mapy</button>
        </div>
      </header>

      <main className="layout">
        <section className="mapwrap">
          <PolandMap dcs={dcs} selectedId={selectedId} onSelect={selectDc}
                     onAddAt={addAt} mode={bal.mode} net={bal.net} acc={ACCENT} />
          <div className="map-legend">
            <span><i className="lg-dot real" /> Realne dziś (GPU)</span>
            <span><i className="lg-dot plan" /> Plany (moc przyłączeniowa)</span>
          </div>
          <div className="map-hint">
            <span className="mh-key">＋</span> Kliknij wnętrze mapy, aby dodać planowane DC ·
            kliknij punkt, aby edytować lub usunąć
          </div>
        </section>

        <ControlPanel stage={stage} setStageId={setStageId} bal={bal} dem={dem}
                      supReal={supReal.tokDay} supPlan={supPlan.tokDay} supSel={supSel}
                      cap={cap} gwNeed={gwNeed} basis={basis} setBasis={setBasis}
                      params={params} setParams={setParams}
                      advOpen={advOpen} setAdvOpen={setAdvOpen} />
      </main>

      <Conclusions params={params} supReal={supReal} supPlan={supPlan} />

      <footer className="foot">
        <span>Model edukacyjny i poglądowy — nie prognoza inwestycyjna.</span>
        <span>Źródła: NVIDIA · HPE · SGLang · Cyfronet · Beyond.pl · PCSS · Gemius/PBI · GUS · PSE (2025)</span>
      </footer>

      {modal && (
        <DCModal data={modal} onSave={saveModal} onDelete={deleteModal}
                 onClose={() => setModal(null)} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
