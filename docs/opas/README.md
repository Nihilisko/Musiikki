# Opas: näin sovellus on rakennettu

Nämä tiedostot selittävät sovelluksen koodin vaihe vaiheelta. Jokaisessa luvussa on:

1. **Mitä koodi tekee**: tiedostot ja niiden tehtävät
2. **Miksi näin**: valitut ratkaisut ja niiden vaihtoehdot
3. **Tärkeimmät kohdat**: oleelliset koodirivit selitettyinä
4. **Muista aina**: säännöt, jotka pätevät muissakin projekteissa
5. **Kokeile itse**: pieni tehtävä omatoimiseen harjoitteluun

## Luvut

| # | Luku | Aiheet |
|---|---|---|
| 1 | [Otelauta ja soittimet](01-otelauta.md) | Expo, komponentit, props, tila, tyylit, MIDI-numerot |
| 2 | [Skaalat ja moodit](02-skaalat.md) | Intervallit, jakojäännös, valinnaiset propsit, taulukkometodit |
| 3 | [Navigointi ja yhteinen tila](03-navigointi.md) | Expo Router, navigointipino, Context |
| 4 | [Valintojen tallentaminen](04-tallennus.md) | AsyncStorage, async/await, useEffect, lataustila |
| 5 | [Teoriamoottori](05-teoriamoottori.md) | Asteet, oikeat nimet, asemat, arpeggiot, kvinttiympyrä, SVG, refaktorointi |
| 6 | [Teema, vaakanäkymät ja brändi](06-teema-ja-brandi.md) | Väriroolit, teeman valinta, useMemo, siivousfunktio, yhteinen asettelu, logo ja kuvake |
| 7 | [Ääni: metronomi ja viritin](07-aani-metronomi-viritin.md) | expo-audio, ajoitus tavoiteajasta, useRef, YIN-tunnistus, sentit, mediaani, saavutettavuus |
| 8 | [Omat skaalat, soinnut, triadit ja avoimet vireet](08-soinnut-ja-omat-skaalat.md) | Tietorakenteet, rekursiivinen haku, pisteytys, käännökset, datan tarkistus |
| 9 | [Teoriatyökalut](09-teoriatyokalut.md) | Tekstin jäsentäminen, sävellajin arvaus, transponointi, capo, eroteltu unioni |
| 10 | [Taustasoitto](10-taustasoitto.md) | Itse tehdyt äänet, askelruudukko ja svengi, inhimillisyys, häivytys, selaimen rajat, bassolinjat |
| 11 | [CAGED](11-caged.md) | Siirrettävät muodot, suhteellinen kirjoitus, vireen tarkistus, skaala muodon ympärillä |
| 12 | [Korvaharjoitukset](12-korvaharjoitukset.md) | Refaktorointi, yhteinen koukku, vanhan tallenteen luku, ajastettu jono, äänenkuljetus |
| 13 | [Opiskelupeli](13-opiskelupeli.md) | Valinnaiset propsit, Set ja Map, säännöt erillään näkymästä, aika tavoitehetkestä, satunnaisuuden testaus |
| 14 | [Slide-intonaatiotreeni](14-slide-treeni.md) | Koodin uudelleenkäyttö, oletusarvot, puhtaat funktiot, palaute monella tavalla |

## Sovelluksen ajaminen

```powershell
npm install        # asentaa kirjastot (vain ensimmäisellä kerralla ja kun niitä lisätään)
npx expo start     # käynnistää kehityspalvelimen, lue QR-koodi Expo Go -sovelluksella
npx tsc --noEmit   # tarkistaa tyypit: löytää virheet ennen kuin sovellus kaatuu
```

## Sanasto

| Sana | Merkitys |
|---|---|
| **Komponentti** | Funktio, joka palauttaa palan käyttöliittymää, esim. `<Fretboard />` |
| **Props** | Tiedot, jotka annetaan komponentille ulkopuolelta, kuin funktion parametrit |
| **Tila (state)** | Tieto, joka voi muuttua, esim. valittu soitin. Kun tila muuttuu, ruutu piirretään uudelleen |
| **Hook (koukku)** | `use`-alkuinen funktio, jolla komponentti saa käyttöönsä Reactin ominaisuuksia, esim. `useState` |
| **TypeScript** | JavaScript, jossa on tyypit. Kertoo virheistä jo ennen kuin koodia ajetaan |
| **Väriroolit** | Värit nimetty käyttötarkoituksen mukaan (tausta, teksti, valinta), jotta teeman voi vaihtaa yhdestä paikasta |
| **Siivousfunktio** | Funktio, jonka `useEffect` palauttaa. React kutsuu sitä, kun ruutu suljetaan |
| **Sentti** | Sadasosa puolisävelaskelta. Viritin kertoo poikkeaman sentteinä |
| **useRef** | "Laatikko", jonka sisältöä voi vaihtaa piirtämättä ruutua uudelleen |
| **Rekursio** | Funktio, joka kutsuu itseään pienemmälle osaongelmalle, esim. kieli kerrallaan |
| **Svengi (swing)** | Iskun "ja" osuu myöhemmäksi kuin puoliväliin: pitkä–lyhyt |
| **Konvoluutio** | Laskutoimitus, jolla kuivaan ääneen lisätään huoneen kaiku |
| **Eroteltu unioni** | Tyyppi, jonka vaihtoehdot erotetaan kentällä (esim. `type: 'list'`) |
| **Refaktorointi** | Koodin rakenteen parantaminen niin, että se toimii kuten ennen, esim. toistuvan koodin siirto yhteen paikkaan |
| **Puhdas funktio** | Funktio, joka laskee tuloksen pelkistä parametreistaan eikä muuta mitään muuta; helppo testata |
| **Suhteellinen sävelkorva** | Kyky tunnistaa sävel suhteessa sävellajiin (esim. "tämä on 5") |
| **JSX** | HTML:ää muistuttava merkintätapa JavaScriptin sisällä: `<Text>Hei</Text>` |
