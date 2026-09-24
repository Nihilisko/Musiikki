# Luku 9: Teoriatyökalut – transponointi, sävellajin soinnut ja teoriamuistiinpanot

Vaiheessa 9 sovellukseen tuli **Theory**-osio, jossa on kolme työkalua: **capo- ja transponointilaskin**, **sävellajin soinnut** ja **teoriamuistiinpanot**. Kaikki kolme nojaavat samaan ajatukseen kuin koko sovellus: sävelet ovat numeroita 0–11, ja musiikkiteoria on laskemista niillä.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `app/theory.tsx` | Teoriaosion valikko |
| `music/transpose.ts` | Sointujen luku tekstistä, sävellajin arvaus, transponointi, capo-ehdotukset |
| `app/transpose.tsx` | Laskimen näkymä; viimeisin sointulista tallentuu |
| `music/keyChords.ts` | Sävellajin soinnut asteittain: kolmisoinnut, septimisoinnut ja funktiot |
| `app/key-chords.tsx` | Taulukko; soinnun napautus avaa sen otteet sointukirjassa |
| `content/theoryNotes.ts` | Muistiinpanot lohkoina: otsikko, teksti, lista, taulukko |
| `app/notes.tsx`, `app/note.tsx` | Muistiinpanolista ja yksittäinen muistiinpano |

## 2. Miksi näin

### Soinnut kirjoitetaan tekstinä

Laskimeen kirjoitetaan soinnut niin kuin ne ovat laulukirjassa: `C G Am F` tai `H7 Em`. Vaihtoehto olisi ollut nappirivit jokaiselle soinnulle, mutta kappaleessa voi olla kymmeniä sointuja, ja tekstin voi liittää suoraan netistä. `parseChord` erottaa pohjasävelen (myös suomalainen **H = B**), loppuosan (`m7`, `sus4`…) ja bassosävelen (`/E`).

### Sävellaji arvataan pisteillä

Kappaleen sävellajia ei kerrota, joten se päätellään. Jokaiselle 24 sävellajille (12 duuria ja 12 mollia) lasketaan, **montako kappaleen soinnuista kuuluu sen omiin sointuihin**. Mollin ja sen rinnakkaisduurin soinnut ovat samat (Am-molli ja C-duuri), joten tasapelin ratkaisee **ensimmäinen ja viimeinen sointu**: kappaleet alkavat ja loppuvat yleensä kotisointuun.

### Capo: mitkä otteet tulevat helpoiksi?

Capo nauhalla *n* nostaa kaikkea *n* puolisävelaskelta. Otteen soittaa siis *n* askelta alempaa kuin se soi. Laskin kokeilee capoa nauhoilla 0–7 ja laskee, moniko soinnuista muuttuu tutuksi avoimeksi otteeksi (C, A, G, E, D, Am, Em, Dm). Eniten helppoja voittaa.

### Sävellajin soinnut lasketaan asteikosta

Sointujen taulukkoa ei kirjoitettu käsin, vaan **joka toinen asteikon sävel pinotaan**: 1–3–5 (ja 7). Välit kertovat soinnun lajin: 4+3 puolisävelaskelta = duuri, 3+4 = molli, 3+3 = vähennetty. Siksi sama koodi toimii duurille, luonnolliselle mollille ja harmoniselle mollille.

### Muistiinpanot ovat dataa, eivät tekstimöhkäle

Ensimmäinen versio oli pitkä tekstikappale, ja se oli raskasta luettavaa. Nyt jokainen muistiinpano on lista **lohkoja**: `heading`, `text`, `list` ja `table`. Näkymä piirtää jokaisen lohkon omalla tavallaan, ja `**lihavointi**` muutetaan lihavoinniksi. Sisältöä voi lisätä koskematta ulkoasukoodiin.

## 3. Tärkeimmät kohdat

### Sävellajin arvaus (`transpose.ts`)

```ts
for (let tonic = 0; tonic < 12; tonic++) {
  for (const minor of [false, true]) {
    const major = minor ? pitchClass(tonic + 3) : tonic; // rinnakkaisduurin soinnut
    let score = 0;
    for (const c of chords) {
      const step = MAJOR_STEPS.indexOf(pitchClass(c.root - major));
      if (step >= 0 && MAJOR_QUALITIES[step] === qualityOf(c.suffix)) score += 1;
    }
    if (first.root === tonic && isMinor(first.suffix) === minor) score += 0.7;
    if (last.root === tonic && isMinor(last.suffix) === minor) score += 0.5;
```

