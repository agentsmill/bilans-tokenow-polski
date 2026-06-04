/* app.jsx — kompozycja: nagłówek, mapa, panel, modal, wnioski */
const { useState, useEffect, useMemo } = React;

// Akcent używany w SVG mapy (CSS-owe komponenty czytają --acc z :root).
const ACCENT = '#00FF8C';

function DCModal({ data, onSave, onDelete, onClose }) {
  const isEdit = data.mode === 'edit';
  const [name, setName] = useState(data.name || '');
  const [mw, setMw] = useState(data.mw || 500);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="kicker">{isEdit ? 'Edytuj data center' : 'Nowe data center'}</span>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>
        <label className="field">
          <span>Nazwa</span>
          <input type="text" value={name} autoFocus placeholder="np. Nowy Sącz"
                 onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Moc przyłączeniowa</span>
          <div className="field-mw">
            <input type="range" min="50" max="4000" step="10" value={mw}
                   onChange={(e) => setMw(parseInt(e.target.value))} />
            <div className="mw-readout">{fmtInt(mw)}<i>MW</i></div>
          </div>
        </label>
        <div className="modal-coords">
          {fmtNum(data.lat, 2)}° N · {fmtNum(data.lon, 2)}° E
        </div>
        <div className="modal-actions">
          {isEdit && <button className="btn-del" onClick={onDelete}>Usuń</button>}
          <div className="spacer" />
          <button className="btn-ghost" onClick={onClose}>Anuluj</button>
          <button className="btn-go" onClick={() => onSave({ name: name.trim() || 'DC', mw })}>
            {isEdit ? 'Zapisz' : 'Dodaj'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [dcs, setDcs] = useState(INITIAL_DCS.map((d) => ({ ...d })));
  const [stageId, setStageId] = useState('early');
  const [params, setParams] = useState({ ...PARAM_DEFAULTS });
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [advOpen, setAdvOpen] = useState(false);

  const totalGW = useMemo(() => dcs.reduce((a, d) => a + d.mw, 0) / 1000, [dcs]);
  const stage = STAGES.find((s) => s.id === stageId);
  const sup = supply(totalGW, params);
  const dem = stageDemand(stage);
  const bal = balance(totalGW, dem.total, params);
  const cap = capex(totalGW, params);
  const gwNeed = gwNeeded(dem.total, params);

  function addAt(lon, lat) {
    setSelectedId(null);
    setModal({ mode: 'add', name: '', mw: 500, lon, lat });
  }
  function selectDc(id) {
    setSelectedId(id);
    if (id == null) return;
    const dc = dcs.find((d) => d.id === id);
    if (dc) setModal({ mode: 'edit', ...dc });
  }
  function saveModal({ name, mw }) {
    if (modal.mode === 'add') {
      const id = (dcs.reduce((m, d) => Math.max(m, d.id), 0)) + 1;
      setDcs([...dcs, { id, name, mw, lat: modal.lat, lon: modal.lon }]);
    } else {
      setDcs(dcs.map((d) => (d.id === modal.id ? { ...d, name, mw } : d)));
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
    setSelectedId(null);
    setModal(null);
  }

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
          <div className="tr-item"><span className="tr-val">{fmtNum(totalGW, 2)}</span><span className="tr-unit">GW łącznie</span></div>
          <div className="tr-sep" />
          <div className="tr-item"><span className="tr-val">{fmtInt(sup.racks)}</span><span className="tr-unit">szaf NVL72</span></div>
          <div className="tr-sep" />
          <div className="tr-item"><span className="tr-val">{fmtInt(dcs.length)}</span><span className="tr-unit">obiektów</span></div>
          <button className="btn-reset" onClick={reset}>Reset mapy</button>
        </div>
      </header>

      <main className="layout">
        <section className="mapwrap">
          <PolandMap dcs={dcs} selectedId={selectedId} onSelect={selectDc}
                     onAddAt={addAt} mode={bal.mode} net={bal.net} acc={ACCENT} />
          <div className="map-hint">
            <span className="mh-key">＋</span> Kliknij wnętrze mapy, aby dodać data center ·
            kliknij punkt, aby edytować lub usunąć
          </div>
        </section>

        <ControlPanel stage={stage} setStageId={setStageId} bal={bal} dem={dem}
                      sup={sup} cap={cap} gwNeed={gwNeed} totalGW={totalGW}
                      params={params} setParams={setParams}
                      advOpen={advOpen} setAdvOpen={setAdvOpen} />
      </main>

      <Conclusions params={params} />

      <footer className="foot">
        <span>Model edukacyjny i poglądowy — nie prognoza inwestycyjna.</span>
        <span>Źródła: NVIDIA · HPE · SGLang · Gemius/PBI · GUS · PSE (2025)</span>
      </footer>

      {modal && (
        <DCModal data={modal} onSave={saveModal} onDelete={deleteModal}
                 onClose={() => setModal(null)} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
