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

function Conclusions({ params }) {
  const full = STAGES.find((s) => s.id === 'full');
  const fullDem = stageDemand(full).total;
  const fullGW = gwNeeded(fullDem, params);

  return (
    <section className="conclusions">
      <div className="conc-head">
        <span className="kicker">Wnioski strategiczne</span>
        <h2>Nie tokeny są wąskim gardłem. Megawaty.</h2>
      </div>

      <div className="wnioski">
        <Wniosek n={1} title="5,12 GW to nie informatyka — to energetyka">
          Moc z mapy to około jednej piątej szczytowego zapotrzebowania całej Polski
          (~27 GW). Lokalizacje — offshore na wybrzeżu (Lublewko, Stargard) i węzeł
          w Bełchatowie — są podyktowane dostępem do energii, nie do światłowodu.
        </Wniosek>
        <Wniosek n={2} title="Dziś Polska to gigantyczny eksporter tokenów">
          Krajowy popyt konsumencki (~150 mld tok/dobę) to ułamek tego, co produkuje
          5 GW Blackwellów. Te data center nie powstają „dla Polaków na czacie" — to
          infrastruktura eksportowa i treningowa dla regionu.
        </Wniosek>
        <Wniosek n={3} title="Punkt przegięcia to tryb agentyczny, nie więcej czatowania">
          Człowiek = kilka zapytań dziennie. Agent pracujący 8–24 h = miliony tokenów
          dziennie. Popyt rośnie liniowo z liczbą zautomatyzowanych etatów — a białych
          kołnierzyków jest w Polsce realnie 5–6 mln.
        </Wniosek>
        <Wniosek n={4} title="Gospodarka agentyczna zderzy się z limitem megawatów">
          Przy obecnych założeniach pełna automatyzacja pracy wiedzy generuje popyt
          rzędu {fmtTokens(fullDem).num} {fmtTokens(fullDem).unit} tok/dobę — do jego
          pokrycia trzeba ~{fmtNum(fullGW, fullGW >= 10 ? 0 : 1)} GW mocy. Fizyczny
          sufit automatyzacji wyznacza energetyka, nie krzem.
        </Wniosek>
        <Wniosek n={5} title="Kto kontroluje tanią energię, kontroluje pułap automatyzacji">
          To czyni offshore wind, atom i kogenerację (Bełchatów) strategicznymi aktywami
          w erze AI. Megawat staje się jednostką rozliczeniową gospodarki agentycznej.
        </Wniosek>
      </div>

      <div className="methodology">
        <div className="meth-col">
          <h4>Dane twarde</h4>
          <p>Moc DC (mapa) · sprzęt GB200 NVL72 (NVIDIA / HPE / SGLang) · użytkownicy AI
          (Gemius&nbsp;/&nbsp;PBI Mediapanel 2025) · etaty (GUS 2025) · szczyt KSE ~27 GW.</p>
        </div>
        <div className="meth-col">
          <h4>Założenia (edytowalne)</h4>
          <p>Konwersja minut→tokeny, utilization, % inference, budżety tokenów agentów,
          mnożniki intensywności, % automatyzacji. To szacunki rzędu wielkości — dlatego
          są suwakami, nie liczbami.</p>
        </div>
        <div className="meth-col">
          <h4>Uwaga o throughput</h4>
          <p>7 583 tok/s/GPU dotyczy benchmarku SGLang (DeepSeek-V3, prompt 2k, decode).
          Dłuższy kontekst lub modele reasoning znacząco go obniżają — model jest
          poglądowy, nie jest prognozą inwestycyjną.</p>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Conclusions });
