# Luku 8: Omat skaalat, sointukirjasto, triadit ja avoimet vireet

Vaiheissa 6 ja 7 sovellus oppi kolme uutta asiaa: käyttäjä voi **tehdä omia skaaloja**, sovellus **laskee sointuotteet** mille tahansa soittimelle ja vireelle, ja se näyttää **triadit ja käännökset** sekä **avoimen virityksen sointukartan**.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `state/CustomScaleContext.tsx` | Omat skaalat: lisää, muokkaa, poista ja tallenna |
| `app/scale-editor.tsx` | Skaalaeditori: 12 astenappia, nimi, esikatselu otelaudalla |
| `music/voicings.ts` | Sointuotteiden haku ja pisteytys |
| `components/ChordDiagram.tsx` | Sointukaavio (o, ×, pisteet, barre, 5fr) |
| `app/chords.tsx` | Sointukirjasto |
| `music/triads.ts` | Triadimuodot kolmella vierekkäisellä kielellä ja käännöksen tunnistus |
| `app/triads.tsx` | Triadinäkymä vaakatasossa |
| `music/openTuning.ts` | Avoimen vireen sointu ja sävellajin soinnut palkkeina |
| `components/SlideMap.tsx`, `app/open-tuning.tsx` | Avoimen virityksen kartta |

## 2. Miksi näin

### Oma skaala on vain lista intervalleja

Sovelluksen skaalat ovat alusta asti olleet muotoa `{ name, intervals }`, esim. duuri `[0, 2, 4, 5, 7, 9, 11]`. Oma skaala on täsmälleen samanlainen, vain `id` lisättynä. Siksi kaikki valmis toimi heti omillekin skaaloille: sävelten nimeäminen, asteet ja asemat (5 säveltä → boksit, 7 → 3NPS). **Hyvä tietorakenne säästää työtä myöhemmin.**

### Otteet lasketaan, ei kirjoiteta käsin

Käsin kirjoitettu sointukirja pitäisi tehdä jokaiselle soittimelle ja vireelle erikseen – sovelluksessa niitä on kymmeniä. Algoritmi toimii kaikille:

1. **Haku:** jokaiselta neljän nauhan alueelta kokeillaan kaikki yhdistelmät (jokainen kieli mykistetty, avoin tai painettu).
2. **Suodatus:** pidetään vain soitettavat otteet (enintään 4 sormea tai barre, ei mykistettyjä kieliä keskellä) jotka sisältävät soinnun sävelet.
3. **Pisteytys:** tutut otteet ensin – matalalla kaulassa, avoimia kieliä, vähän mykistettyjä, pohjasävel bassossa.

Pisteytys hiottiin **testeillä**: 19 tunnettua otetta (C x32010, F 133211, ukulelen Am 2000…), ja painoja säädettiin kunnes kaikki tulivat ensimmäisiksi.

### Käännös päätellään soivasta äänestä

Triadin käännöksen ratkaisee **matalin soiva** sävel, ei alin kieli. Ukulelen korkea G -vireessä ylin kieli on alinta matalampi, joten sääntö "katso alinta kieltä" olisi väärä.

### Avoin vire: palkki soi duurina

Avoimessa vireessä (Open G: D G D G B D) avoimet kielet ovat G-duurisointu. Palkki samassa nauhassa nostaa koko soinnun, joten soinnun paikka = (soinnun pohjasävel − vireen pohjasävel) mod 12. Mollisointuun terssin kielet painetaan nauhaa alempaa.

## 3. Tärkeimmät kohdat

### Rekursiivinen haku (`voicings.ts`)

```ts
const walk = (index: number) => {
  if (index === strings.length) {
    // kaikki kielet valittu: arvioi ote
    return;
  }
  for (const fret of choices[index]) {
    frets[index] = fret;
    walk(index + 1);
  }
};
```

