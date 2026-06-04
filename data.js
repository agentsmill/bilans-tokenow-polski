/* ===========================================================================
   data.js — twarde dane, stałe, presety, projekcja mapy, formatowanie liczb
   Wszystko eksportowane do window (współdzielone między skryptami babel).
   =========================================================================== */

/* ----------------------------- STAŁE SILNIKA ----------------------------- */
const CONST = {
  TPS: 7583,            // tok/s na GPU — GB200 NVL72 (SGLang / DeepSeek-V3, prompt 2k, decode)
  GPU_PER_RACK: 72,     // Blackwell GB200 NVL72
  RACK_KW: 120,         // moc na szafę (HPE: 132; baza 120)
  PUE: 1.25,            // sprawność DC
  INF: 0.70,            // % mocy na inference
  UTIL: 0.60,           // utilization
  USDPLN: 4.0,
  CAPEX_PER_MW_IT: 37e6,// USD/MW IT (all-in)
  POP: 38_500_000,
  KSE_PEAK_GW: 27,      // szczyt zapotrzebowania KSE (zima)
};

/* --- THROUGHPUT wg generacji GPU (tok/s/GPU, szacunki rzędu wielkości) ---
   Benchmark bazowy 7 583 dotyczy GB200 w NVL72 (domena NVLink-72). Starsze i
   pojedyncze karty są przy inferencji LLM znacząco wolniejsze — dlatego realna
   infrastruktura liczona jest niższym, generacyjnym throughputem. */
const TPS_BY_GPU = {
  GB200: 7583,   // Blackwell NVL72 (planowane wielkoskalowe DC)
  B200:  3500,   // Blackwell DGX/HGX (Beyond.pl AI Factory)
  GH200: 2200,   // Grace Hopper (Cyfronet Helios)
  H100:  1800,   // Hopper
  A100:   900,   // Ampere (Cyfronet Athena)
};

/* ===========================================================================
   DATA CENTER — DWIE WARSTWY
   - PLANNED: ogłoszone plany; moc przyłączeniowa (MW). GPU wyprowadzane z mocy,
     throughput GB200 NVL72.
   - REAL: faktycznie działająca infrastruktura GPU (2025). Liczba GPU wpisana
     wprost (dane / szacunki), throughput zależny od generacji kart.
   =========================================================================== */

/* --- PLANY (ogłoszone wielkoskalowe DC AI) — moc przyłączeniowa --- */
const PLANNED_DCS = [
  { id: 'p1', kind: 'planned', name: 'Lublewko',      mw: 3200, lat: 54.60, lon: 17.90, note: 'offshore wind' },
  { id: 'p2', kind: 'planned', name: 'Stargard',      mw: 960,  lat: 53.30, lon: 15.00, note: 'offshore wind' },
  { id: 'p3', kind: 'planned', name: 'Konin',         mw: 260,  lat: 52.20, lon: 18.25, note: '' },
  { id: 'p4', kind: 'planned', name: 'Bełchatów',     mw: 500,  lat: 51.20, lon: 19.40, note: 'węzeł energetyczny' },
  { id: 'p5', kind: 'planned', name: 'Bielsko-Biała', mw: 200,  lat: 49.80, lon: 19.05, note: '' },
];

/* --- REALNA INFRASTRUKTURA GPU (2025) — publicznie znane klastry ---
   gpus = przybliżona liczba kart AI-grade; tps = throughput wg generacji.
   Cyfronet (Kraków): Helios (440× GH200 + 24× H100) + Athena (384× A100), blended.
   Beyond.pl (Poznań): NVIDIA DGX B200 SuperPOD — skala ~1 scalable unit (szac.).
   PCSS / PIAST-AI (Poznań): EuroHPC AI Factory — rząd setek kart H100-class (szac.). */
const REAL_DCS = [
  { id: 'r1', kind: 'real', name: 'Cyfronet',  lat: 50.07, lon: 19.92,
    gpus: 848, tps: 1600, gpuType: 'GH200 / A100 / H100', note: 'Helios + Athena · Kraków' },
  { id: 'r2', kind: 'real', name: 'Beyond.pl', lat: 52.25, lon: 16.62,
    gpus: 256, tps: TPS_BY_GPU.B200, gpuType: 'DGX B200 SuperPOD', note: 'AI Factory · Poznań (szac.)' },
  { id: 'r3', kind: 'real', name: 'PCSS',      lat: 52.62, lon: 17.10,
    gpus: 200, tps: TPS_BY_GPU.H100, gpuType: 'H100-class', note: 'PIAST-AI / EuroHPC · Poznań (szac.)' },
];

