# Luku 12: Korvaharjoitukset – ja miten toistuva koodi jaetaan

Vaiheessa 12 tehtiin neljä korvaharjoitusta: **intervallit**, **sointutyypit**, **asteet sävellajissa** ja **sointukierrot**. Ne ovat rakenteeltaan lähes samanlaisia: taso tai oma valinta, soitto, vastausnapit, pisteet ja tallennettu edistyminen. Luvun tärkein oppi on siksi **refaktorointi**: kun sama koodi tulee toiseen kertaan, se siirretään yhteiseen paikkaan.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `scripts/generate_backing_sounds.py` (`notes`) | Pianon yksittäiset sävelet C3–C6 |
| `audio/useNotePlayer.ts` | Soittaa sävelet yhtä aikaa, peräkkäin tai ajastettuna jonona (myös basso) |
| `music/intervals.ts`, `chordQuiz.ts`, `degreeQuiz.ts`, `progressionQuiz.ts` | Kunkin harjoituksen tasot ja tehtävän arvonta |
| `music/practiceStats.ts` | Tilastot: oikein, yhteensä, viimeiset 20 vastausta |
| `state/usePracticeProgress.ts` | Taso, tila, oma valinta ja tilastot tallennettuna puhelimeen |
| `components/practice/PracticeParts.tsx` | Yhteiset osat: pisteet, tasovalitsin, napit, vastausruudukko |
| `music/intervalShape.ts`, `components/MiniNeck.tsx` | Välin paikka omalla soittimella |
| `app/intervals.tsx`, `chord-types.tsx`, `scale-degrees.tsx`, `harmony.tsx` | Harjoitusten näkymät |

## 2. Miksi näin

### Tasot helpoimmasta vaikeimpaan

Jokainen harjoitus alkaa helpoimmin erotettavista asioista: intervalleissa kvartista, kvintistä ja oktaavista, soinnuissa duurista ja mollista, asteissa kotisoinnun sävelistä 1–3–5 ja kierroissa pääsoinnuista I, IV ja V. **Seuraavaa tasoa ehdotetaan**, kun viimeisistä 20 vastauksesta vähintään 17 on oikein. Katsotaan viimeisiä vastauksia eikä kaikkia, jotta alun virheet eivät estä etenemistä.

### Refaktorointi toisella kerralla, ei ensimmäisellä

Intervalliharjoitus tehtiin ensin yksin. Kun sointuharjoitus tarvitsi samat osat, ne siirrettiin yhteisiin tiedostoihin. Tälle ajoitukselle on syynsä: ensimmäisellä kerralla ei vielä tiedä, mikä on yhteistä. Kolmannella kerralla kopioita olisi jo liikaa korjattavaksi.

### Sävelkorva oppii suhteista

Asteharjoituksessa sointukulku I–IV–V–I soi ensin, jotta korva kuulee sävellajin. Vasta sen jälkeen soi yksittäinen sävel. Näin harjoitellaan **suhteellista sävelkorvaa**: "tämä on sävellajin 5", mistä sävellajista tahansa. Sillä pääsee soittamaan korvakuulolta.

### Pianistin äänenkuljetus

Sointukierrossa jokainen pianosointu soitetaan siinä käännöksessä, joka on lähimpänä edellistä sointua (C–E–G → C–E–A → C–F–A → B–D–G). Se kuulostaa luonnolliselta, ja basso kertoo samalla soinnun pohjasävelen.

## 3. Tärkeimmät kohdat

### Yhteinen koukku (`usePracticeProgress.ts`)

```ts
const progress = usePracticeProgress({
  storageKey: 'ear-intervals',
  levelCount: INTERVAL_LEVELS.length,
  modeCount: DIRECTIONS.length,
  defaultCustom: [3, 4, 7],
  isValidItem: (n) => INTERVALS.some((i) => i.semitones === n),
});
```

Jokainen harjoitus kertoo vain omat tietonsa: tallennusavaimen, tasojen ja tilojen määrän, oman valinnan oletuksen ja sen, mikä on kelvollinen valinta. Koukku hoitaa loput: lukemisen, tarkistuksen, tallennuksen ja tilastot. Tämä on **funktio, jolle annetaan erot parametreina**.

### Vanhan tallenteen ymmärtäminen

```ts
setModeIndex(index(saved.modeIndex ?? saved.directionIndex, modeCount - 1));
```

Ensimmäinen intervalliversio tallensi suunnan nimellä `directionIndex`. Kun nimi yleistettiin muotoon `modeIndex`, vanha nimi luetaan edelleen. Näin käyttäjän asetukset eivät katoa päivityksessä. `??` valitsee oikeanpuoleisen arvon, jos vasen puuttuu.

### Ajastettu jono (`useNotePlayer.ts`)

```ts
steps.forEach((step, i) => {
  const startStep = () => { /* vaimenna edellinen, soita tämä */ };
  if (step.at === 0) startStep();
  else timers.current.push(setTimeout(startStep, step.at));
});
```

Sointukulku ja sävel ovat yksi lista askelia, joilla on alkamisaika. Ajastimet kerätään talteen, jotta ne voidaan perua, kun painetaan uudestaan tai poistutaan näkymästä.

### Äänenkuljetus (`progressionQuiz.ts`)

```ts
const distance = (v: number[]) =>
  previous ? v.reduce((sum, n, i) => sum + Math.abs(n - previous![i]), 0) : Math.abs(v[0] - 60);
const piano = options.reduce((best, v) => (distance(v) < distance(best) ? v : best));
```

Kaikista soinnun käännöksistä valitaan se, jonka sävelet ovat yhteensä lähimpänä edellisen soinnun säveliä. `reduce` käy vaihtoehdot läpi ja pitää parhaan.

## 4. Muista aina

- **Refaktoroi, kun sama asia tulee toiseen kertaan.** Siirrä yhteinen osa omaan tiedostoonsa ja anna erot parametreina.
- **Testaa refaktoroinnin jälkeen myös vanha osa.** Intervalliharjoitus testattiin uudelleen, kun sen koodi siirrettiin yhteisiin osiin.
- **Älä hukkaa käyttäjän tallenteita.** Kun muutat tallennusmuotoa, lue myös vanha muoto.
- **Mittaa oppimista viimeaikaisista tuloksista**, ei kaikista koskaan annetuista vastauksista.

## 5. Kokeile itse

1. C-mollissa: mikä sävel on aste ♭3? Entä ♭6?
2. Viimeisistä 20 vastauksesta 16 on oikein. Ehdottaako sovellus seuraavaa tasoa? Katso `READY_RIGHT` tiedostosta `practiceStats.ts`.
3. Sointu C–E–G soi, ja seuraava sointu on F-duuri (F–A–C). Mikä F-duurin käännös on lähimpänä, jos se pidetään välillä F3–C5?
4. Lisää tiedostoon `intervals.ts` muistilaulu jollekin intervallille, jolta se puuttuu (esim. `songDown` pienelle septimille). Näkyykö se vastauksen jälkeen?

<details><summary>Vastaukset</summary>

1. ♭3 = **E♭**, ♭6 = **A♭** (C-molli: C D E♭ F G A♭ B♭).
2. **Ei**: rajana on 17 (85 %).
3. **C–F–A** (toinen käännös): C pysyy paikallaan, E nousee F:ksi ja G nousee A:ksi. Yhteensä liikettä on vain 3 puolisävelaskelta.
4. Kyllä. Laskeva muistilaulu näkyy, kun suunta on "Down".

</details>
