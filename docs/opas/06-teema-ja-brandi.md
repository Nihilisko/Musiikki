# Luku 6: Teema, vaakanäkymät ja brändi

Vaihe 5 alkoi asetuksista, mutta laajeni: sovellukseen tuli tumma ja vaalea teema, otelautasivut kääntyvät vaakaan samalla asettelulla, ja sovellus sai nimen, logon ja kuvakkeen. Lopuksi värit vaihdettiin lämpimiksi, jotta sovellus ja logo näyttävät samalta perheeltä.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `theme/colors.ts` | Värit **roolin** mukaan (tausta, pinta, teksti, valinta, brändi) tummalle ja vaalealle teemalle |
| `theme/ThemeContext.tsx` | Muistaa valitun teeman, seuraa puhelimen asetusta ja jakaa värit kaikille ruuduille |
| `app/settings.tsx` | Asetussivu: Puhelimen mukaan / Tumma / Vaalea |
| `state/orientation.ts` | `useLandscape()`: ruutu kääntyy vaakaan auki ollessaan ja takaisin pystyyn suljettaessa |
| `components/FretboardStage.tsx` | Yhteinen vaaka-asettelu: paluunappi vasemmalla, valikot keskellä, koko kaula sovitettuna leveyteen |
| `components/KeyPicker.tsx` | "Key: C" -nappi, joka avaa 12 säveltä ympyrässä |
| `components/Wordmark.tsx` | ScaleSmith-logo piirrettynä SVG-muodoista |
| `assets/brand/*.svg` | Logon ja kuvakkeen lähdetiedostot |
| `assets/*.png` | Sovelluskuvake ja Androidin adaptiivisen kuvakkeen kerrokset |

## 2. Miksi näin

### Värit roolin mukaan, ei värikoodeina

Jokainen ruutu kysyy "mikä on tekstin väri?" eikä "mikä on #f7efe3?". Tiedostossa `colors.ts` on kaksi saman muotoista oliota, `darkColors` ja `lightColors`. Teeman vaihto tarkoittaa vain, kumpi olio annetaan ruuduille.

Tämä kannatti heti: kun koko sovellus vaihdettiin kylmästä harmaasta lämpimään, muutos oli **yksi tiedosto**. Jos värikoodit olisi kirjoitettu suoraan ruutuihin, jokainen tiedosto pitäisi käydä läpi ja joku jäisi varmasti huomaamatta.

Vaihtoehtoja:
- **Värikoodit suoraan tyyleihin**: nopein alussa, tuskallisin muuttaa.
- **Valmis teemakirjasto** (esim. React Native Paper): paljon valmista, mutta tuo oman ulkonäkönsä ja ison riippuvuuden.
- **Oma pieni Context** (valittu): muutama rivi, täysi hallinta.

### Mikä vaihtuu teeman mukana ja mikä ei

Vain taustat, pinnat ja tekstit vaihtuvat. **Sävelten värit, otelauta ja kvinttiympyrä pysyvät samoina**, koska ne ovat soittajalle tietoa: punainen tarkoittaa aina pohjasäveltä. Jos merkitys vaihtuisi teeman mukana, soittaja joutuisi opettelemaan sen kahdesti.

### Brändiväri säästeliäästi

Logon punainen on lähes sama kuin pohjasävelen punainen. Siksi punaista käytetään käyttöliittymässä vain **pääpainikkeessa** (Lock). Valinnat ovat kermanvärisiä (tumma teema) tai tummanruskeita (vaalea teema), jotta ne eivät näytä säveliltä. Harvoin käytetty väri tuntuu tärkeältä. Kaikkialla oleva väri muuttuu taustaksi.

### Yksi vaaka-asettelu kahdelle sivulle

Skaalasivu ja harjoitusnäkymä näyttävät samalta, koska molemmat käyttävät `FretboardStage`-komponenttia. Se saa **paikat** propseina: `back` (paluunappi), `controls` (valikot), `fretboard` (mitä otelauta näyttää) ja `status` (tilarivi). Sivu päättää sisällön, `FretboardStage` asettelun. Kun asettelua muutettiin (esim. otelauta keskelle), muutos tuli molemmille sivuille kerralla.

### Logo koodina, ei kuvana

Logo on piirretty `react-native-svg`:n muodoilla eikä ladattu PNG-kuvana. Vektorimuoto pysyy terävänä kaikilla näytöillä, ja sen voi tarvittaessa värittää koodissa. Kirjaimet on muutettu muodoiksi, joten sovellus ei tarvitse fonttia lainkaan.

## 3. Tärkeimmät kohdat

### Teeman valinta (`ThemeContext.tsx`)

```ts
const phoneScheme = useColorScheme(); // 'dark', 'light' tai null
const scheme = preference === 'system' ? (phoneScheme === 'light' ? 'light' : 'dark') : preference;
```

- `useColorScheme()` kertoo puhelimen asetuksen ja päivittyy, kun käyttäjä vaihtaa sen.
- Jos käyttäjä valitsi "Puhelimen mukaan", käytetään puhelimen arvoa. Tumma on oletus, jos puhelin ei kerro mitään.
- Muuten käytetään käyttäjän valintaa. Valinta tallennetaan samalla `saveJson`-funktiolla kuin soitin (luku 4).

### Teemaan sidotut tyylit (`useThemedStyles`)

