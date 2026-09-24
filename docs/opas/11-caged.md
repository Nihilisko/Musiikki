# Luku 11: CAGED – viisi sointumuotoa koko kaulalle

Vaiheessa 8 sovellukseen tuli **CAGED-näkymä**. CAGED on kitaristien tapa jakaa kaula viiteen alueeseen. Viittä tuttua avointa duurisointua (C, A, G, E ja D) käytetään siirrettävinä muotoina, ja ne seuraavat toisiaan kaulaa ylöspäin aina samassa järjestyksessä: C → A → G → E → D → C…

## 1. Mitä koodi tekee

| Tiedosto | Tehtävä |
|---|---|
| `music/caged.ts` | Muotojen pohjat, muotojen paikat kaulalla, sävelet muodon ympärillä |
| `app/caged.tsx` | Vaakanäkymä: sävellaji, kaikki muodot tai yksi, kerros (pentatoninen, asteikko, arpeggio) |
| `app/home.tsx` | CAGED-ruutu näkyy vain vireissä, joissa muodot toimivat |

## 2. Miksi näin

### Muodot kirjoitetaan suhteessa pohjasäveleen

Avoin C-sointu on x32010, ja sen pohjasävel C on A-kielen 3. nauhassa. Kun jokainen nauha kirjoitetaan suhteessa pohjasävelen nauhaan, muodosta tulee **siirrettävä**: C-muoto `[null, 0, -1, -3, -2, -3]`. Näin D-duuri C-muodolla löytyy siirtämällä samaa pohjaa kaksi nauhaa ylemmäs.

### Vain vakiovireen kaltaisissa vireissä

Muodot perustuvat kielten väleihin: vakiovireessä ne ovat 5, 5, 5, 4 ja 5 puolisävelaskelta. Alennetuissa vireissä (E♭, D) välit ovat samat, joten muodot toimivat niissäkin. Open G -vireessä tai bassossa ne eivät toimi, joten ruutua ei näytetä ollenkaan. Käyttäjä ei näe nappia, joka ei toimisi hänen soittimellaan.

### Skaala-asema muodon ympärillä

Jokaisen muodon ympärillä on "oma" skaala-asemansa. Sovellus näyttää valitun kerroksen sävelet alueella, joka alkaa nauhan muodon alapuolelta ja päättyy nauhan sen yläpuolelle. Soinnun ja skaalan yhteys näkyy siis heti.

## 3. Tärkeimmät kohdat

### Muodon paikka kaulalla (`caged.ts`)

```ts
let base = pitchClass(root - strings[t.rootString]);
if (base + lowestRel < 0) base += 12;
for (; base + Math.max(...t.frets.map((f) => f ?? 0)) <= frets; base += 12) {
  const cells = t.frets.flatMap((rel, string) =>
    rel === null ? [] : [{ string, fret: base + rel }],
  );
```

- `pitchClass(root - strings[t.rootString])` kertoo, missä nauhassa pohjasävel on muodon pohjasävelkielellä. Esimerkiksi D-duurin C-muoto: D on A-kielellä nauhassa 5.
- Jos muoto menisi nauhan 0 alapuolelle (C- ja G-muodoissa on negatiivisia lukuja), sitä siirretään oktaavi ylemmäs.
- `for`-silmukka lisää saman muodon 12 nauhaa ylemmäs niin kauan kuin se mahtuu kaulalle.
- `flatMap` tekee jokaisesta soivasta kielestä solun ja jättää mykistetyt (`null`) pois.

### Vireen tarkistus

```ts
strings.slice(1).every((s, i) => s - strings[i] === STANDARD_GAPS[i])
```

`slice(1)` ottaa kaikki kielet paitsi alimman, ja jokaista verrataan sen alapuoliseen kieleen (`strings[i]`). `every` palauttaa `true` vain, jos jokainen väli täsmää.

## 4. Muista aina

- **Kirjoita muoto suhteessa johonkin kohtaan**, niin sen voi siirtää minne tahansa. Sama idea toimii intervalleissa, sointuotteissa ja skaaloissa.
- **Älä näytä toimintoa, joka ei toimi.** Piilota se tai selitä, miksi se ei ole käytössä.
- **Yhdistä asiat toisiinsa.** Sointu ja sen ympärillä oleva skaala ovat saman asian kaksi puolta.

## 5. Kokeile itse

1. Kirjoita E-duurin avoin ote (022100) suhteessa pohjasäveleen, joka on matalan E-kielen avoin sävel. Vertaa koodin E-muotoon.
2. Missä nauhassa on **G-duurin E-muoto**? Entä A-muoto?
3. Missä järjestyksessä muodot tulevat G-duurissa, kun aloitetaan avoimesta G-soinnusta?
4. Kokeile sovelluksessa: vaihda vireeksi Open G. Mitä CAGED-ruudulle tapahtuu, ja miksi?

<details><summary>Vastaukset</summary>

1. `[0, 2, 2, 1, 0, 0]`, sama kuin koodissa, koska pohjasävel on nauhassa 0.
2. E-muoto: G on matalalla E-kielellä nauhassa **3**. A-muoto: G on A-kielellä nauhassa **10**.
3. **G → E → D → C → A** (G-muoto nauhoilla 0–3, E-muoto 3, D-muoto 5, C-muoto 7, A-muoto 10). Järjestys on sama C–A–G–E–D-kierto, mutta se alkaa G:stä.
4. Ruutu katoaa, koska Open G:n kielten välit eivät ole 5 5 5 4 5, eivätkä muodot siksi toimi.

</details>
