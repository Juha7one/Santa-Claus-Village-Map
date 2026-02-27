# Santa Claus Village - Karttasovellus: Projektin Yhteenveto

Tämä asiakirja on laadittu ylläpidon ja jatkokirjauksen tueksi. Se selittää sovelluksen nykyisen tilan, tekniset ratkaisut ja ylläpitoprosessit.

Sovellus on interaktiivinen karttapalvelu, joka auttaa vierailijoita löytämään palveluita, aktiviteetteja ja majoitusta Pajakylän alueelta. Se yhdistää dynaamiseen WordPress-sisältöön ja Supabase-tietokantaan.

Kaikki karttapisteet hallitaan ja sijaitsevat Supabase-tietokannassa. Alkuperäiset KML-tiedostot on migratoitu tietokantaan, jotta niitä voidaan muokata ja poistaa vapaasti sovelluksen kautta. Kävelyreitit hallitaan edelleen [uMap-palvelussa](https://umap.openstreetmap.fr/fi/map/santa-claus-village_1313483#13/66.538458/25.800018) ja ladataan KML-tiedostoina.

## 2. Keskeiset Ominaisuudet
- **Onboarding (Opastus)**: Uusille käyttäjille tarkoitettu 5-vaiheinen visuaalinen opastus, joka käyttää "spotlight"-efektiä korostamaan tärkeimpiä käyttöliittymäelementtejä.
- **Dynaaminen Synkronointi (WP-Sync)**: Sovellus lukee tiedot suoraan WordPressistä (`santaclausvillage.info`). Se hakee nimet, kuvaukset, aukioloajat ja kuvat automaattisesti.
- **Omat Paikat & Reititys**: Käyttäjät voivat merkitä oman autonsa, majapaikkansa ja suosikkikohteensa. Sovellus laskee optimaalisen reitin näiden kohteiden välille.
- **Monikielisyys**: Tukee 10 kieltä. Sovellus tunnistaa automaattisesti käyttäjän selaimen kielen ja vaihtaa käyttöliittymän sille välittömästi. WordPressistä puuttuvat käännökset (kuten japani tai ruotsi) generoidaan automaattisesti tekoälykäännöksenä.
- **Alueen hallinta**: "Pajakylä vs. Kaikki" -toggle, joka rajaa näkymän joko ydinpajakylään tai kaikkiin alueen palveluihin. Kävelykeskustaa ja ympäröiviä alueita käsitellään kartalla eri tavalla optimaalisen käyttäjäkokemuksen varmistamiseksi.
- **Turvallinen Reititys**: Pajakylän alueen sisällä käytetään turvallisia, etukäteen määriteltyjä reittejä. Nämä ohjaavat matkailijoita käyttämään virallisia reittejä esimerkiksi valtatien ylityksissä, välttäen vaarallisia oikopolkuja.
- **Älykäs Navigaatio**: Sovellus kertoo käyttäjälle parkkipaikan sijainnin suhteessa päätepisteeseen ja laskee erikseen sekä ajo- että kävelymatkan, jotta perille pääsy on mahdollisimman vaivatonta.
- **Älykäs Haku**: Palveluita voi hakea kaikkilla kielillä ja kartta zoomaa reaaliajassa hakutuloksiin.

## 3. Tekniikka ja Tietovirta
- **Frontend**: React + Vite + Tailwind CSS.
- **Karttamoottori**: Leaflet.js.
- **Tietokanta**: Supabase (käytetään kohteiden tallentamiseen ja suosikkien hallintaan).
- **Käännökset**: Google Cloud Translation API (käytetään dynaamiseen sisällön kääntämiseen WordPressistä).
- **Hosting**: Netlify.
- **Verkko-osoite**: [https://merry-pastelito-8b7918.netlify.app/](https://merry-pastelito-8b7918.netlify.app/)

## 4. Tuetut kielet (Languages)
Sovellus tukee tällä hetkellä seuraavia kieliä:
- **fi**: Suomi (Finnish)
- **en**: Englanti (English)
- **de**: Saksa (German)
- **fr**: Ranska (French)
- **es**: Espanja (Spanish)
- **it**: Italia (Italian)
- **sv**: Ruotsi (Swedish)
- **ja**: Japani (Japanese)
- **zh**: Kiina (Chinese)
- **ko**: Korea (Korean)

## 5. Ylläpito-ohjeet (Admin-käyttäjälle)
Ylläpitotila voidaan aktivoida tällä tavalla:
1. Lisäämällä verkkosivun osoitteen perään parametrin `?admin=true` (esim. `.../index.html?admin=true`).

### Uuden kohteen lisääminen:
1. Avaa ylläpitopaneeli.
2. Klikkaa karttaa kohtaan, johon haluat merkin.
3. Syötä WordPress-linkki (URL) ja paina **Sync**.
4. Järjestelmä hakee tiedot, kääntää ne ja täyttää kentät.
5. Tarkista tiedot ja paina **Save To DB**.

### Massasynkronointi (Bulk Sync):
Ylläpitopaneelin alareunassa on **Bulk Sync** -painike. Se käy läpi kaikki kartan kohteet ja päivittää niiden tiedot WordPressistä. Tämä on hyvä ajaa esimerkiksi kerran kuukaudessa, jotta aukioloajat ja kuvaukset pysyvät ajan tasalla.

## 6. Varausominaisuus (Booking URL)
Olemme optimoineet varauspainikkeen toimintaa:
- **Varaa-nappi** näkyy vain, jos kohteelle on syötetty manuaalisesti tai synkronoitu `Booking URL`.
- Ravintoloille tämä näkyy "Varaa Pöytä"-painikkeena ja muille "Varaa"-painikkeena.
- Synkronoinnin aikana WordPressin "Website"-linkki asetetaan oletuksena varaussivuksi.
- Jos poistat linkin editorissa, painike poistuu näkyvistä.

## 7. Viimeisimmät Parannukset (Helmikuu 2026)
- **Älykäs Monikielinen Haku**: Haku toimii nyt universaalisti kaikilla 10 kielellä. Se etsii osumia nimestä, kuvauksesta ja kategorioista riippumatta siitä, mikä kieli käyttöliittymässä on valittuna.
- **Reaaliaikainen Karttapalaute**: Hakua kirjoitettaessa kartta zoomaa automaattisesti hakutuloksiin ja himmentää muut kohteet selkeyden vuoksi.
- **Käyttöliittymän Vakaus (Pop-upit)**: Lisätty skeleton-lataustilat kuville estämään tekstin "hyppimistä" ja poistettu tarpeettomat "No details available" -tekstit.
- **Parannettu Zoom-logiikka**: "Village" ja "All" -painikkeet on optimoitu toimimaan saumattomasti myös silloin, kun kohde-ikkuna on auki tai se on juuri suljettu. Aluevalinta on oletuksena aktiivinen heti latauksessa.
- **Erikoismerkkien korjaus**: WordPressistä tulevat nimet (esim. heittomerkit) puretaan HTML-koodeista oikeaan muotoon automaattisesti.

## 8. Jatkokehitysideat
- **Offline-tila**: Kartan lataaminen välimuistiin huonoja verkkoyhteyksiä varten.
- **Palautejärjestelmä**: Vierailijat voivat jättää tähtiä tai kommentteja kohteista.

---
*Päivitetty: 27. Helmikuuta 2026*
