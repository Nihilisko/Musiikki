# Luku 3: Navigointi ja yhteinen tila

Sovellus muuttui yhdestä ruudusta monen ruudun sovellukseksi. Polku on: **soittimen valinta → vireen valinta → valikko → aiheen ruutu** (esim. skaalat).

> Ensimmäisessä versiossa oli alapalkki (Learn, Tools, Ear training, Settings). Se vaihdettiin valikkoon, koska valikko on selkeämpi ja ruudulla on vähemmän tavaraa. Rakenteen vaihtaminen oli helppoa, koska ruudut, soitintila ja otelauta olivat erillään toisistaan: vain `src/app/`-kansion tiedostot muuttuivat.

## 1. Mitä koodi tekee

```
src/
  app/                        ← JOKAINEN tiedosto täällä on ruutu
    _layout.tsx               ← koko sovelluksen runko: teema, yhteinen tila, ruutujen otsikot
    index.tsx                 ← aloitus: ohjaa soittimen valintaan
    choose-instrument.tsx     ← vaihe 1: soitin
    choose-tuning.tsx         ← vaihe 2: vire
    home.tsx                  ← valikko (isot ruudut: Scales, Chords, Tuner...)
    scales.tsx                ← skaalat otelaudalla
  state/InstrumentContext.tsx ← valittu soitin, jonka kaikki ruudut näkevät
  theme/colors.ts             ← sovelluksen värit yhdessä paikassa
  components/InstrumentButton.tsx  ← "Guitar · Standard ▾" -nappi valikon yläkulmassa
```

`App.tsx` ja `index.ts` poistettiin. Sovellus käynnistyy nyt Expo Routerin kautta (`package.json`: `"main": "expo-router/entry"`).

## 2. Miksi näin

### Expo Router: tiedostot ovat ruutuja

Kansiorakenne on samalla sovelluksen kartta:
- `scales.tsx` → osoite `/scales`
- `_layout.tsx` määrittää kansion ruutujen kehyksen. Tässä se on **Stack** eli pino: uusi ruutu tulee edellisen päälle, ja takaisin-nuoli poistaa päällimmäisen.
- Kansioita voi käyttää ryhmittelyyn. Esim. `learn/scales.tsx` → `/learn/scales`, ja sulkeissa oleva `(tabs)` on ryhmä, joka ei näy osoitteessa.

| Vaihtoehto | Miksi ei |
|---|---|
| React Navigation suoraan | Expo Router on rakennettu sen päälle, mutta vaatii vähemmän koodia. Projektin ohjeet (AGENTS.md) käskevät käyttämään sitä |
| Oma navigointi `useState`-koukulla | Takaisin-nappi, Androidin paluuele ja animaatiot pitäisi tehdä itse |

### Context: yhteinen tila

Soitinta tarvitsevat valintasivu, skaalasivu ja myöhemmin viritin, soinnut ja peli. Jos tieto olisi yhden ruudun `useState`-muuttujassa, muut eivät näkisi sitä.

| Vaihtoehto | Milloin järkevä |
|---|---|
| `useState` yhdessä ruudussa | Kun tietoa käyttää vain yksi ruutu, kuten skaalasivun sävellaji |
| **Context (valittu)** | Kun muutama ruutu jakaa saman tiedon. Ei vaadi lisäkirjastoja |
| Zustand, Redux | Kun yhteistä tietoa on paljon ja se muuttuu usein |

Huomaa, että **sävellaji ja skaala ovat edelleen skaalasivun omaa tilaa** (`useState`). Niitä ei tarvita muualla, joten niitä ei laitettu Contextiin.

### Pino ja historian siivoaminen

Navigointi on pino. Kun valitset soittimen ja vireen, pinossa on `[soitin, vire]`. Jos valikko vain lisättäisiin päälle (`[soitin, vire, valikko]`), valikon takaisin-nuoli palauttaisi vireen valintaan, mikä olisi hämmentävää. Siksi vireen valinnan jälkeen pino tyhjennetään ja tilalle laitetaan valikko.

| Vaihtoehto | Miksi ei |
|---|---|
| Alapalkki (Tabs) | Kokeiltiin ensin. Toimii, mutta vie tilaa, ja valikko oli selkeämpi |
| Modaali soittimen valinnalle | Kokeiltiin ensin. Sopii yksittäiseen valintaan, mutta kahden vaiheen polulle (soitin → vire) pino on luontevampi |

## 3. Tärkeimmät kohdat

### Context kolmessa osassa (`InstrumentContext.tsx`)

```tsx
// 1. Luodaan tyhjä "varasto"
const InstrumentContext = createContext<InstrumentState | null>(null);

// 2. Provider täyttää varaston ja kääräisee sovelluksen
export function InstrumentProvider({ children }: { children: ReactNode }) {
  const [instrumentIndex, setInstrumentIndex] = useState(0);
  ...
  return <InstrumentContext.Provider value={value}>{children}</InstrumentContext.Provider>;
}

// 3. Hook, jolla mikä tahansa ruutu lukee varastoa
export function useInstrument(): InstrumentState {
  const state = useContext(InstrumentContext);
  if (!state) {
    throw new Error('useInstrument must be used inside InstrumentProvider');
  }
  return state;
}
```

