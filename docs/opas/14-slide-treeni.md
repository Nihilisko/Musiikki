# Luku 14: Slide-intonaatiotreeni – viritin harjoitusvälineenä

Vaiheessa 14b tehtiin treeni slide-soittoon. Sovellus näyttää kohdesävelen kaulalla, ja soittaja pitää sen slidella vireessä sekunnin. Treeni käyttää uudelleen virittimen kuuntelun, mittarin ja kilahduksen.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `music/slideTrainer.ts` | Skaalat, toleranssit, kohteet kaulalla, pitoajan seuranta |
| `audio/useTuner.ts` | Sama kuuntelu kuin virittimessä, nyt yhdellä kohdesävelellä |
| `components/TunerGauge.tsx` | Uusi valinnainen `inTuneCents`, eli kuinka lähellä on "vireessä" |
| `app/slide.tsx` | Treenin näkymä; avataan virittimen alalaidasta |

## 2. Miksi näin

### Viritin, jolla on yksi kieli

Viritin etsii soitetulle sävelelle lähimmän kielen. Kun sille annetaan kohteeksi vain yksi sävel, se kertoo, kuinka paljon soitettu sävel on juuri siitä ohi, ja kuuntelee vain aluetta ±5 puolisävelaskelta kohteen ympärillä. Yksi koodi palvelee siis kahta käyttötarkoitusta.

### Löysempi toleranssi ja sekunnin pito

Slidessa nauhat eivät auta, joten "vireessä" on oletuksena ±15 senttiä, kun virittimessä se on ±3. Tiukemmat tasot (±8, ±4) ovat harjoittelua varten. Sävel pitää pitää vireessä sekunnin, jotta ohimenevä osuma ei riitä. Slide-soitossa vaikeinta on nimenomaan pysyä vireessä.

### Suunta sanoin

Mittarin neula näyttää suunnan, mutta teksti kertoo sen sanoin: "Too low: move the slide towards the body". Aloittelijan ei silloin tarvitse miettiä, kumpaan suuntaan pitää liikkua.

### Kilahdus, jota mikrofoni ei kuule

Onnistumisesta soi sama kilahdus kuin virittimessä, jotta sen kuulee katsomatta ruutua. Kilahduksen ajaksi mikrofoni jättää äänen huomiotta (`pause`). Muuten treeni kuulisi oman kilahduksensa.

## 3. Tärkeimmät kohdat

### Pitoaika puhtaana funktiona (`slideTrainer.ts`)

```ts
export function updateHold(since: number | null, inTune: boolean, now: number) {
  if (!inTune) return { since: null, held: false };
  const start = since ?? now;
  return { since: start, held: now - start >= HOLD_MS };
}
```

- Jos sävel ei ole vireessä, laskuri nollautuu (`since: null`).
- Jos se on vireessä ensimmäistä kertaa, alkuhetki on nyt (`since ?? now`).
- Kun alusta on kulunut vähintään 1000 ms, pito on valmis.

Funktio ei tiedä mitään mikrofonista eikä ruudusta, joten sen voi testata antamalla eri aikoja.

### Mittarin toleranssi (`TunerGauge.tsx`)

```ts
export function lightColor(cents: number | null, inTune = IN_TUNE_CENTS): string {
```

Parametrilla on **oletusarvo**: jos toleranssia ei anneta (kuten virittimessä), käytetään vanhaa ±3:a. Virittimen koodiin ei siksi tarvinnut koskea.

### Kuunneltava kohde

```ts
const tunerTargets = useMemo(
  () => (target ? [{ stringIndex: target.string, octave: false, midi: target.midi }] : []),
  [target],
);
```

`useMemo` tekee listan uudelleen vain, kun kohde vaihtuu. Kuuntelu ei siksi käynnisty turhaan uudelleen jokaisella piirrolla.

## 4. Muista aina

- **Käytä olemassa olevaa uudelleen** ja anna erot parametreina tai oletusarvoina.
- **Anna palaute monella tavalla:** mittari silmälle, teksti ymmärrykselle ja ääni korvalle.
- **Estä sovellusta kuulemasta omia ääniään**, kun se samalla kuuntelee mikrofonia.
- **Testaa mitä voit ilman laitetta.** Sävelentunnistus testattiin keinotekoisella äänellä, mutta lopullinen testi vaatii puhelimen ja oikean slide-soiton.

## 5. Kokeile itse

1. Kuinka monta hertsiä on +15 senttiä, kun kohde on A4 (440 Hz)? Vihje: taajuus kerrotaan luvulla 2^(sentit/1200).
2. Open G -vireessä (D G D G B D) G-duuripentatoninen: millä nauhalla on G toisella kielellä alhaalta (G-kieli)? Entä ensimmäisellä kielellä (D)?
3. Mitä `updateHold(500, true, 1400)` palauttaa? Entä `updateHold(500, false, 1400)`?
4. Vaihda treenissä toleranssi Hardiin. Miten mittarin vihreän valon alue muuttuu?

<details><summary>Vastaukset</summary>

1. 440 × 2^(15/1200) ≈ **443,8 Hz**, eli vain noin 3,8 Hz enemmän. Siksi mittari näyttää sentit eikä hertsejä.
2. G-kielellä G on avoimena ja nauhassa **12** (slide-treeni käyttää nauhoja 1–12, joten nauha 12). D-kielellä G on nauhassa **5**.
3. `{ since: 500, held: false }`, koska kulunut aika on 900 ms (alle 1000). Vireen ulkopuolella tulos on `{ since: null, held: false }`, eli laskuri nollautuu.
4. Valo muuttuu vihreäksi vasta ±4 sentin sisällä, ja keltainen alue ulottuu 15 senttiin.

</details>
