# Luku 7: Ääni – metronomi ja viritin

Tähän asti sovellus on vain näyttänyt asioita. Tässä vaiheessa se alkoi **soittaa** (metronomi) ja **kuunnella** (viritin). Molemmat käyttävät `expo-audio`-kirjastoa, joka on Expo Gossa valmiina.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `music/metronome.ts` | Tahtilajit korostuksineen, alajaot, tap tempo ja tempon nosto – pelkkää laskentaa, ei ääntä |
| `audio/useMetronome.ts` | Soittaa naksahdukset oikeaan aikaan |
| `app/metronome.tsx` | Metronomin näkymä: iskuvalot, BPM, säätimet |
| `audio/pitch.ts` | Sävelkorkeuden tunnistus (YIN-menetelmä) |
| `music/tuner.ts` | Taajuus → lähin kieli ja poikkeama sentteinä |
| `audio/useTuner.ts` | Mikrofoni, käyttölupa ja lukemien tasoitus |
| `audio/useChime.ts` | Kilahdus, kun kieli on vireessä |
| `components/TunerGauge.tsx` | Vintage-mittari: neula, asteikko ja matkamittarin ikkuna |
| `app/tuner.tsx` | Virittimen näkymä: Auto/manuaalinen kieli, ohjeteksti, A4-säädin |
| `assets/sounds/*.wav` | Itse tehdyt äänet (naksahdukset ja kilahdus) |

Jako on sama kuin aiemmin: **`music/` laskee, `audio/` hoitaa äänen, `app/` ja `components/` näyttävät.** Siksi tunnistusta ja metronomin sääntöjä voi testata ilman puhelinta.

## 2. Miksi näin

### Omat äänet koodilla

Naksahdukset ja kilahdus tehtiin Python-skriptillä: siniaalto, nopea alku ja hiipuva loppu. Vaihtoehtoja olisi ollut valmiit äänipankit, mutta niissä on lisenssiehtoja, ja omat äänet voi säätää täsmälleen (korkeus, pituus, voimakkuus).

### Ajoitus, joka ei ryömi

JavaScriptin ajastin (`setTimeout`) myöhästyy aina vähän. Jos seuraava isku laskettaisiin siitä, milloin ajastin *oikeasti* laukesi, pienet viiveet kasautuisivat ja tempo hidastuisi. Siksi jokaisella iskulla on **tavoiteaika**, ja seuraava lasketaan edellisestä tavoiteajasta.

Vaihtoehtoja:
- **Ääniohjelmointirajapinta** (esim. Web Audio / `react-native-audio-api`): tarkin, koska äänet ajastetaan äänikortin kellolla. Vaatii lisäkirjaston.
- **Tavoiteaika + `setTimeout`** (valittu): riittävän tarkka (mittauksissa ±1 ms selaimessa) ilman lisäkirjastoja.

### YIN: miten sävel tunnistetaan

Kielen ääni toistaa samaa aaltomuotoa. YIN vertaa ääntä **itseensä viivästettynä** ja etsii pienimmän viiveen, jolla ne osuvat päällekkäin. Se viive on yksi värähdysjakso, ja taajuus = näytetaajuus ÷ viive.

Yksinkertaisempi tapa olisi etsiä äänen voimakkain taajuus (FFT). Se kuitenkin erehtyy usein kitaran matalilla kielillä, joissa **oktaavi on voimakkaampi kuin itse perussävel** – YIN ei erehdy, koska se etsii toistuvaa muotoa, ei voimakkainta taajuutta.

### Kuunnellaan vain tarpeellinen alue

Viritin tietää valitun vireen, joten se etsii vain taajuuksia alimman kielen alapuolelta ylimmän yläpuolelle (±5 puolisävelaskelta). Se tekee tunnistuksesta noin 1 ms:n työn ja estää kuulemasta sivuääniä.

### Auto ja manuaalinen

Auto valitsee **lähimmän** kielen. Jos kieli on yli puoli sävelaskelta vireestä (uusi kieli), lähin on väärä kieli. Manuaalitilassa verrataan aina valittuun kieleen, joten ohje ("Far too low") on oikea, vaikka kieli olisi kaukana.

## 3. Tärkeimmät kohdat

### Tavoiteaika (`useMetronome.ts`)

```ts
nextTime += beatInterval(tempo) / clicksPerBeat;
timer = setTimeout(tick, Math.max(0, nextTime - Date.now()));
```

`nextTime` kasvaa aina täsmälleen yhden välin verran. Jos ajastin myöhästyi 5 ms, seuraava odotus on 5 ms lyhyempi, ja tempo pysyy oikeana.

### Viimeisimmät asetukset ref:ssä

```ts
const settings = useRef({ bpm, accents, subdivision, ramp, onTempoChange });
settings.current = { bpm, accents, subdivision, ramp, onTempoChange };
```

