# Bilans tokenów Polski

Interaktywny symulator data center AI w Polsce — pokazuje **bilans importu / eksportu tokenów**:
ile mocy obliczeniowej Polska *produkuje* (podaż z mapy data center) wobec tego, ile *zużywa*
(popyt konsumencki + agentyczny na różnych etapach adopcji AI).

> **Model edukacyjny i poglądowy — nie prognoza inwestycyjna.**

## Co potrafi

- **Mapa Polski (SVG)** z data center jako pulsującymi punktami (wielkość ∝ moc przyłączeniowa).
- **Dodawanie** DC — kliknij wnętrze mapy → ustaw nazwę i moc.
- **Edycja / usuwanie** — kliknij istniejący punkt.
- **4 etapy adopcji AI** (Dziś → Pełna automatyzacja) przeliczające popyt w czasie rzeczywistym.
- **Wielki wskaźnik EKSPORT / IMPORT** + bilans netto tokenów na dobę.
- **Gauge podaż vs popyt**, struktura popytu (konsumencki / agentyczny), liczba agent-FTE.
- **Karty kosztów**: CAPEX (mld zł), moc potrzebna na pokrycie popytu, udział w szczycie KSE (~27 GW).
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