// Pełny stan wyjściowy mapy = obie warstwy (używane też przy resecie).
const INITIAL_DCS = [...REAL_DCS, ...PLANNED_DCS].map((d) => ({ ...d }));

const WARSAW = { name: 'Warszawa', lat: 52.23, lon: 21.01 };

/* --------------------------- ETAPY ADOPCJI AI ---------------------------- */
/* Popyt całkowity = konsumencki + agentyczny */
const STAGES = [
  {
    id: 'today', label: 'Dziś', sub: '2025', year: '2025',
    users_mln: 12, queriesPerDay: 8, tokPerQuery: 1500,
    jobs_mln: 5.5, autoFraction: 0.05, intensityMult: 1.2, hoursPerDay: 6, tokPerHour: 50_000,
    blurb: 'Człowiek przy czacie. Kilka zapytań dziennie, marginalna automatyzacja.',
  },
  {
    id: 'early', label: 'Wczesna', sub: '2026 / 27', year: '2026–27',
    users_mln: 18, queriesPerDay: 12, tokPerQuery: 2000,
    jobs_mln: 5.5, autoFraction: 0.25, intensityMult: 1.5, hoursPerDay: 8, tokPerHour: 120_000,
    blurb: 'Pierwsi agenci w pracy biurowej. Popyt zaczyna być znaczący.',
  },
  {
    id: 'mature', label: 'Dojrzała', sub: '2028 / 30', year: '2028–30',
    users_mln: 25, queriesPerDay: 20, tokPerQuery: 2500,
    jobs_mln: 6, autoFraction: 0.50, intensityMult: 3, hoursPerDay: 14, tokPerHour: 300_000,
    blurb: 'Połowa pracy wiedzy zautomatyzowana. Agenci pracują kilkanaście godzin.',
  },
  {
    id: 'full', label: 'Pełna automatyzacja', sub: '', year: '20XX',
    users_mln: 30, queriesPerDay: 30, tokPerQuery: 3000,
    jobs_mln: 6, autoFraction: 0.90, intensityMult: 6, hoursPerDay: 24, tokPerHour: 800_000,
    blurb: 'Agenci 24/7. Popyt zderza się z fizycznym sufitem megawatów.',
  },
];

/* ------------------------- PARAMETRY DC (suwaki) ------------------------- */
const PARAM_DEFAULTS = { pue: 1.25, util: 0.60, inf: 0.70 };

/* ===========================================================================
   PROJEKCJA MAPY — equirectangular z korektą cos(lat) dla naturalnych proporcji
   project(lon,lat) -> {x,y} w przestrzeni VIEW.w × VIEW.h
   =========================================================================== */
const GEO = { lon0: 14.07, lon1: 24.18, lat0: 49.00, lat1: 54.95 };
const COSLAT = Math.cos((52 * Math.PI) / 180); // ~0.6157
const _spanX = (GEO.lon1 - GEO.lon0) * COSLAT;
const _spanY = GEO.lat1 - GEO.lat0;
const VIEW = { w: 1000, h: Math.round((1000 * _spanY) / _spanX) }; // ~956

function project(lon, lat) {
  const nx = (lon - GEO.lon0) * COSLAT;
  const ny = GEO.lat1 - lat;
  return { x: (nx / _spanX) * VIEW.w, y: (ny / _spanY) * VIEW.h };
}
// odwrotność — dla klikania na pustą mapę (px -> lon/lat)
function unproject(x, y) {
  const nx = (x / VIEW.w) * _spanX;
  const ny = (y / VIEW.h) * _spanY;
  return { lon: GEO.lon0 + nx / COSLAT, lat: GEO.lat1 - ny };
}

/* --------- KONTUR POLSKI: punkty graniczne [lon,lat], zgodnie z ruchem
            wskazówek zegara, od NW wzdłuż Bałtyku --------- */
