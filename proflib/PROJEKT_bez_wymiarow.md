# Projekt (WIP, opt-in, osobny branch oria-207-proflib): stabilny model bez wymiarów + biblioteka profili
Stan: NIE wpięte w aplikację; zero wpływu na domyślne zachowanie. Dane + API + test (node test_proflib.js → 14/14).

## 1. Biblioteka profili (`proflib/profile_lib.json`, `profile_lib.js`)
- 133 pozycje: kątowniki L (równo- i nierównoramienne), UPN, IPE, HEA, HEB, SHS, RHS, CHS, płaskowniki FL; typoszereg grubości blach; wartości domyślne.
- Masa ≈ pole × 7,85 kg/dm³, pole uproszczone (bez promieni) – do szacunków (APPROXIMATE), do weryfikacji z tablicami.
- `parse(tekst)` czyta oznaczenia z OCR/BOM: „RHS 40x40x3”, „L 50x5”, „Ø48,3x2,6”, „UPN 100”, „IPE200”, „płaskownik 20x5”, „profil zamknięty 60x40x3”, gołe „80x40x3” (słabe) → exact / nearest (≤15% różnicy) / custom.
- Miejsca użycia (następny krok, każde za flagą `#proflib=1`): frameGeo (przekrój pręta z opisu zamiast „z rozstawu linii”), iso_fuse flatAngleFrame (FLAT BAR/L ANGLE z tabeli), lista części + masa (qty_mat.js), P2 (podpowiedź profilu).

## 2. Stabilny model bez wymiarów (`#stdapprox=1`)
Problem: przy braku wymiarów (scaleConf=„zgadnięta”) dziś skala = „największy rozmiar 500 mm”, a grubości/profile z pikseli → wynik skacze między zdjęciami tego samego rysunku.
Reguły (deterministyczne, ta sama kartka → ten sam model):
1. Kształt = obrys rzutów (jak dziś), skala z: (a) skali z tabliczki („1:5”, „M 1:10”) + format arkusza (A4/A3 z proporcji kartki) → mm/px; (b) inaczej 500 mm na największy gabaryt (jak dziś); zawsze APPROXIMATE z podaniem źródła.
2. Gabaryt zaokrąglany do 5 mm (≥100 mm) / 1 mm (<100 mm).
3. Grubości/profile ze standardu, nie z pikseli: blacha `std('plate')` 5 mm, gięta 3 mm (snap do typoszeregu `snapT` gdy jest pomiar z rastra ±30%), rama `SHS 40x40x3` albo profil z opisu (`parse`), rura `CHS 48.3x2.6`.
4. W opisie modelu jawnie: „wymiary szacunkowe – obrys + wartości standardowe (…)”, w P2/potwierdzeniu wymiarów (#dimconfirm=1) pierwszy krok = wpisz 1 wymiar gabarytowy (linia A→B) → przeskalowanie całego modelu.
5. Test stabilności: ta sama kartka w 750/1170/1500 px i 2 zdjęcia → gabaryt ±2%, ten sam typ i te same profile (rama_new: płyta z otworami ×3 rozdzielczości).
Wpięcie: po klasyfikacji w analyze(), tylko gdy `m.scaleConf=='zgadnięta'` i flaga; bez flagi – 2.5 bez zmian.
