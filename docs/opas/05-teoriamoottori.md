# Luku 5: Teoriamoottori – asteet, nimet, asemat, arpeggiot ja kvinttiympyrä

Vaihe 4 kasvatti `src/music/`-kansiosta sovelluksen "teoriamoottorin". Se osaa nimetä sävelet oikein, laskea asteet, piirtää asemat ja arpeggiot sekä rakentaa sointukierrot mihin tahansa sävellajiin. Käyttöliittymä vain näyttää, mitä moottori laskee.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `music/degrees.ts` | Asteet: 1, ♭3, ♯4… skaalan mukaan |
| `music/spelling.ts` | Oikeat sävelnimet: B♭ F-duurissa, E♭ A-bluesissa |
| `music/blueNotes.ts` | Blue notes (♭3, ♭5, ♭7) |
| `music/positions.ts` | Asemat: pentatonisen boksit, 3NPS ja arpeggioasemat |
| `music/chords.ts` | 13 sointutyyppiä asteineen |
| `music/circle.ts` | Kvinttiympyrä: sävellajit ja niiden 7 sointua |
| `music/progressions.ts` | Sointukierrot ja asteiden värit |
| `components/CircleOfFifths.tsx` | Pyöritettävä ympyrä (SVG + sormen seuranta) |
| `components/ProgressionPractice.tsx` | Kierron valinta, sointujen kytkimet ja otelauta |
| `components/Fretboard.tsx` | Sai asteet, blue notes, asemat, automaattisen rullauksen ja raidalliset sävelet |
| `theme/colors.ts` | Sävelten värit roolin mukaan |

Kaikki teoria on `music/`-kansiossa, eikä siellä ole yhtään ruutua tai väriä (paitsi asteiden värit, jotka kuuluvat kierron määrittelyyn).

## 2. Miksi näin

### Kaikki perustuu intervalleihin ja asteisiin

Koko moottori nojaa kahteen ajatukseen:
1. **Intervalli** = montako puolisävelaskelta pohjasävelen yläpuolella (0–11).
2. **Aste** = monesko sävel skaalassa ja miten se poikkeaa duurista (1, ♭3, ♯4…).

Kun nämä kaksi ovat kunnossa, kaikki muu seuraa niistä:
- **Sävelen nimi** = aste kertoo kirjaimen, intervalli kertoo ♯/♭
- **Arpeggio** = soinnun intervallit
- **Kierto** = asteet sävellajissa (I, IV, V)
- **Kvinttiympyrä** = sävellajit 7 puolisävelaskeleen välein

### Lasketaan, ei kirjoiteta käsin

Tässä vaiheessa sama periaate toistui monta kertaa: **kuviot ja nimet lasketaan säännöistä**.

| Asia | Käsin kirjoitettuna | Laskettuna |
|---|---|---|
| Sävelten nimet | 13 skaalaa × 12 sävellajia = 156 listaa | Yksi sääntö (kirjainsääntö) |
| Asemat | Kuviot jokaiselle soittimelle ja vireelle | Yksi algoritmi (2 tai 3 säveltä kielellä) |
| Kierrot | Jokainen kierto 12 sävellajissa | Asteet, jotka sijoitetaan sävellajiin |

Laskettu versio toimii myös tapauksissa, joita kukaan ei erikseen ajatellut, kuten bassolla, Drop D -virityksellä ja tulevilla omilla skaaloilla.

### Refaktorointi: yhteinen ydin

Kun soinnut tulivat mukaan, skaalojen nimeämiskoodi jaettiin:

```
spellScale ─┐
            ├─→ spellDegrees   (aste → kirjain → ♯/♭, valitse vähiten etumerkkejä)
spellChord ─┘
```

Refaktoroinnissa rakenne muuttuu, mutta toiminta ei. Siksi testit ajettiin ennen ja jälkeen muutoksen, ja tulosten piti olla täsmälleen samat.

## 3. Tärkeimmät kohdat

### Asteen laskeminen (`degrees.ts`)

```ts
const position = scale.intervals.indexOf(semitones);   // monesko sävel skaalassa
const difference = semitones - MAJOR_STEPS[position];  // poikkeama duurista
return accidental + (position + 1);                    // esim. "♯" + "4"
```

### Kirjainsääntö (`spelling.ts`)

```ts
const letter = (rootSpelling.letter + degree - 1) % 7;   // F:n 4. aste → B
const accidental = accidentalFor(pc, letter);            // B → B♭
score += Math.abs(accidental) + (Math.abs(accidental) > 1 ? 10 : 0);
```

