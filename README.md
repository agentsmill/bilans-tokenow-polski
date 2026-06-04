# Bilans tokenów Polski

Interaktywny symulator data center AI w Polsce — pokazuje **bilans importu / eksportu tokenów**:
ile mocy obliczeniowej Polska *produkuje* (podaż z mapy data center) wobec tego, ile *zużywa*
(popyt konsumencki + agentyczny na różnych etapach adopcji AI).

> **Model edukacyjny i poglądowy — nie prognoza inwestycyjna.**

## Dwie warstwy: realne vs planowane

Sednem modelu jest rozróżnienie:

- **Realne dziś** — faktycznie działająca infrastruktura GPU (Cyfronet Helios/Athena, Beyond.pl
  AI Factory, PCSS PIAST-AI). Tego jest *mało* (~1 300 kart) i liczone jest realnym, niższym
  throughputem wg generacji (A100 ~900, H100 ~1800, GH200 ~2200, B200 ~3500 tok/s). Na tej
  podstawie Polska jest dziś **importerem** tokenów (~40% pokrycia popytu).
- **Plany** — ogłoszone wielkoskalowe DC (Lublewko, Stargard, Bełchatów…), łącznie ~5,12 GW
  mocy przyłączeniowej, liczone throughputem GB200 NVL72. Po zbudowaniu czynią z Polski
  masywnego **eksportera** mocy obliczeniowej.

Przełącznik **„Podstawa podaży"** (Realne dziś · Plany · Razem) decyduje, na czym liczony jest bilans.

## Co potrafi

- **Mapa Polski (SVG)** z dwiema warstwami: realne klastry (pełne punkty, skala = liczba GPU)
  i planowane DC (przerywane punkty, skala = moc przyłączeniowa).
- **Dodawanie** DC — kliknij wnętrze mapy → ustaw nazwę i moc (warstwa planów).
- **Edycja / usuwanie** — kliknij punkt (realne edytuje liczbę GPU, planowane — moc).
- **4 etapy adopcji AI** (Dziś → Pełna automatyzacja) przeliczające popyt w czasie rzeczywistym.
- **Wielki wskaźnik EKSPORT / IMPORT** + bilans netto tokenów na dobę.
- **Trójpaskowy gauge (skala log)**: podaż realna vs wg planów vs popyt; struktura popytu, agent-FTE.
- **Karty**: liczba GPU, CAPEX (mld zł), moc potrzebna na pokrycie popytu, udział w szczycie KSE (~27 GW).
- **Suwaki parametrów DC**: PUE, utilization, % mocy na inference.
- **Sekcja wniosków strategicznych** + nota metodologiczna.

## Uruchomienie lokalne

Aplikacja to statyczne pliki (React + Babel z CDN, transpilacja w przeglądarce).
Wymaga serwera HTTP (nie `file://`, bo Babel pobiera pliki `.jsx`):

```bash
python3 -m http.server 8000
# otwórz http://localhost:8000
```

## Struktura

| Plik | Rola |
|---|---|
| `index.html` | szkielet + pełny arkusz stylów (ciemny „terminal energetyczny") |
| `data.js` | stałe silnika, dane DC, presety etapów, projekcja mapy, formatowanie PL |
| `engine.js` | silnik symulacji: podaż / popyt / bilans / CAPEX |
| `map.jsx` | interaktywna mapa Polski (rzutowanie equirectangular) |
| `panel.jsx` | panel sterowania i wyniki |
| `conclusions.jsx` | wnioski strategiczne + metodologia |
| `app.jsx` | kompozycja, stan, modal dodawania/edycji DC |

## Metodologia w skrócie

Podaż liczona z sumy mocy DC: moc → moc IT (przez PUE) → szafy NVL72 → GPU → tokeny/dobę
(throughput 7 583 tok/s/GPU, SGLang/DeepSeek-V3). Popyt = konsumencki (userzy × zapytania × tokeny)
+ agentyczny (zautomatyzowane etaty × budżet tokenów agenta). Bilans = podaż − popyt.

Dane twarde: moc DC, sprzęt GB200 NVL72 (NVIDIA/HPE/SGLang), użytkownicy AI (Gemius/PBI 2025),
etaty (GUS 2025), szczyt KSE ~27 GW. Reszta to edytowalne założenia rzędu wielkości.

---

Zaprojektowane w [Claude Design](https://claude.ai/design), zaimplementowane jako statyczna strona.
