# Luku 10: Taustasoitto – drone, sointukierrot, basso ja rämpytys

Vaiheessa 11 sovellus oppi soittamaan taustaa, jonka päälle harjoitellaan: **drone** (pysyvä pohjasävel), **sointukierrot rumpujen ja pianon kanssa**, **bassolinjat** ja **rämpytyskuviot**. Tämä oli projektin vaativin ääniosuus, ja siitä opittiin paljon siitä, mikä kuulostaa luonnolliselta ja mikä koneelta.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `scripts/generate_backing_sounds.py` | Tekee kaikki äänet itse: piano-soinnut, basso, rummut |
| `audio/useDrone.ts`, `app/drone.tsx` | Drone: kaksi vuorottelevaa silmukkaa ilman katkoja |
| `music/backing.ts` | Kompit (rummut ja pianon rytmi askelruudukossa), svengi, soinnun äänitiedoston nimi |
| `music/progressions.ts` | Sointukierrot ja niiden tahtimuoto, esim. 12-tahtinen blues |
| `music/bassLines.ts` | Bassolinja tahdille kompin tyylin mukaan |
| `music/bassFingering.ts` | Millä kielellä ja nauhalla kukin bassosävel soitetaan |
| `music/strums.ts` | Rämpytyskuviot ja mitkä sopivat millekin kompille |
| `audio/useBacking.ts` | Soittomoottori: lataa äänet, ajoittaa lyönnit, häivyttää |
| `app/jam.tsx` | Chord progressions -näkymä |
| `components/BassLineBoard.tsx`, `components/StrumPatternView.tsx` | Bassonauha ja rämpytysnuolet |

## 2. Miksi näin

### Äänet tehdään itse

Äänet lasketaan Python-ohjelmalla (numpy) eikä ladata netistä. Näin lisensseistä ei tarvitse huolehtia, ja ääntä voi muuttaa yhdellä numerolla.
- **Piano** koostuu kymmenistä osasävelistä, jotka hiipuvat eri tahtiin. Jokaisella sävelellä on kolme hieman eri tavalla viritettyä kieltä, ja alussa kuuluu vasaran tömähdys.
- **Huonekaiku** tehdään *konvoluutiolla*: kuiva ääni yhdistetään hiipuvaan kohinaan, joka jäljittelee huoneen vastausta.

### Yksi äänitiedosto per sointu

Ensimmäisessä versiossa jokainen pianon sävel oli oma tiedostonsa, ja sointu soitettiin neljällä soittimella yhtä aikaa. Puhelimen selaimessa D7 ja E7 katosivat, koska **selain lataa vain noin 40 ääntä kerrallaan**, ja niitä oli 68.
- Nyt jokainen sointu on valmis tiedosto, ja soinnun sävelet osuvat aina täsmälleen yhteen.
- Sovellus lataa vain ne äänet, joita valittu komppi, kierto ja bassolinja tarvitsevat, eli noin 26–32 ääntä.

### Askelruudukko ja svengi

Tahti on 8 askelta: jokainen isku ja sen "ja". Komppi kertoo, millä askelilla mikin rumpu lyö. **Svengi** on luku, joka kertoo, mihin kohtaan iskua "ja" osuu:
- 0,5 on suora (rock, pop).
- 0,67 on tiukka trioli.
- Shufflessa käytetään 0,62, joka kuulostaa rennommalta.

Koska bassolinjat ja rämpytyskuviot käyttävät samaa ruudukkoa, ne svengaavat automaattisesti.

### Inhimillisyys: pieni satunnaisuus

Kone lyö jokaisen iskun täsmälleen samalla voimalla samaan aikaan, ja se kuulostaa robotilta. Siksi:
- **Voimakkuus** vaihtelee jokaisella lyönnillä muutaman prosentin.
- **Ajoitus:** jokainen lyönti tulee 0–24 ms myöhässä. Piano on eniten iskun takana, kuten rento pianisti.
- **Rullaus:** soinnun sävelet lähtevät muutaman millisekunnin välein alhaalta ylös.
- **Pehmeä vaimennus:** uusi lyönti häivyttää edellisen, niin kuin pianon kieli vaimenee, kun sitä lyödään uudelleen.

### Walking bass johtaa seuraavaan sointuun

Jazzin bassolinjan viimeinen sävel on puolisävelaskeleen päässä seuraavan soinnun pohjasävelestä, joten linja "vetää" sinne. Jos seuraava sointu on alempana, linja laskeutuu septimin ja kvintin kautta eikä hyppää.

## 3. Tärkeimmät kohdat

### Askeleen pituus svengin kanssa (`backing.ts`)

```ts
export function stepLength(step: number, beatMs: number, swing: number): number {
  return (step % 2 === 0 ? swing : 1 - swing) * beatMs;
}
```