```ts
export function useThemedStyles<T>(makeStyles: (colors: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [colors, makeStyles]);
}
```

Jokaisessa ruudussa on funktio `makeStyles(colors)`, joka rakentaa tyylit väreistä. `useMemo` muistaa tuloksen ja rakentaa tyylit uudelleen **vain kun teema vaihtuu**, ei jokaisella piirtokerralla. `makeStyles` on tiedoston alimmalla tasolla (ei komponentin sisällä), jotta se on joka kerta sama funktio eikä `useMemo` luule sitä uudeksi.

### Kääntö vaakaan (`useLandscape`)

```ts
useEffect(() => {
  lockLandscape();
  return lockPortrait;
}, []);
```

`useEffect`in palauttama funktio on **siivousfunktio**: React kutsuu sitä, kun ruutu suljetaan. Näin kääntö takaisin pystyyn ei voi unohtua, vaikka ruudusta poistuttaisiin millä tavalla tahansa (nappi, Androidin paluuele).

### Otelauta leveyden mukaan (`FretboardStage.tsx`)

```ts
const fitted = Math.floor((width - 2 * SIDE_PADDING - fixedWidth) / instrument.frets);
const fretWidth = Math.max(30, Math.min(46, fitted));
```

Vapaa leveys jaetaan nauhojen määrällä. `Math.min(46, …)` estää liian leveät nauhat tabletilla ja `Math.max(30, …)` liian kapeat pienellä puhelimella. Tätä kutsutaan **rajaamiseksi** (clamp).

### Brändiväri roolina (`colors.ts`)

```ts
/** The logo's hot rod red, kept for the main action on a screen (e.g. Lock) so it stands out. */
brand: string;
/** Text on top of the brand red. */
onBrand: string;
```

Uusi rooli lisättiin tyyppiin `Colors`. TypeScript vaati heti arvon molempiin teemoihin, joten kumpikaan ei voinut unohtua.

### Androidin adaptiivinen kuvake

Android leikkaa kuvakkeen puhelimen mallin mukaan ympyräksi tai pyöristetyksi neliöksi, ja näkyviin jää vain noin kaksi kolmasosaa kuvan keskeltä. Siksi kuvake on kahtena kerroksena (`android-icon-background.png` ja `android-icon-foreground.png`), ja etukerroksen S on pienempi kuin tavallisessa kuvakkeessa. Yksivärinen `android-icon-monochrome.png` on puhelimen teemoitettuja kuvakkeita varten.

Expo Gossa näkyy aina Expo Gon oma kuvake. Oma kuvake ja nimi näkyvät vasta omassa asennuspaketissa (`eas build`).

## 4. Muista aina

- **Nimeä värit roolin mukaan** (tausta, teksti, valinta), älä sävyn mukaan (keltainen). Silloin sävyn voi vaihtaa koskematta ruutuihin.
- **Tieto ei vaihda väriä teeman mukana.** Jos väri kertoo jotain (pohjasävel), se pysyy samana kaikissa teemoissa.
- **Brändiväriä vähän.** Yksi tärkein nappi ruudulla, ei kaikkea.
- **Siivoa jälkesi `useEffect`issä.** Jos efekti muuttaa jotain ruudun ulkopuolella (näytön suunta, ajastin), palauta siivousfunktio.
- **Rajaa lasketut koot** `Math.min`illä ja `Math.max`illa, niin asettelu kestää pienet ja isot näytöt.
- **Kuvakkeen tärkeä sisältö keskelle.** Reunat voivat leikkautua pois.

## 5. Kokeile itse

1. Avaa `src/theme/colors.ts` ja vaihda tumman teeman `accent` esimerkiksi arvoon `'#9fd3c7'` (mintunvihreä). Käynnistä sovellus. Missä kaikkialla väri vaihtui? Palauta lopuksi alkuperäinen arvo.
2. Mitä tapahtuisi, jos `useLandscape`ista poistaisi rivin `return lockPortrait;`?
3. Nauhojen määrä on 22 ja vapaa leveys 700. Mikä on `fretWidth`? Entä jos vapaa leveys on 1300?
4. Lisää tyyppiin `Colors` uusi rooli `danger: string;`, mutta älä lisää sille arvoa. Aja `npx tsc --noEmit`. Mitä TypeScript sanoo? Poista lopuksi rivi.

<details><summary>Vastaukset</summary>

1. Väri vaihtui kaikkialla, missä on valinta: valitut soitin- ja virekortit, valittu Major/Minor-nappi, kvinttiympyrän valittu sävellaji ja Key-ympyrän valittu sävel. Yhtään ruututiedostoa ei tarvinnut muuttaa.
2. Ruutu kääntyisi vaakaan, mutta ei enää takaisin pystyyn. Valikko jäisi vaakatasoon, kun skaalasivulta palataan.
3. 700 / 22 = 31,8 → alaspäin pyöristettynä 31, joka on välillä 30–46, joten `fretWidth` = 31. Arvolla 1300: 1300 / 22 = 59, mutta `Math.min(46, 59)` = 46, joten nauhat eivät veny liian leveiksi.
4. TypeScript ilmoittaa, että `darkColors`-oliosta ja `lightColors`-oliosta puuttuu ominaisuus `danger`. Tyyppi pakottaa pitämään molemmat teemat täydellisinä.

</details>
