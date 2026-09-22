# Luku 1: Otelauta ja soittimet

Ensimmäisen vaiheen tuloksena oli ruutu, jolla voi valita soittimen ja vireen ja nähdä kaikki sävelet otelaudalla.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `src/music/notes.ts` | Muuttaa sävelnumerot nimiksi (64 → "E" tai "E4") |
| `src/music/instruments.ts` | Soittimet ja niiden vireet tietona |
| `src/components/Fretboard.tsx` | Piirtää otelaudan |
| `src/components/ChipRow.tsx` | Vaakasuunnassa rullaava rivi valintanappeja |
| `package.json` | Projektin nimi, kirjastot ja komennot |
| `app.json` | Sovelluksen asetukset: nimi, ikoni, suunta |

Kansiorakenne noudattaa periaatetta, jossa **teoria on erillään ulkoasusta**:
- `src/music/` sisältää puhdasta musiikkiteoriaa. Siellä ei ole yhtään ruutua tai väriä.
- `src/components/` sisältää käyttöliittymän palasia, jotka eivät itse tiedä musiikista mitään. Ne piirtävät, mitä niille annetaan.

## 2. Miksi näin

### React Native + Expo

| Vaihtoehto | Plussat | Miinukset |
|---|---|---|
| **React Native + Expo (valittu)** | Sama koodi Androidille ja iPhonelle, testaus Expo Golla ilman asennusta | Raskaat äänitoiminnot vaativat myöhemmin oman testiversion |
| Kotlin (Androidin oma kieli) | Paras suorituskyky | Vain Android, jyrkempi oppimiskäyrä |
| Flutter | Hyvä suorituskyky, kaunis ulkoasu | Dart-kieli, jota ei käytetä juuri muualla |
| Selainsovellus (PWA) | Helpoin jakaa | Ei oikea sovellus, rajoitettu pääsy puhelimen ominaisuuksiin |

### Sävelet numeroina (MIDI)

Jokainen sävel on kokonaisluku: C4 (keski-C) = 60, ja jokainen puolisävelaskel eli nauha on +1.

```
E2 = 40   A2 = 45   D3 = 50   G3 = 55   B3 = 59   E4 = 64
```

Silloin otelaudan sävel on pelkkä yhteenlasku: **kielen sävel + nauhan numero**.

| Vaihtoehto | Miksi ei |
|---|---|
| Tekstinä ("E", "F#") | Mikä on "E" + 3? Vaatisi hakutaulukoita joka paikassa |
| Taajuutena (Hz) | Nauhojen taajuudet eivät kasva tasaisesti, joten laskeminen on hankalaa. Hz lasketaan tarvittaessa MIDI-numerosta |

### Vireet tietona, ei koodina

```ts
{ name: 'Drop D', strings: [38, 45, 50, 55, 59, 64] }
```

Uusi viritys on yksi rivi. Otelautakoodiin ei tarvitse koskea, koska se osaa piirtää minkä tahansa listan.

## 3. Tärkeimmät kohdat

### Sävelnumerosta nimeksi (`notes.ts`)

```ts
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export function noteNameWithOctave(midi: number): string {
  return noteName(midi) + (Math.floor(midi / 12) - 1);
}
```

- `midi % 12` on jakojäännös: 64 % 12 = 4, ja `NOTE_NAMES[4]` = "E".
- Oktaavi saadaan jakamalla: `Math.floor(64 / 12) - 1` = 5 − 1 = 4, eli tuloksena "E4".
- `export` tarkoittaa, että muut tiedostot voivat käyttää funktiota `import`-lauseella.
- `midi: number` ja `: string` ovat TypeScriptin tyyppejä. Jos yrität antaa tekstiä numeron paikalle, editori näyttää virheen heti.

### Tyypit kuvaavat tiedon muodon (`instruments.ts`)

```ts
export type Instrument = {
  id: string;
  name: string;
  frets: number;
  tunings: Tuning[];
  octaveCourses?: number;   // ? = vapaaehtoinen
};
```

Tyyppi on "lomakepohja". Jos unohdat soittimesta `name`-kentän, TypeScript huomauttaa siitä. `Tuning[]` tarkoittaa listaa Tuning-olioita.