- `children` tarkoittaa kaikkea, mitä komponentin sisään laitetaan. Provider kääräisee koko sovelluksen (`_layout.tsx`), joten kaikki ruudut ovat sen sisällä.
- Oma hook (`useInstrument`) piilottaa yksityiskohdat. Ruudussa riittää `const { instrument, tuning } = useInstrument();`.
- `throw new Error(...)` antaa selkeän virheilmoituksen, jos hookia käytetään Providerin ulkopuolella. Ilman sitä tulisi epäselvä "cannot read property of null".

### Tila, joka riippuu toisesta tilasta

```tsx
function selectInstrument(index: number) {
  setInstrumentIndex(index);
  setTuningIndex(0);   // jokaisella soittimella on eri vireet
}
```

Jos vaihdat kitarasta (10 viritystä) ukuleleen (3 viritystä) ja viritys olisi yhä 7, ukulelella ei ole viritystä numero 7, ja sovellus kaatuisi. Siksi viritys nollataan aina, kun soitin vaihtuu.

### Navigointi koodista

```tsx
import { router } from 'expo-router';

router.push('/choose-tuning');   // lisää ruudun pinon päälle
router.back();                   // palaa edelliseen
router.dismissAll();             // palaa pinon ensimmäiseen ruutuun
router.replace('/home');         // vaihtaa nykyisen ruudun toiseen, historiaan ei jää jälkeä
```

Vireen valinnassa käytetään kahta viimeistä peräkkäin (`choose-tuning.tsx`):

```tsx
function choose(index: number) {
  selectTuning(index);
  router.dismissAll();       // [soitin, vire] → [soitin]
  router.replace('/home');   // [soitin] → [valikko]
}
```

Sama toimii myös, kun soitinta vaihdetaan valikosta: `[valikko, soitin, vire]` → `[valikko]` → `[valikko]`.

### Ruutujen otsikot (`_layout.tsx`)

```tsx
<Stack>
  <Stack.Screen name="choose-instrument" options={{ title: 'Choose instrument' }} />
  <Stack.Screen name="home" options={{ title: '', headerLeft: () => <InstrumentButton /> }} />
  ...
</Stack>
```

`name` vastaa tiedoston nimeä. `headerLeft` laittaa oman komponentin otsikkopalkin vasempaan reunaan. Valikossa se korvaa takaisin-nuolen soitinnapilla.

### Valikon ruudut listana (`home.tsx`)

```tsx
const TILES: Tile[] = [
  { title: 'Scales & modes', icon: 'git-network', href: '/scales' },
  { title: 'Chords & triads', icon: 'layers' },          // ei href:iä = "Coming soon"
  ...
];
```

Uusi ominaisuus valikkoon on yksi rivi. Kun ruudulla on `href`, se on painettava. Muuten se näkyy himmeänä tekstillä "Coming soon". Ikonit tulevat `@expo/vector-icons`-kirjastosta (Ionicons).

## 4. Muista aina

- **Ruututiedostot kuuluvat `src/app/`-kansioon, ja kaikki muu sen ulkopuolelle.** Jokainen `src/app`:n tiedosto muuttuu ruuduksi, joten apukomponentti väärässä paikassa ilmestyy navigointiin.
- **Mieti, mitä pinoon jää.** Valintapolun jälkeen historia kannattaa siivota (`dismissAll` + `replace`), ettei takaisin-nuoli vie vanhoihin valintoihin.
- **Pidä tila niin paikallisena kuin mahdollista.** Contextiin vain se, mitä useampi ruutu todella tarvitsee.
- **Kun tila riippuu toisesta tilasta, päivitä molemmat yhdessä,** kuten soitin ja viritys.
- **Kirjastot asennetaan `npx expo install` -komennolla,** koska se valitsee Expo-versioon sopivat versiot. Tässä vaiheessa se ei toiminut rajatussa verkossa, joten versiot tarkistettiin tiedostosta `node_modules/expo/bundledNativeModules.json`.
- **Aja `npx expo-doctor`,** kun olet koneella. Se tarkistaa, että kirjastoversiot sopivat yhteen.

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Vaihda valikon Metronome-ruudun ikoni. Ionicons-ikoneita ovat esim. `musical-notes`, `speedometer` ja `stopwatch`. Missä tiedostossa muutos tehdään?

**Tehtävä 2 (keskitaso):** Valikon Theory-ruutu näyttää tekstin "Coming soon". Tee sille oma ruutu, jossa lukee vaikka "Hello theory". Mitä tiedostoja pitää luoda tai muuttaa?

**Tehtävä 3 (pohdinta):** Mitä tapahtuisi, jos `choose-tuning.tsx` kutsuisi pelkästään `router.push('/home')`? Mitä valikon takaisin-nuoli silloin tekisi?

<details>
<summary>Vastaukset</summary>

1. `src/app/home.tsx`: vaihda TILES-listan Metronome-rivillä `icon: 'timer'` esim. muotoon `icon: 'stopwatch'`.
2. (a) Luo `src/app/theory.tsx`, joka palauttaa esim. `<Text>Hello theory</Text>`.
   (b) Lisää `_layout.tsx`-tiedostoon `<Stack.Screen name="theory" options={{ title: 'Theory' }} />`.
   (c) Lisää `home.tsx`-tiedoston TILES-listassa Theory-riville `href: '/theory'`.
3. Pino olisi `[soitin, vire, valikko]`. Valikossa näkyisi takaisin-nuoli, joka veisi vireen valintaan. Soittimen vaihtamisen jälkeen pinoon kertyisi yhä enemmän vanhoja ruutuja.

</details>