const BORDER_LL = [
  // Wybrzeże Bałtyku (W -> E), od ujścia Odry / Świnoujścia
  [14.22, 53.92], [14.62, 53.97], [15.10, 54.18], [15.58, 54.19],
  [16.20, 54.26], [16.85, 54.55], [17.55, 54.79], [18.33, 54.84],   // Rozewie — najdalej na N
  // Półwysep Helski + Zatoka Gdańska
  [18.42, 54.80], [18.80, 54.61], [18.50, 54.52], [18.70, 54.37], [19.00, 54.36],
  [19.65, 54.45],                                                    // Mierzeja Wiślana
  // Granica z Obwodem Kaliningradzkim (Rosja)
  [20.30, 54.42], [21.20, 54.32], [22.10, 54.35], [22.78, 54.36],
  // Litwa
  [23.10, 54.28], [23.48, 54.14], [23.52, 53.96],
  // Białoruś (Bug, wybrzuszenie Białowieży)
  [23.92, 53.18], [23.94, 52.70], [23.62, 52.40], [23.55, 52.10],
  // Ukraina (Bug, najdalej na wschód)
  [23.90, 51.60], [24.15, 50.86], [23.65, 50.40], [22.65, 49.55], [22.86, 49.05],
  // Słowacja (łuk karpacki — Bieszczady, Tatry)
  [22.20, 49.22], [21.40, 49.38], [20.95, 49.28], [20.10, 49.17], [19.78, 49.19],
  [19.45, 49.40], [19.18, 49.40], [18.85, 49.52],
  // Czechy (Śląsk, Kotlina Kłodzka, Karkonosze)
  [18.60, 49.90], [18.05, 50.18], [17.72, 50.30], [17.00, 50.22], [16.55, 50.55],
  [16.20, 50.62], [15.50, 50.78], [15.00, 50.86], [14.82, 50.87],
  // Niemcy (Nysa Łużycka, Odra)
  [14.72, 51.50], [14.60, 52.05], [14.13, 52.85], [14.15, 53.05], [14.41, 53.27],
  [14.27, 53.62],
];

/* --------- MIASTA REFERENCYJNE — orientacja na mapie (bez DC) --------- */
const CITIES = [
  { name: 'Warszawa',  lat: 52.23, lon: 21.01 },
  { name: 'Gdańsk',    lat: 54.35, lon: 18.65 },
  { name: 'Szczecin',  lat: 53.43, lon: 14.55 },
  { name: 'Poznań',    lat: 52.41, lon: 16.93 },
  { name: 'Wrocław',   lat: 51.11, lon: 17.03 },
  { name: 'Łódź',      lat: 51.77, lon: 19.46 },
  { name: 'Lublin',    lat: 51.25, lon: 22.57 },
  { name: 'Białystok', lat: 53.13, lon: 23.16 },
  { name: 'Bydgoszcz', lat: 53.12, lon: 18.00 },
  { name: 'Olsztyn',   lat: 53.78, lon: 20.49 },
  { name: 'Rzeszów',   lat: 50.04, lon: 22.00 },
];

function borderPath() {
  return BORDER_LL.map((p, i) => {
    const { x, y } = project(p[0], p[1]);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

/* ===========================================================================
   FORMATOWANIE LICZB — po polsku (spacja = separator tysięcy, przecinek = dziesiętny)
   =========================================================================== */
const _nf = (min, max) => new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: min, maximumFractionDigits: max,
});

// liczba całkowita ze spacjami
function fmtInt(n) { return _nf(0, 0).format(Math.round(n)); }

// liczba z N miejscami po przecinku
function fmtNum(n, d = 1) { return _nf(d, d).format(n); }

// duże liczby tokenów -> jednostka PL: mld (1e9), bln (1e12), bld (1e15), tryl (1e18)
function fmtTokens(n) {
  const units = [
    { v: 1e18, s: 'tryl' },
    { v: 1e15, s: 'bld' },
    { v: 1e12, s: 'bln' },
    { v: 1e9,  s: 'mld' },
    { v: 1e6,  s: 'mln' },
    { v: 1e3,  s: 'tys' },
  ];
  const abs = Math.abs(n);
  for (const u of units) {
    if (abs >= u.v) {
      const val = n / u.v;
      const d = Math.abs(val) >= 100 ? 0 : 1;
      return { num: fmtNum(val, d), unit: u.s };
    }
  }
  return { num: fmtInt(n), unit: '' };
}

// pieniądze w mld PLN
function fmtMldPLN(pln) {
  const mld = pln / 1e9;
  const d = mld >= 100 ? 0 : 1;
  return fmtNum(mld, d);
}

// moc z adaptacyjną jednostką — nigdy „0,0 GW": < 1 GW pokazujemy w MW, < 1 MW w kW
function fmtPower(gw) {
  if (gw >= 1) return { num: fmtNum(gw, gw >= 10 ? 0 : 2), unit: 'GW' };
  const mw = gw * 1000;
  if (mw >= 1) return { num: fmtNum(mw, mw >= 100 ? 0 : 1), unit: 'MW' };
  return { num: fmtInt(mw * 1000), unit: 'kW' };
}

Object.assign(window, {
  CONST, TPS_BY_GPU, PLANNED_DCS, REAL_DCS, INITIAL_DCS, WARSAW, CITIES, STAGES, PARAM_DEFAULTS,
  GEO, VIEW, project, unproject, BORDER_LL, borderPath,
  fmtInt, fmtNum, fmtTokens, fmtMldPLN, fmtPower,
});