### Komponentti ja props (`Fretboard.tsx`)

```tsx
type Props = {
  strings: number[];
  frets: number;
  octaveCourses?: number;
};

export default function Fretboard({ strings, frets, octaveCourses = 0 }: Props) {
```

- Komponentti on funktio, joka palauttaa käyttöliittymää.
- Props ovat sen parametrit. Käytössä se näyttää tältä: `<Fretboard strings={[40, 45, ...]} frets={15} />`
- `octaveCourses = 0` on oletusarvo, jota käytetään, jos propsia ei anneta.

### Listasta näkymäksi: `map`

```tsx
const fretNumbers = Array.from({ length: frets + 1 }, (_, i) => i);   // [0, 1, 2, ..., 15]

{fretNumbers.map((fret) => (
  <View key={fret}>
    <Text>{noteName(midi + fret)}</Text>
  </View>
))}
```

- `map` käy listan läpi ja tekee jokaisesta alkiosta jotain uutta, tässä ruudun otelautaan.
- `key` on pakollinen listoissa. React tunnistaa sen avulla, mikä alkio on mikä, kun lista muuttuu.
- Aaltosulkeet `{ }` JSX:n sisällä tarkoittavat: "tässä on JavaScriptiä".

### Tila: `useState`

```tsx
const [instrumentIndex, setInstrumentIndex] = useState(0);
```

- `instrumentIndex` on nykyinen arvo, ja alussa se on 0.
- `setInstrumentIndex(2)` vaihtaa arvon, jolloin React piirtää ruudun uudelleen.
- **Arvoa ei saa muuttaa suoraan** (`instrumentIndex = 2`). React ei huomaa muutosta, eikä ruutu päivity.

### Tyylit: `StyleSheet`

```tsx
const styles = StyleSheet.create({
  note: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#1e1e1e' },
});

<View style={[styles.note, isRoot && styles.rootNote]} />
```

- Tyylit muistuttavat CSS:ää, mutta nimet kirjoitetaan camelCase-muodossa (`backgroundColor`, ei `background-color`), ja luvut ovat pikseleitä ilman yksikköä.
- Tyylejä voi yhdistää listana. `isRoot && styles.rootNote` lisää tyylin vain, jos `isRoot` on tosi.
- Oletuksena elementit asettuvat **allekkain** (`flexDirection: 'column'`), kun taas selaimessa oletus on rinnakkain. Rinnakkain tarvitaan `flexDirection: 'row'`.

## 4. Muista aina

- **Erota tieto ja ulkoasu.** Teoriafunktioita on helppo testata ja käyttää uudelleen, kun ne eivät tiedä mitään ruuduista.
- **Tila muutetaan vain set-funktiolla.** Muuten ruutu ei päivity.
- **Jokainen `map`-listan alkio tarvitsee `key`-arvon,** joka on uniikki ja pysyy samana.
- **Aja `npx tsc --noEmit` ennen kuin toteat jotain valmiiksi.** Se löytää kirjoitusvirheet ja väärät tyypit sekunneissa.
- **Vaakasuunnassa rullaava `ScrollView` venyy pystysuunnassa,** jos sille ei anna `flexGrow: 0`. Tämä bugi löytyi ja korjattiin tässä vaiheessa kuvakaappauksen avulla.

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Lisää kitaralle uusi viritys **Open A** (`E A E A C# E`) tiedostoon `src/music/instruments.ts`.
Vinkki: laske MIDI-numerot taulukosta yllä. E2 = 40, ja jokainen puolisävelaskel ylöspäin on +1.

**Tehtävä 2 (keskitaso):** Otelaudassa on 15 nauhaa. Muuta basso 20-nauhaiseksi. Missä tiedostossa se tehdään, ja näkyvätkö nauhamerkit oikein myös 17. ja 19. nauhalla?

<details>
<summary>Vastaukset</summary>

1. `{ name: 'Open A', strings: [40, 45, 52, 57, 61, 64] }`
2. `instruments.ts`, bassin kohdalla `frets: 20`. Nauhamerkit toimivat, koska `SINGLE_DOTS` sisältää jo luvut 17, 19 ja 21.

</details>