Parillinen askel on isku, ja sen pituus on `swing` osaa iskusta. Pariton askel on "ja", ja se saa loput. Kun svengi on 0,62, isku kestää 62 % ja "ja" 38 %: pitkä–lyhyt.

### Ajoitus tavoiteajasta ja inhimillinen viive (`useBacking.ts`)

```ts
const volume = wobble(pianoHit.volume * volumes.pianoVolume, VOLUME_WOBBLE.chord);
later(lateness(LATE_MS.chord), () => play(name, volume, CHORD_RESTRIKE_FADE_MS));
...
nextTime += stepLength(step, beatMs, g.swing);
timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
```

- `nextTime` lasketaan edellisestä **tavoiteajasta**, kuten metronomissa (luku 7). Pienet viiveet eivät siksi kasaannu, vaikka jokaiseen lyöntiin lisätään tahallinen viive.
- `later` odottaa muutaman millisekunnin ennen soittamista. Nämä ajastimet kerätään talteen, jotta ne voidaan perua, kun soitto pysäytetään.

### Häivytys, joka hiljenee luonnollisesti

```ts
player.volume = start * left * left;
```

`left` pienenee 1:stä 0:aan. Kun se korotetaan toiseen, ääni hiljenee ensin nopeasti ja sitten loivasti, kuten oikea soiva ääni. Tasainen `start * left` kuulosti katkaisulta.

### Bassosävelen paikka kaulalla (`bassFingering.ts`)

```ts
for (let hand = 0; hand <= MAX_FRET; hand++) {
  let cost = hand * 0.3;
  for (const midi of notes) {
    // valitse kieli, jolla sävel on lähimpänä käden asemaa
    cost += pick.miss * 2;
  }
  if (!best || cost < best.cost) best = { cost, positions };
}
```

Taas **pisteytys**: jokainen käden asema kokeillaan, ja sävelet, jotka jäävät käden ulottumattomiin, maksavat. Halvin asema voittaa.

### Selaimen äänilupa (`unlockPool`)

Puhelimen selain soittaa äänen vain, jos käyttäjä on käynnistänyt sen napautuksella. Siksi Play-napautuksen aikana jokainen soitin käynnistetään äänettömänä, ja sen jälkeen selain päästää ne soimaan myöhemminkin. Tämä tehdään vain selaimessa (`Platform.OS === 'web'`).

## 4. Muista aina

- **Testaa oikealla laitteella.** Läppärin selain antoi ladata 68 ääntä, mutta puhelimen selain ei. Vika löytyi vasta, kun kysyttiin, millä laitteella testattiin.
- **Kuuntele ja mittaa.** "Hi-hat kuulostaa kovalta" johtui siitä, että kirkkaat äänet kuulostavat korvaan kovemmilta, vaikka mittari näyttää saman.
- **Ihminen ei ole tarkka, eikä taustan tarvitse olla.** Pieni hallittu satunnaisuus tekee soitosta elävää.
- **Älä katkaise ääntä, vaan häivytä.** Äkillinen katkaisu kuuluu naksahduksena tai töksähdyksenä.
- **Sama ruudukko kaikelle** (rummut, piano, basso, rämpytys) pitää kokonaisuuden yhdessä ja helpottaa muutoksia.

## 5. Kokeile itse

1. Tempo on 120 BPM ja svengi 0,62. Kauanko kestävät isku ja "ja" millisekunteina?
2. Avaa `src/music/backing.ts` ja muuta Rock-kompin `kick: hits(0.9, 0, 4, 5)` muotoon `hits(0.9, 0, 2, 4, 6)`. Miltä rock nyt kuulostaa? Palauta lopuksi.
3. Walking bass, sointu G7 (pohjasävel G1) ja seuraava sointu C (C2, ylempänä). Mitkä neljä säveltä linja soittaa?
4. Miksi rämpytyskuvioissa alaspäin-lyönnit ovat aina parillisilla askelilla ja ylöspäin-lyönnit parittomilla?

<details><summary>Vastaukset</summary>

1. Isku kestää 60 000 / 120 = 500 ms. Isku-osa on 500 × 0,62 = **310 ms** ja "ja" 500 × 0,38 = **190 ms**.
2. Potkurumpu lyö jokaisella iskulla ("four on the floor"), ja soitto kuulostaa disko- tai tanssimusiikilta.
3. G1 – B1 – D2 – **C♯2**: pohjasävel, terssi, kvintti ja sitten puolisävel C:n yläpuolelta, josta linja laskeutuu C:hen.
4. Käsi heiluu tasaisesti: alas iskulla ja ylös "ja"-kohdassa, myös silloin kun se ei osu kieliin. Näin rytmi pysyy tasaisena.

</details>
