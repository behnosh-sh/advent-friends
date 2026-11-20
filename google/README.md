# Vännernas resultattavla i Google

Samma upplägg som familjens: ett privat Google Sheet och ett litet Apps Script som körs som Behnosh.
Arket delas aldrig, och koderna finns bara i arket.

`resultat.gs` är webbappen som sidan pratar med. Den har `@OnlyCurrentDoc` och kommer bara åt vännernas ark.
Dina resultat hämtas av en formel i fliken **Familjen** (`IMPORTRANGE` + `QUERY`), som bara plockar ut dina rader
ur familjens ark. Inget script läser familjens ark, och familjens ark ändras aldrig. Google uppdaterar formeln själv,
oftast inom en halvtimme efter att du har spelat.

## 1. Arket och webbappen (en gång)

1. Skapa ett nytt Google Sheet, t.ex. "Advent friends results". Dela det inte.
2. I arket: **Tillägg > Apps Script**. Ta bort det som står där och klistra in hela `resultat.gs`. Spara.
3. Klistra in adressen till familjens resultatark mellan fnuttarna på raden `var FAMILJENS_ARK = '';`. Spara.
4. Välj funktionen **installera** i listan överst och tryck **Kör**. Godkänn behörigheterna
   (**Avancerat > Gå till ... (osäkert)**, det är ditt eget script).
   Nu finns flikarna **Spelare**, **Resultat** och **Familjen**.
5. Öppna fliken **Familjen**. Cell A1 visar `#REF!`: tryck på den och välj **Tillåt åtkomst**. Då fylls fliken med
   dina resultat från familjen (bara rubriken om du inte har spelat än). Det här godkänner du bara en gång.
6. I fliken **Spelare**: byt ut Friend 1–5 mot vännernas namn (så som de ska synas på tavlan) och skriv en
   fyrsiffrig kod till var och en, även till dig själv. Raden **Behnosh** ska heta exakt så.
7. **Distribuera > Ny distribution**, kugghjulet: **Webbapp**. Kör som: **Jag**. Vem har åtkomst: **Alla**.
   Tryck **Distribuera** och kopiera adressen (slutar på `/exec`).
8. Skicka adressen till Claude, eller klistra in den i `js/resultat.js` på raden `var ADRESS = '';`.

## Säkerhet

- Utan rätt kod gör scriptet ingenting. Efter 10 felaktiga koder på en timme spärras alla försök i en timme (50 den 24–26 december).
- Andras resultat för en dag syns bara för den som själv har skickat in den dagen. Från julafton syns allt för alla.
- Bara det första resultatet per person och dag sparas. Ändringar görs direkt i arket.
- Behnosh kan inte skicka något i vännernas kalender. Hennes rader kommer bara från fliken Familjen.
- Formeln i Familjen ger vännernas ark läsrätt till familjens ark. Båda arken är dina och delas aldrig.
- Vill du nollställa efter testandet: radera raderna i fliken Resultat (inte rubrikraden).
