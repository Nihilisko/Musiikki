# Julkaisun tarkistuslista (Google Play)

Tarkistettu syyskuussa 2026. Googlen vaatimukset muuttuvat usein, joten tarkista kohdat uudelleen ennen julkaisua. Rastittava versio: https://claude.ai/artifact/Ptm5fHjw1R2VubP2ZUWvg2

**Sinä** = omistaja tekee (tilit, päätökset, lomakkeet). **Claude** = tehdään koodissa.

## A. Tilit ja päätökset

- [ ] **Sinä** – Google Play Console -kehittäjätili (henkilötili): 25 $ kertamaksu ja henkilöllisyyden vahvistus (nimi, osoite, puhelin, henkilöllisyystodistus). Sama vahvistus kattaa Androidin uuden kehittäjävarmennuksen, joka koskee vuodesta 2026 alkaen myös Play-kaupan ulkopuolisia sovelluksia.
- [ ] **Sinä** – Tavaramerkkihaku nimelle ScaleSmith: EUIPO eSearch, USPTO, WIPO Global Brand Database ja haku Play-kaupasta. Varanimi mietitään, jos nimi on varattu musiikki- tai ohjelmistoluokissa.
- [ ] **Sinä** – Premiumin hinta (kertamaksu, suunta 4,99–9,99 €).
- [ ] **Yhdessä** – Tietosuojaseloste julkiseen osoitteeseen (esim. GitHub Pages). Se on pakollinen, koska sovellus pyytää mikrofonin käyttöä. Teksti on valmis: `docs/store/privacy-policy.html` (ja `.md`). Täytä nimesi, päivämäärä ja sähköposti, ja julkaise sivu.

## B. Sovellus (koodi)

- [x] **Claude** – Sisäinen tunnus (`slug`) "musiikki" → "scalesmith". Paketin nimi `com.scalesmith.app` on jo valmis.
- [x] **Claude** – Versionumero ja `versionCode`, joka kasvaa automaattisesti EAS-buildissa.
- [x] **Claude** – Käynnistyskuva (splash screen): punainen tausta ja kermanvärinen S.
- [x] **Claude** – Kohde-API 36 (vaatimus 31.8.2026 alkaen). Expo SDK 57 käyttää sitä oletuksena.
- [x] **Claude** – Luvat: paketissa on vain mikrofoni (RECORD_AUDIO, MODIFY_AUDIO_SETTINGS) ja INTERNET. Taustatoisto on pois päältä, ja ylimääräiset oletusluvat (tallennustila, SYSTEM_ALERT_WINDOW, VIBRATE, foreground service) on estetty. Tarkistettu Expon manifestista.
- [ ] **Claude** – Premium-lukitus (pelit ja treenit) ja kertaosto Google Playn kautta. Google Play Billing Library 8 tai uudempi (vaatimus 31.8.2026 alkaen). Vaatii kehitysversion, sillä se ei toimi Expo Gossa.
- [x] **Claude** – Tuotantoprofiili tekee AAB-paketin (`eas.json` production). Allekirjoitus hoidetaan Play App Signingilla.

## C. Testaus

- [ ] **Sinä** – APK omaan puhelimeen: `npx eas-cli@latest build -p android --profile preview`. Testaa erityisesti viritin, slide-treeni, taustasoitto ja korvaharjoitukset. Commitoi EAS:n luoma projectId.
- [ ] **Sinä** – Sisäinen testi Play Consolessa (enintään 100 testaajaa, nopea tapa jakaa kavereille).
- [ ] **Sinä** – Suljettu testi: vähintään **12 testaajaa**, jotka ovat mukana **14 päivää yhtäjaksoisesti**. Tämä koskee 13.11.2023 jälkeen luotuja henkilötilejä. Testaajat kannattaa kerätä ajoissa.
- [ ] **Sinä** – Hakemus tuotantoon suljetun testin jälkeen. Google arvioi hakemuksen, ja se voi kestää päiviä.

## D. Kauppasivu

- [ ] **Yhdessä** – Nimi (enintään 30 merkkiä), lyhyt kuvaus (80) ja pitkä kuvaus (4000). Luonnokset: `docs/store/listing.md` (myös tietoturvaosion vastaukset).
- [ ] **Claude** – Kuvake 512 × 512 PNG, ilman läpinäkyvyyttä.
- [ ] **Claude** – Esittelykuva 1024 × 500 (JPEG tai 24-bittinen PNG, ei läpinäkyvyyttä). Tärkeä sisältö keskelle noin 924 × 400 alueelle.
- [ ] **Yhdessä** – Kuvakaappaukset: 2–8 kpl puhelimesta. Suositus on vähintään 4 kpl, joiden koko on 1080 px tai enemmän.
- [ ] **Sinä** – Kategoria (Music & Audio tai Education) ja yhteyssähköposti.

## E. Play Consolen lomakkeet

- [ ] **Sinä** – Tietoturvaosio (Data safety): mikrofonin ääni käsitellään vain laitteella, eikä mitään kerätä, tallenneta palvelimelle tai jaeta.
- [ ] **Sinä** – Sisällön ikäluokitus (IARC-kysely).
- [ ] **Sinä** – Kohdeyleisö. Jos valitaan alle 13-vuotiaat, Families-käytännön lisävaatimukset koskevat sovellusta.
- [ ] **Sinä** – Mainokset: "ei mainoksia".
- [ ] **Sinä** – Sovelluksen käyttöoikeus (App access): kaikki toimii ilman kirjautumista.

## Lähteet

- Kohde-API: https://support.google.com/googleplay/android-developer/answer/11926878
- 12 testaajaa / 14 päivää: https://support.google.com/googleplay/android-developer/answer/14151465
- Kehittäjävarmennus: https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html
- Billing Library -versiot: https://developer.android.com/google/play/billing/deprecation-faq
