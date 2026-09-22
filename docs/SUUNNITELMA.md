# Suunnitelma

Muusikon harjoitussovellus kielisoittimille. Tavoite: keskitason soittaja ei tarvitse muita sovelluksia, paitsi tab- ja biisikirjastoja.

**Soittimet:** kitara, basso, ukulele, 12-kielinen, sikarilaatikkokitara, slide
**Kieli:** englanti ensin, suomi ehkä myöhemmin
**Alusta:** Android ensin (React Native + Expo), iPhone myöhemmin samalla koodilla

## Tehdyt päätökset

| Aihe | Päätös |
|---|---|
| Rakenne | Soitin → vire → valikko (isot ruudut). Ei alapalkkia |
| Avaus toisella kerralla | Suoraan valikkoon, soitin ja vire muistetaan |
| Kirjautuminen | Ei vielä. Lisätään, kun tulee premium tai synkronointi |
| Sävelten merkinnät | Nimet (C, D, E), asteet (1, ♭3, 5) tai molemmat |
| Blue notes | Käyttäjä valitsee, mitkä näytetään: ♭3, ♭5, ♭7. Väri sininen |
| Sävelten värit | Roolin mukaan (pohjasävel, skaalan sävelet, blue notes), valmiista paletista. Oletukset: pohjasävel punainen, skaalan sävelet vihreä, blue notes sininen |
| Otelaudan puulajit | Ruusupuu, vaahtera, paahdettu vaahtera, pau ferro, valkoinen |
| Omat skaalat | Luo, muokkaa, poista |
| Kvinttiympyrä | Oma sivunsa valikossa. Ulkokiekko pyörii, sisämaski (Major/Minor, I–vii°) pysyy paikallaan, kuten fyysisessä kvinttiympyrässä. Valittu sävellaji lukitaan ja muistetaan |
| Harjoitusnäkymä | Lock-nappi lukitsee sävellajin ja avaa harjoitusnäkymän, joka kääntyy automaattisesti vaakaan (ja takaisin pystyyn, kun palataan). Koko kaula mahtuu leveydelle. Yläreunassa yksi rivi: ‹ Circle -nappi, kierto-, sointu- ja merkintävalikot sekä asemalaskuri − 0 + (0 = koko kaula). Valittu asema kirkkaana, muu kaula himmeänä |
| Sointukierrot | Kvinttiympyrästä valitaan kierto (12-tahtinen blues, pop I–V–vi–IV, jazz ii–V–I, 50-luku I–vi–IV–V). Jokainen sointu on päälle/pois-kytkin, ja otelauta näyttää päällä olevien sointujen arpeggiot |
| Kierron värit | Väri kuuluu funktiolle (I aina sama väri sävellajista riippumatta). Yhteiset sävelet kaksivärisinä. Kun kaikki soinnut ovat pois päältä, otelauta palaa tavallisiin skaalaväreihin |
| Teema | Asetuksissa Tumma / Vaalea / Puhelimen mukaan (oletus). Vain taustat, pinnat ja tekstit vaihtuvat; sävelten värit, otelauta ja kvinttiympyrä pysyvät samoina |
| Premium | Päätetään myöhemmin, kun sovellus on pidemmällä. Ei saa estää käyttöönottoa alussa |
| Ei tehdä | Tabieditori, biisikirjasto, videotunnit |

## Vaiheet

✅ = valmis

| # | Vaihe | Sisältö |
|---|---|---|
| 1 ✅ | Otelauta | Soittimet ja vireet, sävelet otelaudalla |
| 2 ✅ | Skaalat | 13 skaalaa ja moodia missä tahansa sävellajissa |
| 3 ✅ | Navigointi | Soitin → vire → valikko |
| 3c ✅ | Muistaminen | Soitin ja vire tallentuvat, avaus suoraan valikkoon |
| 4 ✅ | Skaalojen syventäminen | (a) ✅ nimet/asteet, (b) ✅ oikeat ♭/# -nimet sävellajin mukaan, (c) ✅ blue notes, (d) ✅ asemat: pentatonisen boksit ja 3 säveltä kielellä, (e) ✅ arpeggiot, (f) ✅ kvinttiympyrä ja sointukierrot otelaudalla |
| 5 | Asetukset | (a) ✅ asetussivu ja teema, (b) otelaudan puulaji, (c) sävelten värit. Valinnat tallentuvat |
| 6 | Omat skaalat | Luo, muokkaa, poista |
| 7 | Soinnut | Triadit, inversiot, sointukirjasto otteineen (ukulele). Avoimen virityksen sointukartta (sikarilaatikko, slide) |
| 8 | CAGED | Viisi muotoa kitaralle |
| 9 | Teoria | Teoriamuistiot (linkki kvinttiympyrään), sävellajin soinnut, capo- ja transponointilaskin (kitara, 12-kielinen) |
| 10 | Metronomi | Tempo, tahtilaji, korostukset |
| 11 | Taustasoitto | Drone, sointukierrot rumpukompeilla, bassolinjat (basso), rämpytyskuviot (ukulele) |
| 12 | Korvaharjoitukset | Sävelet, intervallit, sointutyypit, harmonisointi |
| 13 | Opiskelupeli | Inversiot, harmoniat ja skaalat visuaalisena pelinä |
| 14 | Viritin | Kaikki vireet, 12-kielisen oktaavikielet erikseen, slide-intonaatiotreeni. Vaatii oman testiversion (APK) |
| 15 | Suomen kieli | Jos päätetään tehdä |
| 16 | Premium-päätös | Mitä maksun taakse. Kandidaatti: hidastus, A–B-luuppi, äänitys |
| 17 | Julkaisu | Nimi, ikoni, Play Kauppa |

Jokainen vaihe tehdään pieninä paloina, jotka testataan ennen seuraavaa.
