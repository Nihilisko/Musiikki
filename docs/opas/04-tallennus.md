# Luku 4: Valintojen tallentaminen

Sovellus muistaa nyt valitun soittimen ja vireen. Toisella avauskerralla se aukeaa suoraan valikkoon.

## 1. Mitä koodi tekee

| Tiedosto | Muutos |
|---|---|
| `src/state/storage.ts` | **Uusi.** Kaksi apufunktiota: `loadJson` lukee ja `saveJson` tallentaa tietoa puhelimeen |
| `src/state/InstrumentContext.tsx` | Lukee tallennetun valinnan käynnistyksessä ja tallentaa sen, kun vire valitaan |
| `src/app/index.tsx` | Päättää aloitusruudun: valikko, jos valinta on tallessa, muuten soittimen valinta |
| `package.json` | Uusi kirjasto `@react-native-async-storage/async-storage` |

## 2. Miksi näin

### AsyncStorage

AsyncStorage on puhelimen pieni avain–arvo-varasto: `"instrument-choice"` → `'{"instrumentId":"bass",...}'`. Tieto säilyy, vaikka sovellus suljetaan tai puhelin käynnistetään uudelleen.

| Vaihtoehto | Milloin järkevä |
|---|---|
| **AsyncStorage (valittu)** | Pienet asetukset. Toimii Expo Gossa |
| `expo-secure-store` | Salasanat ja tunnukset (salattu). Turha asetuksille |
| `expo-sqlite` | Paljon rakenteellista tietoa, esim. tuhansia harjoituskertoja |
| Palvelin (Firebase, Supabase) | Kun tiedon pitää näkyä useilla laitteilla, eli kirjautumisen jälkeen |

### Tallennetaan nimet, ei järjestysnumeroita

```ts
{ instrumentId: 'bass', tuningName: '5-string' }     // ✅ tallennetaan tämä
{ instrumentIndex: 1, tuningIndex: 2 }               // ❌ ei tätä
```

Jos listaan lisätään myöhemmin uusi soitin väliin, numero 1 osoittaisi eri soittimeen, ja käyttäjän valinta vaihtuisi itsestään. Nimellä haettu valinta toimii, vaikka järjestys muuttuu.

### Tallennus vasta, kun vire valitaan

Soittimen valinta on vasta puolikas valinta. Jos sovellus suljettaisiin soittimen ja vireen välissä, tallessa olisi keskeneräinen yhdistelmä. Siksi tallennus tehdään `selectTuning`-funktiossa.

## 3. Tärkeimmät kohdat

### Asynkroninen koodi: `async` ja `await`

```ts
export async function loadJson<T>(key: string): Promise<T | null> {
  try {
    const text = await AsyncStorage.getItem(key);
    return text === null ? null : (JSON.parse(text) as T);
  } catch (error) {
    console.warn(`Could not load "${key}"`, error);
    return null;
  }
}
```

- Puhelimen muistista lukeminen kestää hetken. Jos koodi odottaisi paikallaan, koko sovellus jäätyisi. Siksi lukeminen on **asynkronista**: pyyntö lähtee, ja vastaus tulee myöhemmin.
- `async` merkitsee funktion asynkroniseksi. Se palauttaa **Promisen** eli "lupauksen" tulevasta arvosta.
- `await` odottaa lupauksen täyttymistä, mutta vain tämän funktion sisällä. Muu sovellus jatkaa toimintaansa.
- `try { ... } catch { ... }`: jos jokin epäonnistuu (muisti täynnä, rikkinäinen tieto), sovellus ei kaadu, vaan palauttaa `null` ja käyttää oletuksia.
- `<T>` on **geneerinen tyyppi**: "kerro, minkä muotoista tietoa odotat". `loadJson<SavedChoice>(...)` palauttaa `SavedChoice`-olion.
- `JSON.stringify` muuttaa olion tekstiksi tallennusta varten, ja `JSON.parse` muuttaa tekstin takaisin olioksi.

### `useEffect`: tee jotain, kun komponentti ilmestyy

```tsx
useEffect(() => {
  loadJson<SavedChoice>(STORAGE_KEY).then((saved) => {
    ...
    setLoaded(true);
  });
}, []);
```

