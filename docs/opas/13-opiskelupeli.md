# Luku 13: Opiskelupeli – napautettava otelauta ja minuutin haaste

Vaiheessa 13 tehtiin **Neck game**, jossa etsitään säveliä, asteita ja sointujen säveliä omalta kaulalta napauttamalla. Siinä on harjoitustila ja minuutin aikahaaste, jonka ennätykset tallentuvat.

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `components/Fretboard.tsx` | Kaksi uutta valinnaista ominaisuutta: `onCellPress` ja `cellMarks` |
| `music/neckGame.ts` | Tehtävät tasoittain, oikeat solut ja tehtävän alue |
| `music/challenge.ts` | Aikahaasteen säännöt: jäljellä oleva aika, kello, ennätys |
| `app/neck-game.tsx` | Pelinäkymä vaakatasossa |

## 2. Miksi näin

### Vanhaan komponenttiin valinnaisia ominaisuuksia

Otelauta oli jo valmis ja monessa käytössä. Uutta pelilautaa ei tehty, vaan otelautaan lisättiin kaksi **valinnaista** propsia. Jos niitä ei anneta, otelauta toimii täsmälleen kuten ennen, joten muut näkymät eivät muuttuneet lainkaan.

### Tehtävät, jotka yhdistävät teorian kaulaan

"Tap every 5 of G major" vaatii kaksi asiaa: pitää ensin päätellä sävel (D) ja sitten löytää se. Näin teoria ja kaula kytkeytyvät yhteen. Sointutehtävät rajataan neljän nauhan alueelle, koska soitossa sointu otetaan yhdestä käden asemasta.

### Säännöt erillään näkymästä

Aikahaasteen säännöt (paljonko aikaa on jäljellä, onko tulos ennätys) ovat tiedostossa `challenge.ts` puhtaina funktioina. Niitä voi testata ilman puhelinta ja ilman minuutin odottamista.

### Kello lasketaan loppuhetkestä

Kello ei vähennä sekuntia kerrallaan. Se tallentaa hetken, jolloin minuutti loppuu (`endsAt`), ja laskee jäljellä olevan ajan siitä. Myöhässä tulevat ajastimet eivät siksi siirrä loppua.

## 3. Tärkeimmät kohdat

### Napautus ja merkinnät (`Fretboard.tsx`)

```tsx
<Pressable
  disabled={!onCellPress}
  onPress={() => onCellPress?.(index, fret)}
  ...
>
  {cellMarks?.has(cellKey(index, fret)) && <MarkDot mark={...} name={...} />}
```

- `?.` kutsuu funktiota vain, jos se on annettu.
- `disabled` estää napautuksen muissa näkymissä, joissa peliä ei ole.
- `cellKey(string, fret)` on sama avain, jota käytettiin jo skaala-asemissa ("2:5"). Näin `Set` ja `Map` löytävät solun nopeasti.

### Tehtävän oikeat solut (`neckGame.ts`)

```ts
strings.forEach((open, string) => {
  for (let fret = task.fromFret; fret <= task.toFret; fret++) {
    if (task.pcs.includes(pitchClass(open + fret))) cells.add(cellKey(string, fret));
  }
});
```

Jokaiselta kieleltä käydään läpi tehtävän nauhat, ja solu on oikea, jos sen sävelluokka on haettujen joukossa. Kun kaikki oikeat on löydetty (`found.size === targets.size`), tehtävä on valmis.

### Bugi, jonka testi löysi

```ts
// Väärin: pick() arvotaan uudelleen jokaisen vertailun kohdalla
CHORD_TYPES.find((c) => c.symbol === pick(CHORD_SYMBOLS));
// Oikein: arvo ensin, vertaa sitten
const symbol = pick(CHORD_SYMBOLS);
CHORD_TYPES.find((c) => c.symbol === symbol);
```

`find` kutsuu funktiota kerran jokaiselle soinnulle, joten satunnaisluku vaihtui joka kerta, ja joskus mikään ei täsmännyt. Tuhansien arvontojen testi paljasti vian heti.

### Ennätys omassa efektissään

```ts
useEffect(() => {
  if (!challenge.finished) return;
  const record = isRecord(challenge, bests[levelKey]);
  setRecordMade(record);
  if (record) setBests((b) => ({ ...b, [levelKey]: challenge.score }));
}, [challenge.finished]);
```

Kun haaste päättyy, tarkistetaan erikseen, syntyikö ennätys. Tieto tallennetaan (`recordMade`), jotta tasapeli vanhan ennätyksen kanssa ei näytä virheellisesti "New record!".

## 4. Muista aina

- **Laajenna olemassa olevaa komponenttia valinnaisilla propseilla**, kun tarve on lähellä. Oletuksena komponentin pitää toimia kuten ennen.
- **Pidä säännöt erillään näkymästä**, niin ne voi testata.
- **Laske aika tavoitehetkestä**, älä vähentämällä askel kerrallaan.
- **Testaa satunnaisuutta monella arvonnalla.** Yksi kokeilu voi mennä sattumalta oikein.

## 5. Kokeile itse

1. Bassossa (E A D G) etsitään kaikki E:t nauhoilta 0–12. Montako oikeaa solua on?
2. Mitä `secondsLeft` palauttaa, kun haaste alkoi hetkellä 1000 ja nyt on 30 500? (`endsAt` = alku + 60 000.)
3. Miksi sointutehtävissä alueen ulkopuolisista napautuksista ei tule hutia?
4. Muuta tiedostossa `neckGame.ts` tason 3 asteet `[0, 2, 4]` muotoon `[0, 4]` (vain 1 ja 5). Miten tehtävät muuttuvat? Palauta lopuksi.

<details><summary>Vastaukset</summary>

1. **5**: E-kielellä 0 ja 12, A-kielellä 7, D-kielellä 2 ja G-kielellä 9.
2. `ceil((61 000 − 30 500) / 1000)` = **31** sekuntia.
3. Tehtävä koskee vain valittua aluetta, joten kaikki sen ulkopuoliset napautukset jätetään huomiotta (`if (!area.has(key)) return`). Alueen ulkopuolella on myös soinnun oikeita säveliä, eikä niistä kuulu rangaista.
4. Indeksit viittaavat asteikon asteisiin (0 = 1, 2 = 3, 4 = 5), joten tehtävissä kysytään enää asteita 1 ja 5, ei 3:a.

</details>
