# Luku 3: Navigointi ja yhteinen tila

Sovellus muuttui yhdestä ruudusta monen ruudun sovellukseksi, jossa on alapalkki, Learn-valikko ja erillinen soittimen valinta.

## 1. Mitä koodi tekee

```
src/
  app/                        ← JOKAINEN tiedosto täällä on ruutu
    _layout.tsx               ← koko sovelluksen runko (teema, yhteinen tila)
    index.tsx                 ← aloitus: ohjaa suoraan Learn-välilehdelle
    instrument.tsx            ← soittimen ja vireen valinta (modaali)
    (tabs)/
      _layout.tsx             ← alapalkki ja sen 4 välilehteä
      learn/_layout.tsx       ← Learn-välilehden otsikkopalkki ja soitinnappi
      learn/index.tsx         ← Learn-valikko
      learn/scales.tsx        ← skaalat otelaudalla
      tools.tsx, ear.tsx, settings.tsx   ← paikkamerkit
  state/InstrumentContext.tsx ← valittu soitin, jonka kaikki ruudut näkevät
  theme/colors.ts             ← sovelluksen värit yhdessä paikassa
  components/InstrumentButton.tsx  ← "Guitar · Standard ▾" -nappi
  components/ComingSoon.tsx   ← "Coming soon" -paikkamerkki
```

`App.tsx` ja `index.ts` poistettiin. Sovellus käynnistyy nyt Expo Routerin kautta (`package.json`: `"main": "expo-router/entry"`).

## 2. Miksi näin

### Expo Router: tiedostot ovat ruutuja

Kansiorakenne on samalla sovelluksen kartta:
- `learn/scales.tsx` → osoite `/learn/scales`
- `_layout.tsx` määrittää kansion ruutujen kehyksen (alapalkki, otsikkopalkki).
- Sulkeissa oleva `(tabs)` on ryhmä, joka ei näy osoitteessa.

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

### Modaali soittimen valinnalle

Soittimen valinta on väliaskel. Käydään valitsemassa ja palataan takaisin. Modaali (`presentation: 'modal'`) liukuu muiden ruutujen päälle, ja se sopii juuri tähän.

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

router.push('/instrument');   // avaa ruudun
router.back();                // palaa edelliseen
```

### Alapalkin määrittely (`(tabs)/_layout.tsx`)

```tsx
<Tabs>
  <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: tabIcon('book') }} />
  <Tabs.Screen name="tools" options={{ title: 'Tools', tabBarIcon: tabIcon('timer') }} />
  ...
</Tabs>
```

`name` vastaa tiedoston tai kansion nimeä. Ikonit tulevat `@expo/vector-icons`-kirjastosta (Ionicons).

## 4. Muista aina

- **Ruututiedostot kuuluvat `src/app/`-kansioon, ja kaikki muu sen ulkopuolelle.** Jokainen `src/app`:n tiedosto muuttuu ruuduksi, joten apukomponentti väärässä paikassa ilmestyy navigointiin.
- **Pidä tila niin paikallisena kuin mahdollista.** Contextiin vain se, mitä useampi ruutu todella tarvitsee.
- **Kun tila riippuu toisesta tilasta, päivitä molemmat yhdessä,** kuten soitin ja viritys.
- **Kirjastot asennetaan `npx expo install` -komennolla,** koska se valitsee Expo-versioon sopivat versiot. Tässä vaiheessa se ei toiminut rajatussa verkossa, joten versiot tarkistettiin tiedostosta `node_modules/expo/bundledNativeModules.json`.
- **Aja `npx expo-doctor`,** kun olet koneella. Se tarkistaa, että kirjastoversiot sopivat yhteen.

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Vaihda Tools-välilehden ikoni. Ionicons-ikoneita ovat esim. `musical-notes`, `speedometer` ja `construct`. Missä tiedostossa muutos tehdään?

**Tehtävä 2 (keskitaso):** Learn-valikossa "Theory notes" näyttää tekstin "Coming soon". Tee sille oma ruutu, jossa lukee vaikka "Hello theory". Mitä tiedostoja pitää luoda tai muuttaa?

<details>
<summary>Vastaukset</summary>

1. `src/app/(tabs)/_layout.tsx`: vaihda `tabIcon('timer')` esim. muotoon `tabIcon('construct')`.
2. (a) Luo `src/app/(tabs)/learn/theory.tsx`, joka palauttaa esim. `<Text>Hello theory</Text>`.
   (b) Lisää `learn/_layout.tsx`-tiedostoon `<Stack.Screen name="theory" options={{ title: 'Theory' }} />`.
   (c) Lisää `learn/index.tsx`-tiedoston TOPICS-listassa Theory notes -riville `href: '/learn/theory'`.

</details>