- `useEffect` ajaa koodin **piirtämisen jälkeen**. Tänne kuuluu kaikki, mikä ei ole piirtämistä: tallennus, ajastimet, verkkohaut.
- `[]` lopussa tarkoittaa: "aja vain kerran, kun komponentti ilmestyy". Ilman sitä efekti ajettaisiin jokaisen piirron jälkeen.
- `.then(...)` on toinen tapa odottaa lupausta. `useEffect`-funktio itse ei saa olla `async`, joten tässä käytetään `.then`-muotoa.

### "Ladataan"-tila

```tsx
const [loaded, setLoaded] = useState(false);
...
if (!loaded) {
  return null;   // näytetään tyhjää hetken, kun tietoa luetaan
}
return <Redirect href={hasSavedChoice ? '/home' : '/choose-instrument'} />;
```

Ilman `loaded`-tilaa aloitusruutu päättäisi suunnan heti, ennen kuin tallennettu tieto on ehditty lukea. Silloin se ohjaisi aina soittimen valintaan. Tämä on yleinen virhe asynkronisen koodin kanssa: **päätös tehdään ennen kuin tieto on saapunut.**

### Etsiminen listasta: `findIndex`

```ts
const i = INSTRUMENTS.findIndex((item) => item.id === saved.instrumentId);
```

`findIndex` palauttaa ensimmäisen ehdon täyttävän alkion paikan, tai **−1**, jos mitään ei löydy. Siksi koodi tarkistaa `i >= 0` ennen käyttöä. Jos tallennettu soitin on poistettu sovelluksesta, käytetään oletuksia.

### `satisfies`

```ts
saveJson(STORAGE_KEY, { instrumentId: ..., tuningName: ... } satisfies SavedChoice);
```

`satisfies` pyytää TypeScriptiä tarkistamaan, että olio on oikean muotoinen. Jos kirjoitat vahingossa `tuningname` (pieni n), editori huomauttaa heti. Ilman tarkistusta virhe huomattaisiin vasta, kun tallennettu valinta ei latautuisi.

## 4. Muista aina

- **Tallenna tunnisteet (id, nimi), älä järjestysnumeroita.** Listat muuttuvat.
- **Asynkroninen tieto tarvitsee "ladataan"-tilan.** Älä tee päätöksiä ennen kuin tieto on saapunut.
- **Tallennus voi epäonnistua.** Kääri se `try/catch`-rakenteeseen, jotta sovellus ei kaadu.
- **Sivuvaikutukset (tallennus, ajastimet, haut) kuuluvat `useEffect`-koukkuun,** ei suoraan komponentin runkoon.
- **Tarkista `findIndex`-tulos:** −1 tarkoittaa "ei löytynyt".

## 5. Kokeile itse

**Tehtävä 1 (helppo):** Mitä tapahtuu, jos tallennettu viritys on `"Drop C"`, mutta sellaista ei ole kitaran vireissä? Käy läpi `useEffect`-koodi ja päättele, mille ruudulle sovellus aukeaa.

**Tehtävä 2 (keskitaso):** Skaalasivun sävellaji ja skaala unohtuvat, kun sivulta poistutaan. Mitä pitäisi tehdä, jotta ne muistettaisiin? Kirjoita suunnitelma: mitä tallennetaan, millä avaimella ja milloin.

<details>
<summary>Vastaukset</summary>

1. `findIndex` palauttaa −1, joten `t >= 0` ei toteudu eikä `hasSavedChoice` muutu todeksi. `loaded` asetetaan silti todeksi, joten sovellus aukeaa **soittimen valintaan** kuin ensimmäisellä kerralla.
2. Esim. avaimella `'scale-choice'` tallennetaan `{ root: 9, scaleName: 'Minor pentatonic' }` aina, kun sävellaji tai skaala vaihtuu. Skaalasivu lukee sen `useEffect`-koukussa ja tarvitsee oman `loaded`-tilan. Skaalan nimi tallennetaan järjestysnumeron sijaan samasta syystä kuin soittimen id.

</details>
