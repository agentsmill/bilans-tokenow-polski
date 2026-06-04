/* map.jsx — interaktywna mapa Polski z data center (dwie warstwy: real + planned) */
const { useRef: _useRefMap } = React;

// point-in-polygon (ray casting) w przestrzeni projekcji
function pointInPoland(x, y) {
  const pts = BORDER_LL.map((p) => project(p[0], p[1]));
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    const hit = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

// planowane skalujemy mocą (MW), realne — liczbą GPU; osobne skale, bo
// plany są o rzędy wielkości większe i mają wizualnie dominować.
function plannedRadius(mw) { return 8 + Math.sqrt(mw) * 0.78; }
function realRadius(gpus) { return 5 + Math.sqrt(gpus) * 0.42; }

function powerLabel(mw) {
  if (mw >= 1000) return fmtNum(mw / 1000, mw % 1000 === 0 ? 0 : 1) + ' GW';
  return fmtInt(mw) + ' MW';
}
function gpuLabel(gpus) { return fmtInt(gpus) + ' GPU'; }

/* --- PIN PLANOWANY: duży, przygaszony, przerywany obrys ("plan") --- */
function PlannedPin({ dc, selected, onSelect, acc }) {
  const { x, y } = project(dc.lon, dc.lat);
  const r = plannedRadius(dc.mw);
  const flipX = x > VIEW.w * 0.66;
  const lx = flipX ? x - r - 14 : x + r + 14;
  const anchor = flipX ? 'end' : 'start';
  const big = dc.mw >= 1000;
  return (
    <g className="dcpin planned" onClick={(e) => { e.stopPropagation(); onSelect(dc.id); }}
       style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={r * 2.0} fill={acc} opacity="0.06" className="pin-glow" />
      <circle cx={x} cy={y} r={r} fill={acc} fillOpacity={selected ? 0.22 : 0.14}
              stroke={acc} strokeWidth="2.2" strokeDasharray="5 5" strokeOpacity="0.85" />
      <circle cx={x} cy={y} r={r * 0.34} fill={acc} opacity="0.55" />
      {selected && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 4" />}
      <text x={lx} y={y - 2} textAnchor={anchor} className="pin-power"
            style={{ fontSize: big ? 30 : 24 }}>{powerLabel(dc.mw)}</text>
      <text x={lx} y={y + 20} textAnchor={anchor} className="pin-name">{dc.name}<tspan className="pin-tag"> · plan</tspan></text>
    </g>
  );
}

/* --- PIN REALNY: mały, pełny, pulsujący ("działa dziś") --- */
function RealPin({ dc, selected, onSelect, acc }) {
  const { x, y } = project(dc.lon, dc.lat);
  const r = realRadius(dc.gpus);
  const flipX = x > VIEW.w * 0.66;
  const lx = flipX ? x - r - 12 : x + r + 12;
  const anchor = flipX ? 'end' : 'start';
  return (
    <g className="dcpin real" onClick={(e) => { e.stopPropagation(); onSelect(dc.id); }}
       style={{ cursor: 'pointer' }}>
      <circle cx={x} cy={y} r={r * 2.1} fill={acc} opacity="0.12" className="pin-glow" />
      <circle cx={x} cy={y} r={r} fill="none" stroke={acc} strokeWidth="2.5"
              opacity="0.55" className="pin-pulse" style={{ transformOrigin: `${x}px ${y}px` }} />
      <circle cx={x} cy={y} r={r} fill={acc} opacity={selected ? 0.98 : 0.85} />
      <circle cx={x} cy={y} r={r * 0.42} fill="#04140e" />
      {selected && <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 4" />}
      <text x={lx} y={y - 1} textAnchor={anchor} className="pin-power" style={{ fontSize: 19 }}>{gpuLabel(dc.gpus)}</text>
      <text x={lx} y={y + 17} textAnchor={anchor} className="pin-name" style={{ fontSize: 14 }}>{dc.name}</text>
    </g>
  );
}

function FlowArrow({ mode, net }) {
  const exporting = mode === 'EKSPORT';
  const col = exporting ? 'var(--acc)' : 'var(--red)';
  const tok = fmtTokens(Math.abs(net));

  if (exporting) {
    // EKSPORT — wschodnia granica, strzałka wychodzi na wschód (do regionu)
    const y = VIEW.h * 0.25;
    const xR = VIEW.w * 0.95;
    const xL = xR - 120;
    return (
      <g className="flow" pointerEvents="none">
        <path d={`M${xL} ${y} L${xR} ${y}`} stroke={col} strokeWidth="6" fill="none"
              opacity="0.85" strokeDasharray="2 14" strokeLinecap="round" className="flow-dash" />
        <path d={`M${xR} ${y} l-22 -13 l0 26 z`} fill={col} />
        <text x={xR} y={y - 20} textAnchor="end" className="flow-label" fill={col}>EKSPORT</text>
        <text x={xR} y={y + 36} textAnchor="end" className="flow-num" fill={col}>
          {tok.num} {tok.unit} tok/d → region
        </text>
      </g>
    );
  }
  // IMPORT — zachodnia granica, strzałka wchodzi z Niemiec do środka Polski
  const y = VIEW.h * 0.42;
  const xL = VIEW.w * 0.02;
  const xR = xL + 110;
  return (
    <g className="flow" pointerEvents="none">
      <path d={`M${xL} ${y} L${xR} ${y}`} stroke={col} strokeWidth="6" fill="none"
            opacity="0.85" strokeDasharray="2 14" strokeLinecap="round" className="flow-dash" />
      <path d={`M${xR} ${y} l-22 -13 l0 26 z`} fill={col} />
      <text x={xL} y={y - 20} textAnchor="start" className="flow-label" fill={col}>IMPORT</text>
      <text x={xL} y={y + 36} textAnchor="start" className="flow-num" fill={col}>
        {tok.num} {tok.unit} tok/d
      </text>
    </g>
  );
}

function PolandMap({ dcs, selectedId, onSelect, onAddAt, mode, net, acc }) {
  const svgRef = _useRefMap(null);

  function handleBg(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (!pointInPoland(p.x, p.y)) { onSelect(null); return; }
    const { lon, lat } = unproject(p.x, p.y);
    onAddAt(lon, lat);
  }

  // rysuj plany pod spodem, realne na wierzchu (mniejsze, „żywe")
  const planned = dcs.filter((d) => d.kind !== 'real');
  const real = dcs.filter((d) => d.kind === 'real');

  return (
    <svg ref={svgRef} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="map-svg"
         onClick={handleBg}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke={acc} strokeWidth="0.5" opacity="0.06" />
        </pattern>
        <radialGradient id="landglow" cx="42%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#12211c" />
          <stop offset="100%" stopColor="#0a1411" />
        </radialGradient>
      </defs>

      {/* ląd */}
      <path d={borderPath()} fill="url(#landglow)" stroke={acc} strokeWidth="1.6"
            strokeOpacity="0.55" />
      <path d={borderPath()} fill="url(#grid)" />
      <path d={borderPath()} fill="none" stroke={acc} strokeWidth="3" strokeOpacity="0.12"
            className="border-glow" />

      {/* Miasta referencyjne — orientacja geograficzna */}
      {CITIES.map((c) => {
        const cp = project(c.lon, c.lat);
        const capital = c.name === 'Warszawa';
        const flip = cp.x > VIEW.w * 0.72;
        return (
          <g key={c.name} pointerEvents="none">
            {capital && <circle cx={cp.x} cy={cp.y} r="5" fill="none" stroke="#7d8f88" strokeWidth="1.5" />}
            <circle cx={cp.x} cy={cp.y} r={capital ? 1.8 : 2.2} fill="#7d8f88" />
            <text x={cp.x + (flip ? -9 : 9)} y={cp.y + 5}
                  textAnchor={flip ? 'end' : 'start'} className="ref-label">{c.name}</text>
          </g>
        );
      })}

      <FlowArrow mode={mode} net={net} />

      {planned.map((dc) => (
        <PlannedPin key={dc.id} dc={dc} selected={dc.id === selectedId} onSelect={onSelect} acc={acc} />
      ))}
      {real.map((dc) => (
        <RealPin key={dc.id} dc={dc} selected={dc.id === selectedId} onSelect={onSelect} acc={acc} />
      ))}
    </svg>
  );
}

Object.assign(window, { PolandMap, plannedRadius, realRadius, powerLabel, gpuLabel });