`walk` kutsuu itseään seuraavalle kielelle. Kun viimeinenkin kieli on valittu, koko ote arvioidaan. Tätä kutsutaan **rekursioksi**: ongelma ratkaistaan tekemällä yksi valinta ja ratkaisemalla loput samalla tavalla.

### Pisteytys on painotettu summa

```ts
low * 1.2 + (high - low) * 0.6 + muted * mutePenalty + fingers * 0.35 + (barre ? 0.6 : 0) + … - open * 0.4
```

Jokainen tekijä kertoo jotain vaikeudesta, ja kerroin kertoo, kuinka paljon se painaa. Pienin summa voittaa. Kun jokin ote tuli väärään kohtaan, muutettiin yhtä kerrointa ja ajettiin testit uudelleen.

### Oman skaalan tallennus tarkistetaan (`CustomScaleContext.tsx`)

```ts
export function cleanIntervals(intervals: number[]): number[] {
  const set = new Set(intervals.filter((i) => Number.isInteger(i) && i >= 0 && i < 12));
  set.add(0);
  return [...set].sort((a, b) => a - b);
}
```

`Set` poistaa tuplat, `filter` hylkää virheelliset arvot, pohjasävel (0) lisätään aina ja lista järjestetään. Rikkinäinen tallennus ei voi kaataa sovellusta.

### Poisto kahdella napautuksella

Ensimmäinen napautus vain vaihtaa napin tekstiksi "Tap again to delete". Toimii samoin puhelimessa ja selaimessa, eikä vaadi erillistä vahvistusikkunaa.

## 4. Muista aina

- **Hyvä tietorakenne kantaa pitkälle.** Oma skaala oli heti yhteensopiva kaiken kanssa, koska se on samaa muotoa kuin valmiit.
- **Kun sääntöjä on paljon, laske ja pisteytä.** Käsin kirjoitettu lista ei skaalaudu kymmeniin vireisiin.
- **Hio pisteytystä testeillä**, joiden oikeat vastaukset tiedät etukäteen.
- **Tarkista tallennettu data ladattaessa.** Käyttäjän puhelimessa voi olla vanhaa tai rikkinäistä dataa.
- **Tee peruuttamattomasta toiminnosta hankalampi** kuin tavallisesta (kaksi napautusta poistoon).

## 5. Kokeile itse

1. Tee skaalaeditorilla **japanilainen In-skaala**: 1 ♭2 4 5 ♭6. Montako säveltä siinä on, ja saako se asemat?
2. Open G -vireessä (G-duuri): missä nauhassa on **A-duuri**? Entä **E-molli**, ja mitä muuta pitää tehdä?
3. Sointukirjastossa C-duurin ensimmäinen ote on x32010. Miksi alin kieli on mykistetty?
4. Avaa `src/music/voicings.ts` ja muuta `low * 1.2` muotoon `low * 0.2`. Aja sovellus: mitä tapahtuu otteiden järjestykselle? Palauta lopuksi.
5. C-duurin triadi kielillä 1–3 muodossa 9-8-8 on 1. käännös. Mikä sävel on bassossa?

<details><summary>Vastaukset</summary>

1. Viisi säveltä – saa **Box-asemat**, koska asemat lasketaan sävelten määrästä.
2. A on kaksi puolisävelaskelta G:n yläpuolella → **2. nauha** (ja 14.). E-molli: E on 9 askelta G:n yläpuolella → **9. nauha**, ja B-kieli (vireen terssi) painetaan **8. nauhasta**.
3. Alin kieli on E. Jos se soisi, bassossa olisi E eikä C, jolloin sointu olisi käännös (C/E). Pohjasävel bassossa kuulostaa vakaimmalta.
4. Korkealla kaulassa olevat otteet eivät enää saa rangaistusta, joten ne nousevat listan kärkeen tuttujen avoimien sointujen ohi.
5. **E**, eli terssi. (G B E -kielet: 9 = E, 8 = G, 8 = C.)

</details>
