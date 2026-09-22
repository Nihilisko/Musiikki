# Luku 2: Skaalat ja moodit

Tässä vaiheessa otelauta oppi näyttämään minkä tahansa skaalan missä tahansa sävellajissa.

## 1. Mitä koodi tekee

| Tiedosto | Muutos |
|---|---|
| `src/music/scales.ts` | **Uusi.** 13 skaalaa intervallilistoina ja funktiot sävelluokkien laskemiseen |
| `src/components/Fretboard.tsx` | Sai valinnaisen `highlight`-propsin: näyttää vain skaalan sävelet ja merkitsee pohjasävelen |
| Skaalaruutu | Sävellajin (Key) ja skaalan (Scale) valinta |

## 2. Miksi näin

### Skaala on intervallilista

```ts
{ name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
{ name: 'Dorian',         intervals: [0, 2, 3, 5, 7, 9, 10] },
```

Luvut kertovat, montako puolisävelaskelta kukin sävel on pohjasävelen yläpuolella. Sama lista toimii kaikissa 12 sävellajissa: pohjasävel lisätään jokaiseen lukuun.

| Vaihtoehto | Miksi ei |
|---|---|
| Sävelnimet sävellajeittain (C-duuri = C D E F G A B, G-duuri = ...) | 13 skaalaa × 12 sävellajia = 156 listaa käsin |
| Askelkaava ("koko, koko, puoli...") | Musiikillisesti tuttu, mutta intervalleista on helpompi tarkistaa, onko sävel skaalassa |

### Otelauta ei laske skaalaa itse

Otelauta saa valmiin listan näytettävistä sävelistä (`highlight`). Se ei tiedä, mikä on "duuri" tai "blues". Siksi samaa otelautaa voidaan myöhemmin käyttää soinnuille, CAGEDille ja pelille: niille annetaan vain eri lista.

| Vaihtoehto | Miksi ei |
|---|---|
| Erillinen `ScaleFretboard`-komponentti | Kaksi lähes samanlaista otelautaa. Jokainen korjaus pitäisi tehdä kahdesti |
| Otelauta laskee skaalan itse | Otelauta sotkeutuisi teoriaan, eikä sitä voisi käyttää soinnuille |

## 3. Tärkeimmät kohdat

### Sävelluokka (`pitchClass`)

```ts
export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}
```

Sävelluokka on sävel ilman oktaavia: C = 0, C# = 1, ... B = 11. E2 (40) ja E4 (64) ovat molemmat 4.

**Miksi `+ 12) % 12`?** JavaScriptissä negatiivisen luvun jakojäännös on negatiivinen: `-1 % 12` = `-1`. Lisäämällä 12 ja ottamalla jakojäännöksen uudelleen saadaan aina 0–11. Tämä on tavallinen ohjelmointikikka, joka kannattaa muistaa.

### Skaalan sävelet

```ts
export function scalePitchClasses(root: number, scale: Scale): number[] {
  return scale.intervals.map((interval) => pitchClass(root + interval));
}
```

Esimerkki A-mollipentatonisella (A = 9, intervallit `[0, 3, 5, 7, 10]`):

```
9+0=9 (A)   9+3=12→0 (C)   9+5=14→2 (D)   9+7=16→4 (E)   9+10=19→7 (G)
```

### Valinnainen prop ja varhainen paluu

```tsx
function NoteDot({ midi, highlight }: { midi: number; highlight?: Highlight }) {
  const pc = pitchClass(midi);
  if (highlight && !highlight.pitchClasses.includes(pc)) {
    return null;   // ei skaalassa: jätetään tyhjäksi
  }
  const isRoot = highlight?.root === pc;
  ...
}
```

- `highlight?` tarkoittaa, että prop on vapaaehtoinen. Ilman sitä otelauta toimii kuten ennenkin, joten vanha toiminta ei rikkoutunut.
- `return null` tarkoittaa, että komponentti ei piirrä mitään.
- `highlight?.root` on **valinnainen ketjutus**. Jos `highlight` puuttuu, tulos on `undefined` eikä virhe.
- `includes` kertoo, onko arvo listassa.

### "Ei valintaa" listan ensimmäisenä

```ts
const SCALE_OPTIONS = ['All notes', ...SCALES.map((s) => s.name)];
const scale = scaleOption > 0 ? SCALES[scaleOption - 1] : undefined;
```

- `...` levittää listan toisen sisään: `['All notes', 'Major (Ionian)', 'Dorian', ...]`.
- `ehto ? a : b` on lyhyt if-else. Jos valinta on 0, skaalaa ei ole. Muuten haetaan skaala kohdasta `valinta - 1`, koska "All notes" vie yhden paikan.

## 4. Muista aina

- **Uusi ominaisuus kannattaa tehdä vapaaehtoisena propsina,** jolloin vanhat käyttökohteet toimivat muuttamatta.
- **Komponentti, joka vain piirtää, on helpompi käyttää uudelleen** kuin komponentti, joka myös laskee.
- **Negatiivisen luvun jakojäännös** on JavaScriptissä negatiivinen, joten käytä `((x % n) + n) % n`.
- **Tunnettu puute:** sovellus käyttää aina ylennysmerkkejä (#). F-duurissa näkyy A#, vaikka oikea nimi on B♭. Tämä korjataan myöhemmin.

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Lisää skaala **Phrygian dominant** (espanjalainen/flamenco-skaala) listaan `SCALES`. Se on fryyginen moodi, jonka 3. aste on nostettu puolisävelaskeleella.
Fryyginen on `[0, 1, 3, 5, 7, 8, 10]`.

**Tehtävä 2 (keskitaso):** Kirjoita paperille, mitkä sävelet `scalePitchClasses(7, SCALES[0])` palauttaa (G-duuri). Mikä on ainoa ylennetty sävel?

<details>
<summary>Vastaukset</summary>

1. `{ name: 'Phrygian dominant', intervals: [0, 1, 4, 5, 7, 8, 10] }`
2. `[7, 9, 11, 0, 2, 4, 6]` = G A B C D E F#. Ainoa ylennetty sävel on F#.

</details>