Ajastin lukee asetukset `settings.current`-kentästä joka iskulla. Näin tempon muutos tulee voimaan heti **ilman, että metronomi käynnistyy uudelleen**. `useRef` on "laatikko", jonka sisältöä voi vaihtaa ilman, että ruutu piirretään uudelleen.

### Sentit (`tuner.ts`)

```ts
export function frequencyOf(midi: number, a4 = DEFAULT_A4): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}
export function centsOff(frequency: number, target: number): number {
  return 1200 * Math.log2(frequency / target);
}
```

- Jokainen puolisävelaskel kertoo taajuuden luvulla 2^(1/12) ≈ 1,0595. Oktaavi (12 askelta) tuplaa taajuuden.
- Sentti on sadasosa puolisävelaskelta. `log2` kertoo, montako oktaavia taajuudet ovat erillään; ×1200 muuttaa sen senteiksi.

### Tasoitus mediaanilla (`useTuner.ts`)

Viisi viimeistä tunnistusta lajitellaan, ja keskimmäinen valitaan. Yksi virheellinen lukema (esim. näppäyksen alun rämähdys) ei heilauta neulaa, toisin kuin keskiarvossa.

### Kilahdus ei saa kuulua mikrofoniin

Puhdas ääni toistaa muotoaan myös kahden, kolmen, viiden jakson välein, joten YIN löysi kilahduksesta "sävelen" (439 Hz) suurella varmuudella. Ratkaisu: kilahduksen ajaksi viritin lopettaa kuuntelun (`pause`) ja tyhjentää äänipuskurin.

### Ajastin, joka ei nollaudu joka lukemalla

Ensimmäisessä versiossa kilahduksen ajastin riippui `reading`-muuttujasta, joka on uusi olio ~20 kertaa sekunnissa. Ajastin nollautui jatkuvasti eikä kilahdus olisi koskaan soinut. Korjaus: efekti riippuu vain asioista, jotka muuttuvat harvoin (`inTune`, `readingKey`), ja funktiot luetaan ref:stä.

## 4. Muista aina

- **Laske ajastukset tavoiteajasta**, älä siitä milloin ajastin laukesi. Muuten virheet kasautuvat.
- **Erota laskenta äänestä ja näytöstä.** Puhdasta laskentaa voi testata tuhansilla tapauksilla koneella.
- **Testaa koneella keinotekoisilla signaaleilla** ennen puhelinta: virittimen tunnistus ajettiin 710 tapauksella.
- **Efektin riippuvuudet ratkaisevat, milloin se ajetaan uudelleen.** Jos riippuvuus muuttuu joka piirrolla, efekti (ja sen ajastin) alkaa aina alusta.
- **Mediaani kestää yksittäisiä virheitä paremmin kuin keskiarvo.**
- **Ääni ei saa olla ainoa eikä väri ainoa tapa kertoa asia.** Viritin näyttää värin, tekstin ja kilahtaa.

## 5. Kokeile itse

1. Laske: A4 = 440 Hz. Mikä on A3:n taajuus? Entä A5:n?
2. Kieli soi 110 Hz, ja tavoite on 110 Hz × 2^(10/1200). Montako senttiä kieli on vireestä ja kumpaan suuntaan pitää virittää?
3. Metronomin tempo on 90 BPM ja alajako trioli. Montako millisekuntia on kahden naksahduksen välillä?
4. Avaa `src/music/metronome.ts` ja lisää tahtilaji `9/8` (kolme kolmen ryhmää). Miltä `accents`-lista näyttää? Kokeile sovelluksessa ja poista lopuksi, jos et halua pitää sitä.
5. Miksi mediaani on parempi kuin keskiarvo, jos lukemat ovat 110,1 · 110,0 · 220,3 · 110,2 · 109,9?

<details><summary>Vastaukset</summary>

1. A3 on oktaavin alempana: 440 ÷ 2 = **220 Hz**. A5 oktaavin ylempänä: 440 × 2 = **880 Hz**.
2. Tavoite on 10 senttiä korkeammalla, joten kieli on **−10 senttiä**, eli liian matala: **kiristä** (tune up).
3. Isku kestää 60 000 ÷ 90 ≈ 666,7 ms. Trioli jakaa sen kolmeen: **≈ 222 ms**.
4. `{ label: '9/8', accents: [S, W, W, M, W, W, M, W, W] }` – vahva ensimmäinen isku ja keskivahvat ryhmien alut (4 ja 7).
5. Lajiteltuna 109,9 · 110,0 · **110,1** · 110,2 · 220,3 → mediaani 110,1 Hz, oikea sävel. Keskiarvo olisi 132,1 Hz, koska yksi oktaavivirhe vetää sitä ylös.

</details>
