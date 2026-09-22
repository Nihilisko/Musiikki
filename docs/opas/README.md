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
| **JSX** | HTML:ää muistuttava merkintätapa JavaScriptin sisällä: `<Text>Hei</Text>` |
