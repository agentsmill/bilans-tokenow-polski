/* conclusions.jsx — wnioski strategiczne + metodologia */

function Wniosek({ n, title, children }) {
  return (
    <div className="wniosek">
      <div className="wniosek-n">{String(n).padStart(2, '0')}</div>
      <div className="wniosek-body">
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Conclusions({ params, supReal, supPlan }) {
  const today = STAGES.find((s) => s.id === 'today');
  const full = STAGES.find((s) => s.id === 'full');
  const todayDem = stageDemand(today).total;
  const fullDem = stageDemand(full).total;
  const fullGW = gwNeeded(fullDem, params);

  // pokrycie dzisiejszego popytu realną infrastrukturą
  const realCov = todayDem > 0 ? (supReal.tokDay / todayDem) * 100 : Infinity;
  const realMode = supReal.tokDay >= todayDem ? 'eksporterem' : 'importerem';
  const planFactor = supReal.tokDay > 0 ? supPlan.tokDay / supReal.tokDay : Infinity;

  return (
    <section className="conclusions">
      <div className="conc-head">
        <span className="kicker">Wnioski strategiczne</span>
        <h2>Nie tokeny są wąskim gardłem. Megawaty.</h2>
      </div>

      <div className="wnioski">
        <Wniosek n={1} title="Realnie dziś jest mało GPU — Polska jest importerem tokenów">
          Faktycznie działająca infrastruktura AI (Cyfronet, Beyond.pl, PCSS) to rząd
          {' '}{fmtInt(supReal.gpus)} kart i ~{fmtTokens(supReal.tokDay).num} {fmtTokens(supReal.tokDay).unit} tok/dobę —
          {' '}wobec dzisiejszego popytu konsumenckiego pokrywa to zaledwie ~{isFinite(realCov) ? fmtInt(realCov) : '∞'}%.
          Na realnym sprzęcie Polska jest dziś {realMode} mocy obliczeniowej.
        </Wniosek>
        <Wniosek n={2} title="Eksporterem czynią Polskę dopiero PLANY, nie dzisiejszy sprzęt">
          Ogłoszone wielkoskalowe DC (Lublewko, Stargard, Bełchatów…) to ~{fmtNum(supPlan.gw, 2)} GW —
          po zbudowaniu ~{isFinite(planFactor) ? fmtInt(planFactor) : '∞'}× więcej podaży niż cała realna baza dziś.
          To infrastruktura eksportowa i treningowa dla regionu, nie „dla Polaków na czacie".
        </Wniosek>
        <Wniosek n={3} title="5,12 GW planów to nie informatyka — to energetyka">
          Planowana moc to około jednej piątej szczytowego zapotrzebowania całej Polski
          (~27 GW). Lokalizacje — offshore na wybrzeżu i węzeł w Bełchatowie — są podyktowane
          dostępem do energii, nie do światłowodu.
        </Wniosek>
        <Wniosek n={4} title="Punkt przegięcia to tryb agentyczny, nie więcej czatowania">
          Człowiek = kilka zapytań dziennie. Agent pracujący 8–24 h = miliony tokenów
          dziennie. Popyt rośnie liniowo z liczbą zautomatyzowanych etatów — a białych
          kołnierzyków jest w Polsce realnie 5–6 mln.
        </Wniosek>
        <Wniosek n={5} title="Gospodarka agentyczna zderzy się z limitem megawatów">
          Przy obecnych założeniach pełna automatyzacja pracy wiedzy generuje popyt rzędu
          {' '}{fmtTokens(fullDem).num} {fmtTokens(fullDem).unit} tok/dobę — do jego pokrycia trzeba
          {' '}~{fmtNum(fullGW, fullGW >= 10 ? 0 : 1)} GW mocy. Kto kontroluje tanią, stabilną energię
          (offshore, atom, kogeneracja), kontroluje pułap automatyzacji gospodarki.
        </Wniosek>
      </div>

      <div className="methodology">
        <div className="meth-col">
          <h4>Dane twarde</h4>
          <p>Plany mocy DC · realne klastry GPU (Cyfronet Helios/Athena, Beyond.pl AI Factory,
          PCSS PIAST-AI) · sprzęt GB200 NVL72 (NVIDIA/HPE/SGLang) · użytkownicy AI
          (Gemius&nbsp;/&nbsp;PBI 2025) · etaty (GUS 2025) · szczyt KSE ~27 GW.</p>
        </div>
        <div className="meth-col">
          <h4>Realne vs planowane</h4>
          <p>Plany liczone z mocy przyłączeniowej przy throughput GB200 NVL72. Realna podaż —
          z liczby faktycznych GPU przy niższym, generacyjnym throughput (A100 ~900, H100 ~1800,
          GH200 ~2200, B200 ~3500 tok/s). Liczby GPU komercyjnych klastrów są szacunkami.</p>
        </div>
        <div className="meth-col">
          <h4>Uwaga o throughput</h4>
          <p>Benchmark 7 583 tok/s/GPU dotyczy GB200 w NVL72 (DeepSeek-V3, prompt 2k, decode).
          Dłuższy kontekst, modele reasoning i pojedyncze karty znacząco go obniżają — model jest
          poglądowy, nie jest prognozą inwestycyjną.</p>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Conclusions });