Pohjasävel kokeillaan molemmilla kirjoitustavoilla (C♯/D♭), ja pisteiltään pienempi voittaa. Tasatilanteessa ensimmäinen voittaa, koska vertailu on `<` eikä `<=` (muistatko aivopähkinän F♯/G♭?).

### Aseman algoritmi (`positions.ts`)

```ts
for (let n = 0; n < notesPerString; n++) {
  cells.push({ string, fret: pitch - open });
  pitch += pitchClass(next - current) || 12;   // seuraava skaalan sävel ylöspäin
}
```

### Kvinttiympyrä: sormen kulma (`CircleOfFifths.tsx`)

```ts
let step = angle - drag.current.lastAngle;
if (step > 180) step -= 360;   // yläkohdan ylitys: 359° → 1° on +2°
drag.current.rotation -= step;
```

- `useState` = mikä näkyy ruudulla (kiekon kulma)
- `useRef` = koodin muistilappu, joka ei aiheuta uudelleenpiirtoa (mistä raahaus alkoi)

### Raidallinen sävel (`Fretboard.tsx`)

```tsx
<View style={[styles.note, styles.striped]}>        // overflow: 'hidden' pitää raidat pyöreinä
  <View style={styles.stripes}>                     // raidat rinnakkain
    {fill.map((color, i) => <View key={i} style={{ flex: 1, backgroundColor: color }} />)}
  </View>
  <NoteText ... />                                  // teksti raitojen päällä
</View>
```

`flex: 1` jokaisella raidalla jakaa tilan tasan: 2 sointua = puolikkaat, 3 sointua = kolmannekset.

## 4. Muista aina

- **Testaa logiikka erikseen ennen käyttöliittymää.** Puhdas funktio `music/`-kansiossa on helppo ajaa komentoriviltä. Moni virhe (F♭ ja B♭♭ "All notes" -tilassa) löytyi ennen kuin mitään näkyi ruudulla.
- **Refaktoroinnin jälkeen aja samat testit uudelleen.** Tulosten pitää olla identtiset.
- **Tasatilanteet ratkaisevat käytöksen:** `<` vai `<=`?
- **`.sort()` järjestää luvut tekstinä:** `[10, 2].sort()` → `[10, 2]`. Käytä `.sort((a, b) => a - b)`.
- **Vältä nimiä, jotka ovat jo käytössä.** Oma tyyppi `View` törmäsi React Nativen `View`-komponenttiin.
- **Komentoriviltä: `&` on sedissä erikoismerkki,** joka tarkoittaa "koko osuma". Tämä sotki yhden rivin, ja tyyppitarkistus löysi sen heti.
- **Aja `npx tsc --noEmit` jokaisen muutoksen jälkeen.** Se löysi tässä vaiheessa kolme virhettä ennen kuin ne päätyivät GitHubiin.

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Lisää `progressions.ts`-tiedostoon duurikierto **"Canon I–V–vi–iii–IV"** (Pachelbelin kaanon). Mitkä asteet, numeraalit ja sointusymbolit tarvitaan?

**Tehtävä 2 (keskitaso):** Lisää `chords.ts`-tiedostoon sointu **add9** (esim. Cadd9 = C E G D). Mikä on D:n intervalli C:stä, ja minkä asteen annat sille? Vihje: add9 on oktaavin yläpuolella, mutta sovellus laskee kaiken yhden oktaavin sisällä.

**Tehtävä 3 (pohdinta):** Miksi kierron värit on sidottu **asteeseen** (I aina punainen) eikä **säveleen** (A aina punainen)? Mitä harjoittelija menettäisi, jos värit olisivat sävelen mukaan?

<details>
<summary>Vastaukset</summary>

1. `{ name: 'Canon I–V–vi–iii–IV', steps: [step(1, 'I', ''), step(5, 'V', ''), step(6, 'vi', 'm'), step(3, 'iii', 'm'), step(4, 'IV', '')] }`
2. D on 2 puolisävelaskelta C:n yläpuolella (oktaavin sisällä), joten intervalli on `2` ja aste `'9'`: `{ symbol: 'add9', name: 'Add 9', tones: tones([0, '1'], [4, '3'], [7, '5'], [2, '9']) }`. Kirjainsääntö antaa oikean kirjaimen, koska 9 − 1 = 8 ja 8 % 7 = 1, eli toinen kirjain C:stä on D.
3. Asteen mukaan värit opettavat **funktion**: miltä "koti" (I) ja "jännite" (V) näyttävät kaulalla. Taito siirtyy sävellajista toiseen, koska V on aina sininen. Sävelen mukaan värit opettaisivat vain nimiä, ja jokaisessa sävellajissa kuvio näyttäisi erilaiselta.

</details>