- **Kaksi sisäkkäistä silmukkaa** käyvät läpi kaikki 24 sävellajia.
- Molli tarkistetaan **rinnakkaisduurin** avulla: A-mollin soinnut ovat C-duurin soinnut (A + 3 = C).
- `pitchClass(c.root - major)` kertoo, monesko puolisävelaskel sointu on sävellajin pohjasävelestä. Jos se osuu asteikkoon *ja* soinnun laji täsmää (esim. 2. aste on molli), tulee piste.
- Ensimmäinen sointu painaa hieman enemmän kuin viimeinen. Nämä **painot** (0,7 ja 0,5) valittiin kokeilemalla oikeilla kappaleilla.

### Transponointi on yhteenlaskua

```ts
const root = names[pitchClass(chord.root + semitones)];
```

Nosto kahdella = `+ 2`, ja `pitchClass` pitää tuloksen välillä 0–11. `names` tulee sävellajista, joten F-duurissa kirjoitetaan **B♭** eikä A♯.

### Soinnun laji väleistä (`keyChords.ts`)

```ts
const above = (n: number) => pitchClass(steps[(degree + n) % 7] - step);
const third = above(2);
const fifth = above(4);
const triad = TRIADS[`${third},${fifth}`]; // '4,7' = duuri, '3,7' = molli, '3,6' = vähennetty
```

`(degree + n) % 7` kiertää asteikon ympäri: 7. asteelta kaksi ylöspäin on 2. aste. Välit muutetaan tekstiksi (`'3,7'`), ja taulukosta haetaan, mikä sointu se on.

### Lohkot ja niiden piirtäminen (`note.tsx`)

```ts
switch (block.type) {
  case 'heading': return <Text style={styles.heading}>{block.text}</Text>;
  case 'list':    return block.items.map(...);
  case 'table':   return <Table rows={block.rows} />;
  default:        return <RichText text={block.text} />;
}
```

Jokaisella lohkolla on `type`, ja `switch` valitsee sen mukaan, miten lohko piirretään. TypeScript tietää jokaisessa haarassa, mitä kenttiä lohkolla on (esim. `items` vain listalla). Tätä kutsutaan **erotelluksi unioniksi**.

## 4. Muista aina

- **Käyttäjän teksti on epäluotettavaa.** Jäsennä se varovasti ja ohita se, mitä et ymmärrä, sen sijaan että sovellus kaatuu.
- **Kun vastausta ei tiedetä, pisteytä vaihtoehdot.** Sama idea kuin sointuotteissa luvussa 8.
- **Laske, älä kirjoita taulukoita käsin.** Kun sääntö (pinoa joka toinen sävel) on koodissa, se toimii jokaiselle asteikolle.
- **Erota sisältö ulkoasusta.** Muistiinpanot ovat dataa, ja näkymä päättää, miltä ne näyttävät.

## 5. Kokeile itse

1. Kirjoita laskimeen `Am F C G`. Minkä sävellajin sovellus arvaa, ja miksi ei C-duuria, vaikka soinnut ovat samat?
2. Kappale on `B♭ F Gm E♭`. Mikä capo-paikka tekee otteista helpoimmat, ja mitkä otteet silloin soitetaan?
3. Laske itse C-duurin 7. asteen sointu: pinoa B–D–F. Montako puolisävelaskelta on B→D ja D→F? Mikä sointu se on?
4. Avaa `src/content/theoryNotes.ts` ja lisää yhteen muistiinpanoon uusi `list`-lohko, jossa on kaksi kohtaa. Näkyykö se sovelluksessa oikein?

<details><summary>Vastaukset</summary>

1. **A-molli.** Kummallakin sävellajilla on neljä osumaa, mutta ensimmäinen sointu Am antaa A-mollille lisäpisteet (0,7).
2. **Capo 3:** otteet ovat G D Em C (jokainen 3 puolisävelaskelta alempana). Kaikki neljä ovat tuttuja avoimia otteita.
3. B→D = 3 ja D→F = 3 puolisävelaskelta. 3+3 on **vähennetty sointu**, B°.
4. Lohko näkyy luettelona ilman, että ulkoasukoodiin tarvitsee koskea.

</details>
