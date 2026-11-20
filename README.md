# Advent Calendar 2026 (vängruppen)

Vängruppens engelska adventskalender. En kopia av familjens kalender (`behnosh-sh/adventskalender`, main 83bf0f6)
med engelska texter, utan kassaskåpet, repetitionen och Mästarprovet. Familjens repo rörs aldrig härifrån.
Statisk sida på GitHub Pages, inga konton och ingen server.

## Skillnader mot familjens kalender

- Allt som sparas i telefonen har prefixet `friends:` (`Advent.LAGRING_PREFIX` i `js/gemensam.js`), så att
  vännernas och familjens kalender aldrig blandas ihop fast de ligger på samma adress (behnosh-sh.github.io).
- Egen resultattavla: eget Google-ark och eget script (`google/resultat.gs`), adressen står i `js/resultat.js`.
- Behnosh spelar bara familjens kalender. Hon klistrar själv in sina rader från familjens ark i fliken
  Familjen i vännernas ark. Dag 7, 16 och 21 har eget innehåll här och får en rad "–" åt henne.
- Lucka 24 (julhälsning och prisutdelning) byggs senare. Dag 4, 7, 16 och 21 får sitt engelska innehåll i ett eget steg.
- Spellogik, frön och banor är desamma som i familjens kalender.

## Struktur

- `index.html` – startsidan med granarna.
- `js/luckor.js` – vilket spel som ligger bakom varje lucka, datumlåset.
- `js/gemensam.js` – delad kod: dag, frö, slump, lagring (med prefix), pausrutan, fråga-rutan.
- `js/resultat.js` – resultattavlan: kodruta, skicka, dagens tavla.
- `resultat/index.html` – alla luckors resultat.
- `google/` – Apps Script för arket, se `google/README.md`.
- `spel/<namn>/index.html` – ett spel per mapp. Läser dagen från `?dag=N`.

## Testa lokalt

```
python3 -m http.server
```

Öppna http://localhost:8000/. Luckorna öppnas efter telefonens datum (december 2026).
